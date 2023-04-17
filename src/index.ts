import type { Plugin, PluginAPI } from "@lumeweb/relay-types";
// @ts-ignore
import rand from "random-key";
// @ts-ignore
import FullNode from "hsd/lib/node/fullnode.js";
import { MultiSocketProxy } from "@lumeweb/libhyperproxy";

let server: FullNode;
let api: PluginAPI;

const PROTOCOL = "lumeweb.proxy.handshake";

const plugin: Plugin = {
  name: "handshake",
  async plugin(_api: PluginAPI): Promise<void> {
    api = _api;
    const proxy = new MultiSocketProxy({
      swarm: api.swarm,
      protocol: PROTOCOL,
      allowedPorts: [44806, 12038],
      server: true,
    });
    api.swarm.join(api.util.crypto.createHash(PROTOCOL));
    api.protocols.register(PROTOCOL, (peer: any, muxer: any) => {
      proxy.handlePeer({
        peer,
        muxer,
      });
    });
  },
};

export default plugin;
