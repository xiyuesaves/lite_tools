import globals from "globals";
import pluginJs from "@eslint/js";

export default [
  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.node, electron: true, app: true, lite_tools: true, LiteLoader: true },
    },
  },
  {
    ignores: ["dist/*"],
  },
  pluginJs.configs.recommended,
];
