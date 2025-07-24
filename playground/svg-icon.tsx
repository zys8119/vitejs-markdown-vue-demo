import { NIcon } from "naive-ui";
export default defineComponent({
  inheritAttrs: false,
  props: {
    name: {
      type: String,
    },
    iconProps: {
      type: Object,
      default: () => ({}),
    },
    notFill: {
      type: Boolean,
      default: false,
    },
  },
  setup({ name, iconProps, notFill }, { attrs }) {
    const icon = ref();
    onMounted(async () => {
      icon.value = (await import(`./icons/${name}.svg?raw`))
        .default
    })
    return () => h(NIcon, {
      innerHTML: icon.value,
      ...attrs,
      ...iconProps,
      class: {
        flex: true,
        "justify-center": true,
        "items-center": true,
        "svg-icon-fill": !notFill,
        ...(typeof attrs.class === "string"
          ? { [attrs.class]: true }
          : (attrs.class as any)),
      },
    })
  },
});
