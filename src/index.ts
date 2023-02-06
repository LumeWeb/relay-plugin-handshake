import type { Plugin, PluginAPI } from "@lumeweb/relay-types";
// @ts-ignore
import rand from "random-key";
// @ts-ignore
import FullNode from "hsd/lib/node/fullnode.js";
import { Proxy, Socket } from "@lumeweb/libhyperproxy";

let server: FullNode;
let api: PluginAPI;

const PROTOCOL = "lumeweb.proxy.handshake";

async function abort(err: any) {
  const timeout = setTimeout(() => {
    api.logger.error("Shutdown is taking a long time. Exiting.");
    process.exit(3);
  }, 5000);

  timeout.unref();

  try {
    api.logger.error("Shutting down...");
    await server.close();
    clearTimeout(timeout);
    api.logger.error((err as Error).stack);
    process.exit(2);
  } catch (e: any) {
    api.logger.error(`Error occurred during shutdown: ${(e as Error).message}`);
    process.exit(3);
  }
}

async function boot(api: PluginAPI) {
  const { pluginConfig: config } = api;

  const apiKey = rand.generate();

  if (!config.bool("external")) {
    server = new FullNode({
      config: false,
      argv: false,
      env: true,
      noDns: false,
      memory: false,
      httpHost: "127.0.0.1",
      apiKey,
      logFile: true,
      logConsole: true,
      logLevel: "info",
      workers: false,
      network: "main",
      bip37: true,
    });
    server.on("abort", abort);

    api.logger.info("API Key %s", apiKey);

    try {
      await server.ensure();
      await server.open();
      await server.connect();

      server.startSync();
    } catch (e: any) {
      api.logger.error((e as Error).stack);
    }
  }
}

const plugin: Plugin = {
  name: "handshake",
  async plugin(_api: PluginAPI): Promise<void> {
    api = _api;
    await boot(api);
    const proxy = new Proxy({
      swarm: api.swarm,
      protocol: PROTOCOL,
    });
    api.swarm.join(api.util.crypto.createHash(PROTOCOL));
    api.protocols.register(PROTOCOL, (peer: any, muxer: any) => {
      proxy.handlePeer({
        peer,
        muxer,
        onopen(socket: Socket) {
          server.pool.server.emit("connection", socket);
        },
      });
    });
  },
};

export default plugin;
