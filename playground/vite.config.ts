import { defineConfig } from "vite";
import Inspect from "vite-plugin-inspect";
import Unplugin from "../src/vite";
import Markdown from "unplugin-vue-markdown/vite";
import Vue from "@vitejs/plugin-vue";
import Components from "unplugin-vue-components/vite";
import AutoImport from "unplugin-auto-import/vite";
import { NaiveUiResolver } from "unplugin-vue-components/resolvers";
import vueJsx from "@vitejs/plugin-vue-jsx";
import UnoCss from "unocss/vite";

export default defineConfig({
  plugins: [
    UnoCss(),
    Inspect(),
    Unplugin(),
    Vue({
      include: [/\.vue$/, /\.md$/],
    }),
    Markdown({
      /* options */
    }),
    Components({
      dts: "components.d.ts",
      resolvers: [NaiveUiResolver()],
      globs: ["**/*.{vue,tsx,md}"],
      include: [/\.vue$/, /\.vue\?vue/, /\.md$/],
    }),
    AutoImport({
      include: [
        /\.[tj]sx?$/, // .ts, .tsx, .js, .jsx
        /\.vue$/,
        /\.vue\?vue/, // .vue
        /\.md$/, // .md
      ],
      imports: ["vue", "vue-router", "@vueuse/core"],
      dts: "auto-import.d.ts",
      resolvers: [],
    }),
    vueJsx(),
  ],
});
