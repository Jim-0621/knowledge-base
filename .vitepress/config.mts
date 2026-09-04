import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Jim's Notes",
  description: '欢迎来到我的知识库！沉淀 Java、Python、C# 与系统架构的学习笔记与实战经验。',
  lang: 'zh-CN',
  base: '/knowledge-base/', // 注意前后都有斜杠
  lastUpdated: true,
  cleanUrls: false,

  // 网页图标 / 站点元信息
  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/knowledge-base/favicon.svg' }],
    ['link', { rel: 'apple-touch-icon', href: '/knowledge-base/favicon.svg' }],
    ['link', { rel: 'mask-icon', href: '/knowledge-base/favicon.svg', color: '#3b82f6' }],
    ['meta', { name: 'theme-color', content: '#3b82f6' }],
    ['meta', { name: 'author', content: 'Jim' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:title', content: "Jim's Notes | 个人技术知识库" }],
    ['meta', { property: 'og:description', content: '沉淀 Java、Python、C# 与系统架构的学习笔记与实战经验。' }],
  ],

  themeConfig: {
    logo: '/logo.svg',
    siteTitle: "Jim's Notes",

    // 1. 顶部导航栏 (Nav)
    nav: [
      { text: '首页', link: '/' },
      { text: 'Java', link: '/java/' },
      { text: 'Python', link: '/python/' },
      { text: 'C#', link: '/csharp/' },
      { text: '系统架构师', link: '/architect/' },
    ],

    // 2. 左侧侧边栏 (Sidebar)
    sidebar: {
      '/java/': [
        {
          text: '☕ Java',
          items: [{ text: '概览', link: '/java/index' }],
        },
        {
          text: '细分知识点',
          collapsed: false,
          items: [
            { text: '设计模式', link: '/java/design_pattern' },
            { text: 'MySQL 日志', link: '/java/mysql_log' },
            { text: 'SpringCloud', link: '/java/springcloud' },
          ],
        },
        {
          text: '面试八股',
          collapsed: false,
          items: [
            { text: 'Java 面试核心知识点', link: '/java/java_interview_key_points' },
            { text: 'JavaGuide', link: '/java/javaguide' },
            { text: '小林 Coding', link: '/java/xiaolincoding' },
            { text: '面渣逆袭', link: '/java/javabetter' },
          ],
        },
      ],

      '/python/': [
        {
          text: '🐍 Python',
          items: [
            { text: '概览', link: '/python/index' },
            { text: 'UV 使用指南', link: '/python/uv' },
            { text: 'Bark 应用实践', link: '/python/bark' },
          ],
        },
      ],

      '/csharp/': [
        {
          text: '💠 C# / .NET',
          items: [
            { text: '概览', link: '/csharp/index' },
            { text: 'PDA 本地调试', link: '/csharp/pda_debug' },
          ],
        },
      ],

      '/architect/': [
        {
          text: '🏛️ 系统架构师',
          items: [
            { text: '概览', link: '/architect/index' },
            { text: '核心知识点', link: '/architect/key_points' },
            { text: '补充知识点', link: '/architect/other_points' },
          ],
        },
      ],
    },

    outline: {
      level: 'deep', // 会自动显示 H2 到 H6 的所有标题
      label: '本页目录',
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/Jim-0621/knowledge-base' },
    ],

    // 3. 本地全文搜索
    search: {
      provider: 'local',
      options: {
        translations: {
          button: { buttonText: '搜索文档', buttonAriaLabel: '搜索文档' },
          modal: {
            noResultsText: '无法找到相关结果',
            resetButtonTitle: '清除查询条件',
            displayDetails: '显示详细列表',
            footer: {
              selectText: '选择',
              navigateText: '切换',
              closeText: '关闭',
            },
          },
        },
      },
    },

    // 4. 中文界面文案
    darkModeSwitchLabel: '外观',
    lightModeSwitchTitle: '切换到浅色模式',
    darkModeSwitchTitle: '切换到深色模式',
    sidebarMenuLabel: '目录',
    returnToTopLabel: '返回顶部',
    langMenuLabel: '切换语言',
    docFooter: { prev: '上一篇', next: '下一篇' },

    lastUpdated: {
      text: '最后更新于',
      formatOptions: { dateStyle: 'short', timeStyle: 'short' },
    },

    footer: {
      message: '基于 VitePress 构建 · 内容仅供个人学习记录',
      copyright: `Copyright © 2024-${new Date().getFullYear()} Jim`,
    },
  },

  markdown: {
    lineNumbers: true,
    image: { lazyLoading: true },
    container: {
      tipLabel: '提示',
      warningLabel: '注意',
      dangerLabel: '警告',
      infoLabel: '信息',
      detailsLabel: '详细信息',
    },
  },

  ignoreDeadLinks: [
    // 正则表达式匹配
    /^http:\/\/localhost/,
  ],
})
