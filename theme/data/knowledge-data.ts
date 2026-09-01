// ============================================================
//  自动生成 — 运行 pnpm gen-knowledge 更新
//  加新文章后运行 pnpm gen-knowledge 即可
// ============================================================

export interface KnowledgeItem {
  id: string;
  label: string;
  parentId: string | null;
  link?: string;
  color: string;
  bg: string;
  fontSize?: number;
}

export const KNOWLEDGE_DATA: KnowledgeItem[] = [
  { id: 'Base', label: 'Python基础', parentId: null, color: '#0958d9', bg: '#e6f4ff', fontSize: 14 },
  { id: 'Base-01初识python', label: '【01】初识python', parentId: 'Base', color: '#0958d9', bg: '#e6f4ff' },
  { id: '/Base/01-firstEncounter-01', label: 'Python介绍及安装', parentId: 'Base-01初识python', link: '/Base/01-firstEncounter-01', color: '#555', bg: '#fff' },
  { id: '/Base/01-firstEncounter-02', label: 'PyCharm开发环境配置', parentId: 'Base-01初识python', link: '/Base/01-firstEncounter-02', color: '#555', bg: '#fff' },
  { id: '/Base/01-firstEncounter-03', label: 'venv虚拟环境', parentId: 'Base-01初识python', link: '/Base/01-firstEncounter-03', color: '#555', bg: '#fff' },
  { id: '/Base/01-firstEncounter-04', label: 'pip包管理器', parentId: 'Base-01初识python', link: '/Base/01-firstEncounter-04', color: '#555', bg: '#fff' },
  { id: '/Base/01-firstEncounter-05', label: 'conda环境管理', parentId: 'Base-01初识python', link: '/Base/01-firstEncounter-05', color: '#555', bg: '#fff' },
  { id: '/Base/01-firstEncounter-06', label: 'VSCode配置', parentId: 'Base-01初识python', link: '/Base/01-firstEncounter-06', color: '#555', bg: '#fff' },
  { id: '/Base/01-firstEncounter-07', label: 'print输出详解', parentId: 'Base-01初识python', link: '/Base/01-firstEncounter-07', color: '#555', bg: '#fff' },
  { id: '/Base/01-firstEncounter-08', label: 'input输入与类型转换', parentId: 'Base-01初识python', link: '/Base/01-firstEncounter-08', color: '#555', bg: '#fff' },
  { id: '/Base/01-firstEncounter-09', label: '注释规范', parentId: 'Base-01初识python', link: '/Base/01-firstEncounter-09', color: '#555', bg: '#fff' },
  { id: '/Base/01-firstEncounter-10', label: '变量赋值机制', parentId: 'Base-01初识python', link: '/Base/01-firstEncounter-10', color: '#555', bg: '#fff' },
  { id: '/Base/01-firstEncounter-11', label: '标识符命名规范', parentId: 'Base-01初识python', link: '/Base/01-firstEncounter-11', color: '#555', bg: '#fff' },
  { id: '/Base/01-firstEncounter-12', label: '常量约定', parentId: 'Base-01初识python', link: '/Base/01-firstEncounter-12', color: '#555', bg: '#fff' },
  { id: 'Base-02基础数据类型和类型系统', label: '【02】基础数据类型和类型系统', parentId: 'Base', color: '#0958d9', bg: '#e6f4ff' },
  { id: '/Base/02-dataType-01', label: '基础数据类型汇总', parentId: 'Base-02基础数据类型和类型系统', link: '/Base/02-dataType-01', color: '#555', bg: '#fff' },
  { id: '/Base/02-dataType-02', label: '类型判断与type系统', parentId: 'Base-02基础数据类型和类型系统', link: '/Base/02-dataType-02', color: '#555', bg: '#fff' },
  { id: '/Base/02-dataType-03', label: 'int类型详解', parentId: 'Base-02基础数据类型和类型系统', link: '/Base/02-dataType-03', color: '#555', bg: '#fff' },
  { id: '/Base/02-dataType-04', label: 'float类型与精度问题', parentId: 'Base-02基础数据类型和类型系统', link: '/Base/02-dataType-04', color: '#555', bg: '#fff' },
  { id: '/Base/02-dataType-05', label: 'bool类型与短路逻辑', parentId: 'Base-02基础数据类型和类型系统', link: '/Base/02-dataType-05', color: '#555', bg: '#fff' },
  { id: '/Base/02-dataType-06', label: 'None类型详解', parentId: 'Base-02基础数据类型和类型系统', link: '/Base/02-dataType-06', color: '#555', bg: '#fff' },
  { id: '/Base/02-dataType-07', label: 'complex复数类型', parentId: 'Base-02基础数据类型和类型系统', link: '/Base/02-dataType-07', color: '#555', bg: '#fff' },
];
