import type {
  Plugin,
  PluginAPI,
  RPCResponse,
  RPCRequest,
} from "@lumeweb/relay";
// @ts-ignore
import rand from "random-key";
// @ts-ignore
import SPVNode from "hsd/lib/node/spvnode.js";
// @ts-ignore
import { NodeClient } from "hs-client";

async function boot(config: any) {
  let hsdServer: SPVNode;

  let clientArgs = {
    network: "main",
    host: "127.0.0.1",
    port: 12037,
    apiKey: rand.generate(),
  };

  if (!config.bool("hsd-use-external-node")) {
    hsdServer = new SPVNode({
      config: false,
      argv: false,
      env: true,
      noDns: true,
      memory: false,
      httpHost: "127.0.0.1",
      apiKey: clientArgs.apiKey,
      logFile: false,
      logConsole: true,
      logLevel: "info",
      workers: true,
      network: "main",
    });
    hsdServer.on("abort", async (err: any) => {
      const timeout = setTimeout(() => {
        console.error("Shutdown is taking a long time. Exiting.");
        process.exit(3);
      }, 5000);

      timeout.unref();

      try {
        console.error("Shutting down...");
        await hsdServer.close();
        clearTimeout(timeout);
        console.error((err as Error).stack);
        process.exit(2);
      } catch (e: any) {
        console.error(
          `Error occurred during shutdown: ${(e as Error).message}`
        );
        process.exit(3);
      }
    });

    (async () => {
      try {
        await hsdServer.ensure();
        await hsdServer.open();
        await hsdServer.connect();

        hsdServer.startSync();
      } catch (e: any) {
        console.error((e as Error).stack);
      }
    })();
  } else {
    clientArgs = {
      network: config.str("hsd-network-type"),
      host: config.str("hsd-host"),
      port: config.uint("hsd-port"),
      apiKey: config.str("hsd-api-key"),
    };
  }

  return new NodeClient(clientArgs);
}

const plugin: Plugin = {
  name: "handshake",
  async plugin(api: PluginAPI): Promise<void> {
    const client = await boot(api.config);

    api.registerMethod("getnameresource", {
      cacheable: true,
      async handler(request: RPCRequest): Promise<RPCResponse> {
        let resp;
        try {
          resp = await client.execute("getnameresource", request.data);
        } catch (e: any) {
          e = e as Error;
          const eType = e.type.toLowerCase();
          const eMessage = e.message.toLowerCase();

          if (
            eType === "rpcerror" &&
            eMessage.includes("chain is not synced")
          ) {
            throw new Error("NOT_READY");
          }

          throw e;
        }

        return {
          data: resp,
        };
      },
    });
  },
};

export default plugin;
