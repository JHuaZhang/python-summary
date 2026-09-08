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
  { id: 'Base-03字符串介绍', label: '【03】字符串介绍', parentId: 'Base', color: '#0958d9', bg: '#e6f4ff' },
  { id: '/Base/03-string-01', label: '字符串创建与驻留机制', parentId: 'Base-03字符串介绍', link: '/Base/03-string-01', color: '#555', bg: '#fff' },
  { id: '/Base/03-string-02', label: '字符串索引与切片', parentId: 'Base-03字符串介绍', link: '/Base/03-string-02', color: '#555', bg: '#fff' },
  { id: '/Base/03-string-03', label: '转义字符与跨平台换行', parentId: 'Base-03字符串介绍', link: '/Base/03-string-03', color: '#555', bg: '#fff' },
  { id: '/Base/03-string-04', label: '原始字符串', parentId: 'Base-03字符串介绍', link: '/Base/03-string-04', color: '#555', bg: '#fff' },
  { id: '/Base/03-string-05', label: '字符串拼接性能对比', parentId: 'Base-03字符串介绍', link: '/Base/03-string-05', color: '#555', bg: '#fff' },
  { id: '/Base/03-string-06', label: '字符串与类型转换', parentId: 'Base-03字符串介绍', link: '/Base/03-string-06', color: '#555', bg: '#fff' },
  { id: '/Base/03-string-07', label: 'f-string 与字符串格式化', parentId: 'Base-03字符串介绍', link: '/Base/03-string-07', color: '#555', bg: '#fff' },
  { id: '/Base/03-string-08', label: '字符串与字符编码', parentId: 'Base-03字符串介绍', link: '/Base/03-string-08', color: '#555', bg: '#fff' },
  { id: '/Base/03-string-09', label: '字符串与正则表达式', parentId: 'Base-03字符串介绍', link: '/Base/03-string-09', color: '#555', bg: '#fff' },
  { id: '/Base/03-string-10', label: '占位符精度控制', parentId: 'Base-03字符串介绍', link: '/Base/03-string-10', color: '#555', bg: '#fff' },
  { id: '/Base/03-string-11', label: '字符串查询与判断方法', parentId: 'Base-03字符串介绍', link: '/Base/03-string-11', color: '#555', bg: '#fff' },
  { id: '/Base/03-string-12', label: '字符串变形与清洗方法', parentId: 'Base-03字符串介绍', link: '/Base/03-string-12', color: '#555', bg: '#fff' },
  { id: '/Base/03-string-13', label: '字符串分割方法', parentId: 'Base-03字符串介绍', link: '/Base/03-string-13', color: '#555', bg: '#fff' },
  { id: '/Base/03-string-14', label: '字符串替换方法', parentId: 'Base-03字符串介绍', link: '/Base/03-string-14', color: '#555', bg: '#fff' },
  { id: 'Base-04列表介绍', label: '【04】列表介绍', parentId: 'Base', color: '#0958d9', bg: '#e6f4ff' },
  { id: '/Base/04-list-01', label: '列表概述与内存模型', parentId: 'Base-04列表介绍', link: '/Base/04-list-01', color: '#555', bg: '#fff' },
  { id: '/Base/04-list-02', label: '列表创建方式', parentId: 'Base-04列表介绍', link: '/Base/04-list-02', color: '#555', bg: '#fff' },
  { id: '/Base/04-list-03', label: '列表索引与切片', parentId: 'Base-04列表介绍', link: '/Base/04-list-03', color: '#555', bg: '#fff' },
  { id: '/Base/04-list-04', label: '列表与运算符', parentId: 'Base-04列表介绍', link: '/Base/04-list-04', color: '#555', bg: '#fff' },
  { id: '/Base/04-list-05', label: '列表推导式', parentId: 'Base-04列表介绍', link: '/Base/04-list-05', color: '#555', bg: '#fff' },
  { id: '/Base/04-list-06', label: 'append 与 extend 区别', parentId: 'Base-04列表介绍', link: '/Base/04-list-06', color: '#555', bg: '#fff' },
  { id: '/Base/04-list-07', label: 'insert、pop 与 remove 方法', parentId: 'Base-04列表介绍', link: '/Base/04-list-07', color: '#555', bg: '#fff' },
  { id: '/Base/04-list-08', label: 'index 查找与 count 统计', parentId: 'Base-04列表介绍', link: '/Base/04-list-08', color: '#555', bg: '#fff' },
  { id: '/Base/04-list-09', label: 'sort 与 sorted 排序', parentId: 'Base-04列表介绍', link: '/Base/04-list-09', color: '#555', bg: '#fff' },
  { id: '/Base/04-list-10', label: 'reverse 与 reversed 反转', parentId: 'Base-04列表介绍', link: '/Base/04-list-10', color: '#555', bg: '#fff' },
  { id: '/Base/04-list-11', label: '列表拷贝深浅剖析', parentId: 'Base-04列表介绍', link: '/Base/04-list-11', color: '#555', bg: '#fff' },
  { id: '/Base/04-list-12', label: '列表与栈和队列', parentId: 'Base-04列表介绍', link: '/Base/04-list-12', color: '#555', bg: '#fff' },
  { id: '/Base/04-list-13', label: '遍历修改列表的坑', parentId: 'Base-04列表介绍', link: '/Base/04-list-13', color: '#555', bg: '#fff' },
  { id: '/Base/04-list-14', label: '列表解包与星号表达式', parentId: 'Base-04列表介绍', link: '/Base/04-list-14', color: '#555', bg: '#fff' },
  { id: '/Base/04-list-15', label: '推导式与 map/filter 性能对比', parentId: 'Base-04列表介绍', link: '/Base/04-list-15', color: '#555', bg: '#fff' },
  { id: '/Base/04-list-16', label: '生成器表达式与列表推导式对比', parentId: 'Base-04列表介绍', link: '/Base/04-list-16', color: '#555', bg: '#fff' },
  { id: '/Base/04-list-17', label: '嵌套列表与矩阵操作', parentId: 'Base-04列表介绍', link: '/Base/04-list-17', color: '#555', bg: '#fff' },
  { id: '/Base/04-list-18', label: '列表与deque对比', parentId: 'Base-04列表介绍', link: '/Base/04-list-18', color: '#555', bg: '#fff' },
  { id: '/Base/04-list-19', label: '列表与其他序列类型对比', parentId: 'Base-04列表介绍', link: '/Base/04-list-19', color: '#555', bg: '#fff' },
  { id: '/Base/04-list-20', label: '列表性能优化与时间复杂度', parentId: 'Base-04列表介绍', link: '/Base/04-list-20', color: '#555', bg: '#fff' },
  { id: '/Base/04-list-21', label: '列表常用技巧与惯用法', parentId: 'Base-04列表介绍', link: '/Base/04-list-21', color: '#555', bg: '#fff' },
  { id: '/Base/04-list-22', label: '列表与 JSON 序列化', parentId: 'Base-04列表介绍', link: '/Base/04-list-22', color: '#555', bg: '#fff' },
];
