import { defineConfig } from 'dumi';
import { defineThemeConfig } from 'dumi-theme-antd/dist/defineThemeConfig';

const isDev = process.env.NODE_ENV === 'development' || process.env.DUMI_ENV === 'devbuild';

export default defineConfig({
  favicons: isDev ? ['/logo.ico'] : ['/python-summary/logo.ico'],
  outputPath: 'dist',
  history: { type: 'browser' },
  base: isDev ? '/' : '/python-summary/',
  publicPath: isDev ? '/' : '/python-summary/',
  title: 'python-summary',
  themeConfig: defineThemeConfig({
    name: 'python',
    title: 'python',
    logo: isDev ? '/logo.png' : '/python-summary/logo.png',
    description: '',
    socialLinks: {
      github: 'https://github.com/JHuaZhang/python-summary',
    },
    footer: 'Copyright © 2026 zjh',
  }),
});
