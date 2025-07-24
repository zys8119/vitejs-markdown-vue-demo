import type { UnpluginFactory } from "unplugin";
import type { Options } from "./types";
import { createUnplugin } from "unplugin";
import markdownVueDemo from "./markdown-vue-demo";

export const unpluginFactory: UnpluginFactory<Options | undefined> =
  markdownVueDemo as UnpluginFactory<Options | undefined>;

export const unplugin = /* #__PURE__ */ createUnplugin(unpluginFactory);

export default unplugin;
