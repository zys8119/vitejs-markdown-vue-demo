import { ModuleNode, Plugin, ViteDevServer } from "vite";
import crypto from "crypto";
import _ from "lodash";
import { resolve } from "path";
import { existsSync, readFileSync } from "fs";
import { Options } from "./types";

function md5(input) {
  return crypto.createHash("md5").update(input).digest("hex");
}

/**
使用方式：

在`markdown`文件中使用````Demo````包裹代码 

```Demo
# Demo标题,必须以`#`或者`title:`开头
## Demo副标题或描述，必须以`##`或者`desc:`开头
@/components/indoor-nav.vue
```
 */
const defaultOptions: Options = {
  // Demo组件接受的props字段
  fieldName: "src",
  // 使用的组件名称
  componentName: "Demo",
  // 导入组件
  importComponent: true,
};

const demoFileHexWeakMap = new WeakMap();
const demoFileHexMap = new Map();
export default function (options?: Options) {
  const config = _.merge({}, defaultOptions, options);
  let serve: ViteDevServer = {} as unknown as ViteDevServer;
  return [
    {
      name: "markdown-vue-demo-pre",
      enforce: "pre",
      configureServer(_serve) {
        serve = _serve;
        _serve.watcher.on("all", (eventName, file) => {
          const mainFiles = demoFileHexMap
            .values()
            .filter((b: any) => [b.mainSrc, b.absoluteSrc].includes(file));
          mainFiles.forEach((info) => {
            // serve.reloadModule(serve.moduleGraph.getModuleById(info.mainSrc));
            serve.reloadModule(
              serve.moduleGraph.getModuleById(
                `virtual:Demo::${demoFileHexWeakMap.get(info)}.ts`
              ) as ModuleNode
            );
          });
        });
      },
      async transform(code, id) {
        if (id.endsWith(".md")) {
          const filesHexs: any[] = [];
          const newcode = code.replace(
            new RegExp(
              `\`{3}${config.componentName.trim()}(\n|\\s)+(.|\n)*?\`{3}`,
              "gim"
            ),
            (m) => {
              const demos = m
                .replace(
                  new RegExp(
                    `\`{3}${config.componentName.trim()}(\n|\\s)+|\`{3}`,
                    "gim"
                  ),
                  ""
                )
                .split("\n")
                .filter((e) => Boolean(e.trim()))
                .reduce((a: any, b) => {
                  let last: any = a.at(-1);
                  if (!last || (last && last.src)) {
                    last = {};
                    a.push(last);
                  }
                  if (/^(#{2}|desc:)/.test(b)) {
                    last.desc = last.desc || "";
                    last.desc += b.replace(/^(#{2}|desc:)/, "").trim();
                  } else if (/^(#{1}|title:)/.test(b)) {
                    last.title = last.title || "";
                    last.title += b.replace(/^(#{1}|title:)/, "").trim();
                  } else if (/^([^:\s]+):\s*/.test(b)) {
                    const mm = b.match(/^([^:\s]+):\s*/);
                    if (mm) {
                      last[mm[1]] = last[mm[1]] || "";
                      last[mm[1]] += b.replace(/^([^:\s]+):\s*/, "").trim();
                    }
                  } else {
                    last.src = b.trim();
                  }
                  return a;
                }, [])
                .filter((e) => e.src);
              return demos
                .map((demo) => {
                  demo.mainSrc = id;
                  const hex =
                    demoFileHexWeakMap.get(demo) || md5(JSON.stringify(demo));
                  if (!demoFileHexMap.has(hex)) {
                    demoFileHexWeakMap.set(demo, hex);
                    demoFileHexMap.set(hex, demo);
                    filesHexs.push(hex);
                  }
                  return `<${config.componentName.trim()} ${config.fieldName.trim()}="Demo::__${hex}__::Demo" />`;
                })
                .join("\n");
            }
          );
          // 处理文件的绝对路径
          await Promise.all(
            filesHexs.map(async (hex) => {
              const hexInfo = demoFileHexMap.get(hex);
              // 相对路径资源尝试
              let newId = resolve(hexInfo.mainSrc, "../", hexInfo.src);
              if (!existsSync(newId)) {
                // 相对资源不存在，尝试使用vite的resolve,如果还是没有，使用原始路径
                newId = (
                  (await this.resolve(hexInfo.src)) || { id: hexInfo.src }
                ).id;
              }
              hexInfo.absoluteSrc = newId;
            })
          );
          return newcode;
        }
      },
    },
    {
      name: "markdown-vue-demo-post",
      enforce: "post",
      async load(id) {
        if (id.startsWith("virtual:Demo::")) {
          if (!/\?(src|code)$/.test(id)) {
            const hex = id.replace(/^virtual:Demo::|\.ts$/gi, "");
            const demoInfo = demoFileHexMap.get(hex);
            const isDev = this.environment.mode === "dev";
            let imports: any[] = [];
            if (isDev) {
              imports = config.importComponent
                ? [
                    ...(serve.moduleGraph.getModuleById(demoInfo.absoluteSrc)
                      ?.importedModules || []),
                  ]
                : [];
            } else {
              try {
                const moduleInfo: any = this.getModuleInfo(
                  demoInfo.absoluteSrc
                );
                if (/.vue$/.test(demoInfo.absoluteSrc)) {
                  imports = (await Promise.all(
                    moduleInfo.importedIdResolutions.map((e: any) => {
                      return this.load({
                        id: e.id,
                        resolveDependencies: true,
                      }).then((e) => e.importedIdResolutions);
                    })
                  ).then((e) =>
                    e.reduce((a, b) => {
                      return a.concat(b);
                    }, [])
                  )) as any[];
                } else {
                  imports = moduleInfo.importedIdResolutions as any;
                }
              } catch (error) {
                console.error(error);
              }
              imports = imports.map((e) => ({
                ...e,
                url: e.id,
              }));
            }
            imports = imports
              .filter((e) => !/node_modules/.test(e.url))
              .map((e) => {
                return {
                  id: e.id,
                  code: existsSync(e.id) ? readFileSync(e.id, "utf-8") : null,
                };
              })
              .filter((e) => e.code);
            return `
                import demo from 'virtual:Demo::${hex}.ts?src'
                import code from 'virtual:Demo::${hex}.ts?code'
                export default {
                    demo,
                    code,
                    info:${JSON.stringify(demoInfo)},
                    imports:${JSON.stringify(imports)},
                }
              `;
          }
        }
      },
      async resolveId(id) {
        if (id.startsWith("virtual:Demo::")) {
          if (!/\?(src|code)$/.test(id)) {
            return id;
          }
          const hex = id
            .replace(/^virtual:Demo::|\.ts\?(src|code)$/g, "")
            .trim();
          const newInfo = demoFileHexMap.get(hex);
          if (/\?(src)$/.test(id)) {
            return newInfo.absoluteSrc;
          }
          if (/\?(code)$/.test(id)) {
            return `${newInfo.absoluteSrc}?raw`;
          }
        }
      },
      transform(code, id) {
        if (id.endsWith(".md")) {
          const src = new Map();
          const newcode = code.replace(
            /("|')Demo::__(.*)__::Demo("|')/g,
            (m, $1, hex) => {
              const keyName = `__virtual_demo_${hex}__`;
              src.set(keyName, hex);
              return keyName;
            }
          );
          const srcImport = Array.from(src.keys())
            .map(
              (key) => `import ${key} from 'virtual:Demo::${src.get(key)}.ts'`
            )
            .join("\n");
          const resultCode = srcImport + "\n" + newcode;
          return resultCode;
        }
      },
    },
  ] as Plugin[];
}
