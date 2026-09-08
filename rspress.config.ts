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
                    "text": "类型判断与type系统",
                    "link": "/Base/02-dataType-02"
                },
                {
                    "text": "int类型详解",
                    "link": "/Base/02-dataType-03"
                },
                {
                    "text": "float类型与精度问题",
                    "link": "/Base/02-dataType-04"
                },
                {
                    "text": "bool类型与短路逻辑",
                    "link": "/Base/02-dataType-05"
                },
                {
                    "text": "None类型详解",
                    "link": "/Base/02-dataType-06"
                },
                {
                    "text": "complex复数类型",
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
                    "text": "字符串索引与切片",
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
                    "text": "字符串与类型转换",
                    "link": "/Base/03-string-06"
                },
                {
                    "text": "f-string 与字符串格式化",
                    "link": "/Base/03-string-07"
                },
                {
                    "text": "字符串与字符编码",
                    "link": "/Base/03-string-08"
                },
                {
                    "text": "字符串与正则表达式",
                    "link": "/Base/03-string-09"
                },
                {
                    "text": "占位符精度控制",
                    "link": "/Base/03-string-10"
                },
                {
                    "text": "字符串查询与判断方法",
                    "link": "/Base/03-string-11"
                },
                {
                    "text": "字符串变形与清洗方法",
                    "link": "/Base/03-string-12"
                },
                {
                    "text": "字符串分割方法",
                    "link": "/Base/03-string-13"
                },
                {
                    "text": "字符串替换方法",
                    "link": "/Base/03-string-14"
                }
            ]
        },
        {
            "text": "【04】列表介绍",
            "collapsible": true,
            "items": [
                {
                    "text": "列表概述与内存模型",
                    "link": "/Base/04-list-01"
                },
                {
                    "text": "列表创建方式",
                    "link": "/Base/04-list-02"
                },
                {
                    "text": "列表索引与切片",
                    "link": "/Base/04-list-03"
                },
                {
                    "text": "列表与运算符",
                    "link": "/Base/04-list-04"
                },
                {
                    "text": "列表推导式",
                    "link": "/Base/04-list-05"
                },
                {
                    "text": "append 与 extend 区别",
                    "link": "/Base/04-list-06"
                },
                {
                    "text": "insert、pop 与 remove 方法",
                    "link": "/Base/04-list-07"
                },
                {
                    "text": "index 查找与 count 统计",
                    "link": "/Base/04-list-08"
                },
                {
                    "text": "sort 与 sorted 排序",
                    "link": "/Base/04-list-09"
                },
                {
                    "text": "reverse 与 reversed 反转",
                    "link": "/Base/04-list-10"
                },
                {
                    "text": "列表拷贝深浅剖析",
                    "link": "/Base/04-list-11"
                },
                {
                    "text": "列表与栈和队列",
                    "link": "/Base/04-list-12"
                },
                {
                    "text": "遍历修改列表的坑",
                    "link": "/Base/04-list-13"
                },
                {
                    "text": "列表解包与星号表达式",
                    "link": "/Base/04-list-14"
                },
                {
                    "text": "推导式与 map/filter 性能对比",
                    "link": "/Base/04-list-15"
                },
                {
                    "text": "生成器表达式与列表推导式对比",
                    "link": "/Base/04-list-16"
                },
                {
                    "text": "嵌套列表与矩阵操作",
                    "link": "/Base/04-list-17"
                },
                {
                    "text": "列表与deque对比",
                    "link": "/Base/04-list-18"
                },
                {
                    "text": "列表与其他序列类型对比",
                    "link": "/Base/04-list-19"
                },
                {
                    "text": "列表性能优化与时间复杂度",
                    "link": "/Base/04-list-20"
                },
                {
                    "text": "列表常用技巧与惯用法",
                    "link": "/Base/04-list-21"
                },
                {
                    "text": "列表与 JSON 序列化",
                    "link": "/Base/04-list-22"
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
