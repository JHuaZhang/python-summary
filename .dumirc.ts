import { defineConfig } from 'dumi';
import { defineThemeConfig } from 'dumi-theme-antd/dist/defineThemeConfig';

const isDev = process.env.NODE_ENV === 'development' || process.env.DUMI_ENV === 'devbuild';
// Jenkins 构建时通过 BASE_PATH 环境变量注入部署路径，本地开发和 GitHub Pages 不受影响
const basePath = process.env.BASE_PATH || (isDev ? '/' : '/python-summary/');

export default defineConfig({
  favicons: [`${basePath}logo.ico`],
  outputPath: 'dist',
  history: { type: 'browser' },
  base: basePath,
  publicPath: basePath,
  title: 'python-summary',
  themeConfig: defineThemeConfig({
    name: 'python',
    title: 'python',
    logo: `${basePath}logo.png`,
    description: '',
    socialLinks: {
      github: 'https://github.com/JHuaZhang/python-summary',
    },
    footer: 'Copyright © 2026 zjh',
  }),
});
