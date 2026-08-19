import { defineConfig } from '@rspress/core';

/**
 * ============================================================
 *  自动生成 — 运行 pnpm gen-config 更新
 *  加新文章后运行 pnpm gen-config 即可，无需手改
 * ============================================================ */
const basePath = process.env.BASE_PATH || '/';

export default defineConfig({
  title: 'Python 学习笔记',
  logo: basePath + 'logo.png',
  logoText: 'Python 学习笔记',
  root: 'docs',
  base: basePath,
  outDir: 'dist',

  // 关闭 SSG（不预渲染 HTML），浏览器端渲染，内存大降
  ssg: false,

  themeConfig: {
    nav: [
    {
        "text": "Python基础",
        "link": "/Base/01-firstEncounter-01",
        "activeMatch": "^/Base/"
    }
],
    sidebar: {
    "/Base/": [
        {
            "text": "【01】初识python",
            "collapsible": true,
            "items": [
                {
                    "text": "Python介绍及安装",
                    "link": "/Base/01-firstEncounter-01"
                },
                {
                    "text": "PyCharm开发环境配置",
                    "link": "/Base/01-firstEncounter-02"
                },
                {
                    "text": "venv虚拟环境",
                    "link": "/Base/01-firstEncounter-03"
                },
                {
                    "text": "pip包管理器",
                    "link": "/Base/01-firstEncounter-04"
                },
                {
                    "text": "conda环境管理",
                    "link": "/Base/01-firstEncounter-05"
                },
                {
                    "text": "VSCode配置",
                    "link": "/Base/01-firstEncounter-06"
                },
                {
                    "text": "print输出详解",
                    "link": "/Base/01-firstEncounter-07"
                },
                {
                    "text": "input输入与类型转换",
                    "link": "/Base/01-firstEncounter-08"
                },
                {
                    "text": "注释规范",
                    "link": "/Base/01-firstEncounter-09"
                },
                {
                    "text": "变量赋值机制",
                    "link": "/Base/01-firstEncounter-10"
                },
                {
                    "text": "标识符命名规范",
                    "link": "/Base/01-firstEncounter-11"
                },
                {
                    "text": "常量约定",
                    "link": "/Base/01-firstEncounter-12"
                }
            ]
        },
        {
            "text": "【02】基础数据类型和类型系统",
            "collapsible": true,
            "items": [
                {
                    "text": "基础数据类型汇总",
                    "link": "/Base/02-dataType-01"
                },
                {
                    "text": "字面量详解",
                    "link": "/Base/02-dataType-02"
                },
                {
                    "text": "类型判断与type系统",
                    "link": "/Base/02-dataType-03"
                },
                {
                    "text": "int类型详解",
                    "link": "/Base/02-dataType-04"
                },
                {
                    "text": "float类型与精度问题",
                    "link": "/Base/02-dataType-05"
                },
                {
                    "text": "bool类型与短路逻辑",
                    "link": "/Base/02-dataType-06"
                },
                {
                    "text": "None类型详解",
                    "link": "/Base/02-dataType-07"
                }
            ]
        },
        {
            "text": "【03】字符串介绍",
            "collapsible": true,
            "items": [
                {
                    "text": "字符串创建与驻留机制",
                    "link": "/Base/03-string-01"
                },
                {
                    "text": "索引与切片",
                    "link": "/Base/03-string-02"
                },
                {
                    "text": "转义字符与跨平台换行",
                    "link": "/Base/03-string-03"
                },
                {
                    "text": "原始字符串",
                    "link": "/Base/03-string-04"
                },
                {
                    "text": "字符串拼接性能对比",
                    "link": "/Base/03-string-05"
                },
                {
                    "text": "f-string高级格式化",
                    "link": "/Base/03-string-06"
                },
                {
                    "text": "split与rsplit分割",
                    "link": "/Base/03-string-07"
                },
                {
                    "text": "strip去除字符",
                    "link": "/Base/03-string-08"
                },
                {
                    "text": "find与index区别",
                    "link": "/Base/03-string-09"
                },
                {
                    "text": "replace与translate批量替换",
                    "link": "/Base/03-string-10"
                },
                {
                    "text": "占位符精度控制",
                    "link": "/Base/03-string-11"
                }
            ]
        },
        {
            "text": "【04】运算符和表达式",
            "collapsible": true,
            "items": [
                {
                    "text": "算术运算符",
                    "link": "/Base/04-operator-01"
                },
                {
                    "text": "除法与整除的区别",
                    "link": "/Base/04-operator-02"
                },
                {
                    "text": "赋值运算符与增强赋值",
                    "link": "/Base/04-operator-03"
                },
                {
                    "text": "值相等与引用相等",
                    "link": "/Base/04-operator-04"
                },
                {
                    "text": "链式比较",
                    "link": "/Base/04-operator-05"
                },
                {
                    "text": "逻辑运算符与短路求值",
                    "link": "/Base/04-operator-06"
                },
                {
                    "text": "三元表达式",
                    "link": "/Base/04-operator-07"
                },
                {
                    "text": "位运算符",
                    "link": "/Base/04-operator-08"
                },
                {
                    "text": "in与not in成员判断",
                    "link": "/Base/04-operator-09"
                },
                {
                    "text": "运算符优先级完整表",
                    "link": "/Base/04-operator-10"
                }
            ]
        },
        {
            "text": "【05】列表深度剖析",
            "collapsible": true,
            "items": [
                {
                    "text": "列表创建方式",
                    "link": "/Base/05-list-01"
                },
                {
                    "text": "索引访问与切片赋值",
                    "link": "/Base/05-list-02"
                },
                {
                    "text": "append与extend区别",
                    "link": "/Base/05-list-03"
                },
                {
                    "text": "insert、pop、remove方法介绍",
                    "link": "/Base/05-list-04"
                },
                {
                    "text": "index查找与count统计",
                    "link": "/Base/05-list-05"
                },
                {
                    "text": "sort原地排序与sorted新列表",
                    "link": "/Base/05-list-06"
                },
                {
                    "text": "reverse原地反转与reversed迭代器",
                    "link": "/Base/05-list-07"
                },
                {
                    "text": "列表拷贝",
                    "link": "/Base/05-list-08"
                },
                {
                    "text": "浅拷贝与深拷贝介绍",
                    "link": "/Base/05-list-09"
                },
                {
                    "text": "列表推导式",
                    "link": "/Base/05-list-10"
                },
                {
                    "text": "列表推导式与map/filter性能",
                    "link": "/Base/05-list-11"
                },
                {
                    "text": "for循环遍历时修改列表的坑",
                    "link": "/Base/05-list-12"
                }
            ]
        },
        {
            "text": "【06】元组深度剖析",
            "collapsible": true,
            "items": [
                {
                    "text": "元组创建与单元素陷阱",
                    "link": "/Base/06-tuple-01"
                },
                {
                    "text": "元组不可变性的边界",
                    "link": "/Base/06-tuple-02"
                },
                {
                    "text": "元组解包",
                    "link": "/Base/06-tuple-03"
                },
                {
                    "text": "元组作为字典的key",
                    "link": "/Base/06-tuple-04"
                },
                {
                    "text": "namedtuple命名元组",
                    "link": "/Base/06-tuple-05"
                },
                {
                    "text": "列表 vs 元组选择指南",
                    "link": "/Base/06-tuple-06"
                }
            ]
        },
        {
            "text": "【07】字典深度剖析",
            "collapsible": true,
            "items": [
                {
                    "text": "字典创建方式",
                    "link": "/Base/07-dictionary-01"
                },
                {
                    "text": "键值存取",
                    "link": "/Base/07-dictionary-02"
                },
                {
                    "text": "setdefault设置默认值",
                    "link": "/Base/07-dictionary-03"
                },
                {
                    "text": "defaultdict自动生成默认值",
                    "link": "/Base/07-dictionary-04"
                },
                {
                    "text": "OrderedDict有序字典",
                    "link": "/Base/07-dictionary-05"
                },
                {
                    "text": "Counter计数器",
                    "link": "/Base/07-dictionary-06"
                },
                {
                    "text": "字典遍历",
                    "link": "/Base/07-dictionary-07"
                },
                {
                    "text": "字典合并",
                    "link": "/Base/07-dictionary-08"
                },
                {
                    "text": "字典解包与**kwargs",
                    "link": "/Base/07-dictionary-09"
                },
                {
                    "text": "字典的in操作时间复杂度",
                    "link": "/Base/07-dictionary-10"
                },
                {
                    "text": "字典底层原理哈希表",
                    "link": "/Base/07-dictionary-11"
                },
                {
                    "text": "列表 vs 元组选择指南",
                    "link": "/Base/07-dictionary-12"
                }
            ]
        },
        {
            "text": "【08】集合与冻结集合",
            "collapsible": true,
            "items": [
                {
                    "text": "集合创建与空集合陷阱",
                    "link": "/Base/08-set-01"
                },
                {
                    "text": "集合操作",
                    "link": "/Base/08-set-02"
                },
                {
                    "text": "集合数学运算",
                    "link": "/Base/08-set-03"
                },
                {
                    "text": "集合关系判断",
                    "link": "/Base/08-set-04"
                },
                {
                    "text": "frozenset冻结集合",
                    "link": "/Base/08-set-05"
                },
                {
                    "text": "集合去重原理",
                    "link": "/Base/08-set-06"
                }
            ]
        },
        {
            "text": "【09】流程控制",
            "collapsible": true,
            "items": [
                {
                    "text": "if_elif_else条件判断",
                    "link": "/Base/09-flow-01"
                },
                {
                    "text": "for循环与range",
                    "link": "/Base/09-flow-02"
                },
                {
                    "text": "enumerate同时取索引和值",
                    "link": "/Base/09-flow-03"
                },
                {
                    "text": "zip并行遍历",
                    "link": "/Base/09-flow-04"
                },
                {
                    "text": "while循环",
                    "link": "/Base/09-flow-05"
                },
                {
                    "text": "break_continue_pass",
                    "link": "/Base/09-flow-06"
                },
                {
                    "text": "for_else与while_else",
                    "link": "/Base/09-flow-07"
                },
                {
                    "text": "循环优化技巧",
                    "link": "/Base/09-flow-08"
                }
            ]
        },
        {
            "text": "【10】异常处理完整体系",
            "collapsible": true,
            "items": [
                {
                    "text": "try-except基础异常捕获",
                    "link": "/Base/10-exception-01"
                },
                {
                    "text": "捕获多个异常",
                    "link": "/Base/10-exception-02"
                },
                {
                    "text": "获取异常对象",
                    "link": "/Base/10-exception-03"
                },
                {
                    "text": "else子句",
                    "link": "/Base/10-exception-04"
                },
                {
                    "text": "finally子句",
                    "link": "/Base/10-exception-05"
                },
                {
                    "text": "主动抛异常raise",
                    "link": "/Base/10-exception-06"
                },
                {
                    "text": "异常链raise_from",
                    "link": "/Base/10-exception-07"
                },
                {
                    "text": "with与上下文管理器协议",
                    "link": "/Base/10-exception-08"
                }
            ]
        },
        {
            "text": "【11】文件与路径操作",
            "collapsible": true,
            "items": [
                {
                    "text": "open函数与mode参数",
                    "link": "/Base/11-filePath-01"
                },
                {
                    "text": "文件读写方法",
                    "link": "/Base/11-filePath-02"
                },
                {
                    "text": "文件指针操作",
                    "link": "/Base/11-filePath-03"
                },
                {
                    "text": "文件指针操作",
                    "link": "/Base/11-filePath-04"
                },
                {
                    "text": "os模块基础操作",
                    "link": "/Base/11-filePath-05"
                },
                {
                    "text": "os_walk递归遍历目录",
                    "link": "/Base/11-filePath-06"
                },
                {
                    "text": "pathlib面向对象路径",
                    "link": "/Base/11-filePath-07"
                },
                {
                    "text": "tempfile临时文件与目录",
                    "link": "/Base/11-filePath-08"
                },
                {
                    "text": "tempfile临时文件与目录",
                    "link": "/Base/12-function-01"
                },
                {
                    "text": "tempfile临时文件与目录",
                    "link": "/Base/12-function-02"
                }
            ]
        },
        {
            "text": "【12】函数核心机制",
            "collapsible": true,
            "items": [
                {
                    "text": "位置参数与关键字参数",
                    "link": "/Base/12-function-03"
                },
                {
                    "text": "默认参数陷阱",
                    "link": "/Base/12-function-04"
                },
                {
                    "text": "可变位置参数args",
                    "link": "/Base/12-function-05"
                },
                {
                    "text": "可变关键字参数kwargs",
                    "link": "/Base/12-function-06"
                },
                {
                    "text": "参数顺序规范列",
                    "link": "/Base/12-function-07"
                },
                {
                    "text": "参数顺序规范列",
                    "link": "/Base/12-function-08"
                },
                {
                    "text": "仅关键字参数",
                    "link": "/Base/12-function-09"
                },
                {
                    "text": "作用域LEGB规则",
                    "link": "/Base/12-function-10"
                },
                {
                    "text": "global修改全局变量",
                    "link": "/Base/12-function-11"
                },
                {
                    "text": "nonlocal修改外层局部变量",
                    "link": "/Base/12-function-12"
                },
                {
                    "text": "docstring文档与help",
                    "link": "/Base/12-function-13"
                },
                {
                    "text": "函数注解与类型提示",
                    "link": "/Base/12-function-14"
                }
            ]
        },
        {
            "text": "【13】高阶函数与闭包",
            "collapsible": true,
            "items": [
                {
                    "text": "函数是一等公民",
                    "link": "/Base/13-hofClosure-01"
                },
                {
                    "text": "map 映射函数",
                    "link": "/Base/13-hofClosure-02"
                },
                {
                    "text": "filter 过滤函数",
                    "link": "/Base/13-hofClosure-03"
                },
                {
                    "text": "reduce 累积计算",
                    "link": "/Base/13-hofClosure-04"
                },
                {
                    "text": "sorted 自定义排序",
                    "link": "/Base/13-hofClosure-05"
                },
                {
                    "text": "闭包（closure）",
                    "link": "/Base/13-hofClosure-06"
                },
                {
                    "text": "闭包应用场景",
                    "link": "/Base/13-hofClosure-07"
                },
                {
                    "text": "nonlocal 在闭包中的使用",
                    "link": "/Base/13-hofClosure-08"
                }
            ]
        },
        {
            "text": "【14】装饰器深度剖析",
            "collapsible": true,
            "items": [
                {
                    "text": "装饰器本质",
                    "link": "/Base/14-decorator-01"
                },
                {
                    "text": "无参装饰器实现",
                    "link": "/Base/14-decorator-02"
                },
                {
                    "text": "装饰器执行顺序",
                    "link": "/Base/14-decorator-03"
                },
                {
                    "text": "functools.wraps 保留原函数信息",
                    "link": "/Base/14-decorator-04"
                },
                {
                    "text": "带参数装饰器",
                    "link": "/Base/14-decorator-05"
                },
                {
                    "text": "类装饰器",
                    "link": "/Base/14-decorator-06"
                },
                {
                    "text": "装饰器实战权限校验",
                    "link": "/Base/14-decorator-07"
                },
                {
                    "text": "装饰器实战：lru_cache 缓存",
                    "link": "/Base/14-decorator-08"
                }
            ]
        },
        {
            "text": "【15】模块与包管理",
            "collapsible": true,
            "items": [
                {
                    "text": "import 与 from...import —— 模块导入的两种方式",
                    "link": "/Base/15-modulePackage-01"
                },
                {
                    "text": "模块搜索路径 sys.path",
                    "link": "/Base/15-modulePackage-02"
                },
                {
                    "text": "__name__ 与程序入口",
                    "link": "/Base/15-modulePackage-03"
                },
                {
                    "text": "Package 与 __init__.py",
                    "link": "/Base/15-modulePackage-04"
                },
                {
                    "text": "相对导入",
                    "link": "/Base/15-modulePackage-05"
                },
                {
                    "text": "__all__ 控制导出列表",
                    "link": "/Base/15-modulePackage-06"
                },
                {
                    "text": "requirements.txt 生成依赖",
                    "link": "/Base/15-modulePackage-07"
                },
                {
                    "text": "pyproject.toml 现代配置",
                    "link": "/Base/15-modulePackage-08"
                }
            ]
        },
        {
            "text": "【16】面向对象OOP全套",
            "collapsible": true,
            "items": [
                {
                    "text": "类与实例定义",
                    "link": "/Base/16-oop-01"
                },
                {
                    "text": "self 的本质",
                    "link": "/Base/16-oop-02"
                },
                {
                    "text": "实例属性动态添加",
                    "link": "/Base/16-oop-03"
                },
                {
                    "text": "类属性与实例属性区别",
                    "link": "/Base/16-oop-04"
                },
                {
                    "text": "实例方法",
                    "link": "/Base/16-oop-05"
                },
                {
                    "text": "classmethod 类方法",
                    "link": "/Base/16-oop-06"
                },
                {
                    "text": "staticmethod 静态方法",
                    "link": "/Base/16-oop-07"
                },
                {
                    "text": "classmethod 与 staticmethod 场景",
                    "link": "/Base/16-oop-08"
                },
                {
                    "text": "私有属性约定 _single_（单下划线）",
                    "link": "/Base/16-oop-09"
                },
                {
                    "text": "名称重整 __double__（双下划线 name mangling）",
                    "link": "/Base/16-oop-10"
                },
                {
                    "text": "property getter 封装",
                    "link": "/Base/16-oop-11"
                },
                {
                    "text": "property 的 setter 与 deleter",
                    "link": "/Base/16-oop-12"
                },
                {
                    "text": "单继承与子类",
                    "link": "/Base/16-oop-13"
                },
                {
                    "text": "方法重写",
                    "link": "/Base/16-oop-14"
                },
                {
                    "text": "super 调用父类",
                    "link": "/Base/16-oop-15"
                },
                {
                    "text": "多继承与菱形问题",
                    "link": "/Base/16-oop-16"
                },
                {
                    "text": "C3 线性化算法与 __mro__",
                    "link": "/Base/16-oop-17"
                },
                {
                    "text": "__str__ 与 __repr__",
                    "link": "/Base/16-oop-18"
                },
                {
                    "text": "__call__ 使实例可调用",
                    "link": "/Base/16-oop-19"
                },
                {
                    "text": "__del__析构函数",
                    "link": "/Base/16-oop-20"
                },
                {
                    "text": "__len__ 与 __getitem__",
                    "link": "/Base/16-oop-21"
                },
                {
                    "text": "迭代器协议 `__iter__` 与 `__next__`",
                    "link": "/Base/16-oop-22"
                }
            ]
        },
        {
            "text": "【17】生成器与迭代器",
            "collapsible": true,
            "items": [
                {
                    "text": "yield 生成器定义",
                    "link": "/Base/17-generator-01"
                },
                {
                    "text": "生成器惰性求值过程",
                    "link": "/Base/17-generator-02"
                },
                {
                    "text": "生成器表达式",
                    "link": "/Base/17-generator-03"
                },
                {
                    "text": "生成器 send 方法",
                    "link": "/Base/17-generator-04"
                },
                {
                    "text": "yield from 委托 —— 把生成器的\"产出\"与\"交互\"整体转发",
                    "link": "/Base/17-generator-05"
                },
                {
                    "text": "itertools 常用工具",
                    "link": "/Base/17-generator-06"
                },
                {
                    "text": "生成器 vs 列表内存对比",
                    "link": "/Base/17-generator-07"
                },
                {
                    "text": "生成器与协程关系",
                    "link": "/Base/17-generator-08"
                }
            ]
        },
        {
            "text": "【18】异步协程",
            "collapsible": true,
            "items": [
                {
                    "text": "同步阻塞痛点",
                    "link": "/Base/18-async-01"
                },
                {
                    "text": "协程概念与调度",
                    "link": "/Base/18-async-02"
                },
                {
                    "text": "async def 与 await —— 协程的定义与暂停",
                    "link": "/Base/18-async-03"
                },
                {
                    "text": "asyncio.run 启动事件循环",
                    "link": "/Base/18-async-04"
                },
                {
                    "text": "asyncio.sleep 模拟异步 IO",
                    "link": "/Base/18-async-05"
                },
                {
                    "text": "asyncio.create_task 并发执行",
                    "link": "/Base/18-async-06"
                },
                {
                    "text": "asyncio.gather 与 asyncio.wait",
                    "link": "/Base/18-async-07"
                },
                {
                    "text": "任务取消与超时控制",
                    "link": "/Base/18-async-08"
                },
                {
                    "text": "aiofiles 异步文件读写",
                    "link": "/Base/18-async-09"
                },
                {
                    "text": "aiohttp 异步 HTTP 请求",
                    "link": "/Base/18-async-10"
                },
                {
                    "text": "asyncio.Queue 异步队列",
                    "link": "/Base/18-async-11"
                },
                {
                    "text": "asyncio.Lock 异步锁",
                    "link": "/Base/18-async-12"
                },
                {
                    "text": "同步代码调用异步代码",
                    "link": "/Base/18-async-13"
                },
                {
                    "text": "异步代码调用同步代码",
                    "link": "/Base/18-async-14"
                }
            ]
        },
        {
            "text": "【19】标准库精讲",
            "collapsible": true,
            "items": [
                {
                    "text": "sys 模块：命令行参数与标准流",
                    "link": "/Base/19-stdlib-01"
                },
                {
                    "text": "os 模块：环境变量与进程",
                    "link": "/Base/19-stdlib-02"
                },
                {
                    "text": "pathlib 路径拼接与文件属性",
                    "link": "/Base/19-stdlib-03"
                },
                {
                    "text": "json 序列化与反序列化",
                    "link": "/Base/19-stdlib-04"
                },
                {
                    "text": "pickle 二进制序列化 —— Python 对象的存取与安全红线",
                    "link": "/Base/19-stdlib-05"
                },
                {
                    "text": "csv 读写 CSV 文件",
                    "link": "/Base/19-stdlib-06"
                },
                {
                    "text": "re 正则：match / search / findall",
                    "link": "/Base/19-stdlib-07"
                },
                {
                    "text": "正则捕获组与分组",
                    "link": "/Base/19-stdlib-08"
                },
                {
                    "text": "正则常用模式速查",
                    "link": "/Base/19-stdlib-09"
                },
                {
                    "text": "datetime.now 与 strftime",
                    "link": "/Base/19-stdlib-10"
                },
                {
                    "text": "datetime.strptime：解析字符串为 datetime 对象",
                    "link": "/Base/19-stdlib-11"
                },
                {
                    "text": "time.sleep 与时间戳",
                    "link": "/Base/19-stdlib-12"
                },
                {
                    "text": "timedelta 时间差计算",
                    "link": "/Base/19-stdlib-13"
                },
                {
                    "text": "uuid 生成唯一 ID",
                    "link": "/Base/19-stdlib-14"
                },
                {
                    "text": "random 随机数与采样",
                    "link": "/Base/19-stdlib-15"
                },
                {
                    "text": "logging.basicConfig 日志配置",
                    "link": "/Base/19-stdlib-16"
                },
                {
                    "text": "logging.FileHandler 与日志轮转",
                    "link": "/Base/19-stdlib-17"
                },
                {
                    "text": "argparse 命令行参数解析",
                    "link": "/Base/19-stdlib-18"
                },
                {
                    "text": "collections 常用工具",
                    "link": "/Base/19-stdlib-19"
                },
                {
                    "text": "functools 常用工具",
                    "link": "/Base/19-stdlib-20"
                }
            ]
        },
        {
            "text": "【20】网络请求与外部服务",
            "collapsible": true,
            "items": [
                {
                    "text": "requests 基础请求",
                    "link": "/Base/20-network-01"
                },
                {
                    "text": "requests 请求头与参数",
                    "link": "/Base/20-network-02"
                },
                {
                    "text": "requests 响应处理",
                    "link": "/Base/20-network-03"
                },
                {
                    "text": "requests 超时与代理",
                    "link": "/Base/20-network-04"
                },
                {
                    "text": "requests.Session 会话保持",
                    "link": "/Base/20-network-05"
                },
                {
                    "text": "redis-py 同步 Redis",
                    "link": "/Base/20-network-06"
                },
                {
                    "text": "redis.asyncio 异步 Redis",
                    "link": "/Base/20-network-07"
                },
                {
                    "text": "python-dotenv 环境变量管理",
                    "link": "/Base/20-network-08"
                }
            ]
        }
    ]
},
    footer: {
      message: 'Copyright © 2026 | Powered by Rspress',
    },
  },

  markdown: {
    link: {
      checkDeadLinks: false,
    },
  },
});
