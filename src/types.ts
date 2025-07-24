export interface Options {
  // Demo组件接受的props字段
  fieldName?: string;
  // 使用的组件名称
  componentName?: string;
  // 导入组件
  importComponent?: boolean;
}
export interface DemoInfo {
  demo: any;
  code: string;
  imports: Array<{
    id: string;
    code: string;
  }>;
  info: {
    [key: string]: any;
    title?: string;
    desc?: string;
    absoluteSrc: string;
    mainSrc: string;
    src: string;
  };
}
