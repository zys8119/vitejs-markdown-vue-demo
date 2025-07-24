<template>
    <div class='Demo'>
        <n-card>
            <template #header>
                <div class="flex items-center gap-10px">
                    <div><colourful-text text="Zys8119"></colourful-text></div>
                    {{ info.title }}
                </div>
            </template>
            <template #header-extra>
                <div class="select-none flex-center gap-10px">
                    <n-tooltip v-for="(item, index) in icons" :key="index">
                        <template #trigger>
                            <svg-icon :name="item.icon" @click="item.click"
                                class="text-30px cursor-pointer hover:text-#4481f4" :class="item.class"></svg-icon>
                        </template>
                        {{ item.name }}
                    </n-tooltip>
                </div>
            </template>
            <div v-if="info.desc" class="m-b-15px">{{ info.desc }}</div>
            <div class="w-full h-full abs-r of-hidden">
                <n-tabs type="card" animated size="small" v-model:value="activeTab">
                    <n-tab-pane name="preview" tab="预览">
                        <div class="w-full h-500px of-auto abs-r  b-rd-10px m-y-10px b-1px b-solid b-#edecf3">
                            <SrcDemo v-bind="info"></SrcDemo>
                        </div>
                    </n-tab-pane>
                    <n-tab-pane name="code" tab="代码">
                        <pre><code v-html="SrcCode" class="hljs"></code></pre>
                    </n-tab-pane>
                    <n-tab-pane v-for="item in imports" :name="item.id" :tab="item.tab">
                        <pre><code class="hljs" v-html="highlightCode(item.code, getLang(item.id))"></code></pre>
                    </n-tab-pane>
                </n-tabs>
            </div>
        </n-card>
    </div>
</template>
<script setup lang="ts">
import { DemoInfo } from "../../vite/plugins/markdown-vue-demo"
import hljs from 'highlight.js'
import { createDiscreteApi } from 'naive-ui'
const { message } = createDiscreteApi(['message'])
const props = defineProps<{
    src: DemoInfo
}>()
const { copy } = useClipboard()
const router = useRouter()
const icons = ref<any[]>([
    {
        name: '复制当前代码', icon: 'copy', async click() {
            const code = imports.value.find(e => e.id === activeTab.value)?.code || props.src.code
            await copy(code)
            message.success('复制成功')
        }
    },
    {
        name: '新窗口打开Demo', icon: 'new-window', class: 'text-18px!', click() {
            const path = props.src.info.absoluteSrc.replace(/.*views|\..*$/g, '')
            router.push(path)
        }
    },
])
const highlightCode = (code: string, lang = 'html') => {
    if (typeof code !== 'string') {
        code = ''
    }
    try {
        return hljs.highlight(code, {
            language: {
                vue: "html",
                js: "javascript",
                jsx: "javascript",
                ts: "typescript",
                tsx: "typescript",
                css: "css",
                less: "css",
                sass: "css",
            }[lang] || lang
        }).value
    } catch (error) {
        return hljs.highlight(code, { language: 'text' }).value
    }
}
const getLang = (input: string) => {
    if (typeof input !== 'string' || !/\.[^\.]+$/.test(input)) {
        return 'html'
    }
    return (input.match(/\.[^\.]+$/)?.[0] as any || '').replace(/^./, '').toLowerCase().trim()
}
const SrcDemo = computed(() => {
    return props.src.demo
})
const SrcCode = computed(() => {
    return highlightCode(props.src.code, getLang(props.src.info.absoluteSrc))
})
const imports = computed(() => {
    return (props.src.imports || []).map(e => ({
        ...e,
        tab: getTabName(e.id)
    }))
})
const info = computed(() => {
    return props.src.info || {} as Record<string, any>
})
const getTabName = (id: string) => {
    return id.replace(/.*\//g, '')
}
const activeTab = ref('preview')
onMounted(() => {
    activeTab.value = info.value.tab || 'preview'
})
</script>
<style scoped lang="less">
.Demo {
    &+.Demo {
        margin-top: 20px;
    }
}
</style>