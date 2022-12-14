import { defineConfig } from "rollup";
import preset from "@lumeweb/relay-plugin-rollup-preset";
import merger from "object-merger";
import hsdBundlePlugin from "./hsdBundlePlugin.js";

export default defineConfig(
  merger(preset(), {
    input: "src/index.ts",
    output: {
      file: "dist/handshake.js",
      format: "cjs",
    },
    plugins: [hsdBundlePlugin],
  })
);
