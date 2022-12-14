import MagicString from "magic-string";
import astMatcher from "ast-matcher";
import path from "path";
import fs from "fs";

export default {
  name: "bundle-hsd-names-db",
  transform(src, id, ast) {
    if (!id.includes("reserved.js")) {
      return false;
    }

    const magicString = new MagicString(src);
    astMatcher.setParser(this.parse);

    if (!ast) {
      try {
        ast = this.parse(src);
      } catch (e) {
        throw e;
      }
    }

    const findNamesDb = astMatcher("const DATA = fs.readFileSync(FILE)");
    const findNamesDbMatches = findNamesDb(ast);

    if (!findNamesDbMatches?.length) {
      return false;
    }

    const dbPath = path.join(path.dirname(id), "names.db");
    const dbData = fs.readFileSync(dbPath);
    magicString.overwrite(
      findNamesDbMatches[0].node.start,
      findNamesDbMatches[0].node.end,
      `const DATA = Buffer.from("${dbData.toString("base64")}","base64")`
    );

    return {
      code: magicString.toString(),
      map: magicString.generateMap({
        source: src,
        includeContent: true,
        hires: true,
      }),
    };
  },
};
