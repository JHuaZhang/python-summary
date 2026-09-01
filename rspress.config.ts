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
