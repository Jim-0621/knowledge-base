import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Jim's Notes",
  description: "欢迎来到我的知识库！",
  base: '/knowledge-base/', // 注意前后都有斜杠
  themeConfig: {
    // 1. 顶部导航栏 (Nav)
    nav: [
      { text: '首页', link: '/' },
      { text: 'Java', link: '/java/' },
      { text: 'Python', link: '/python/' },
      { text: 'C#', link: '/java/csharp' },
    ],

    // 2. 左侧侧边栏 (Sidebar)
    sidebar: {

      // 当用户位于 /java/ 目录下时，显示这个侧边栏
      '/java/': [
        {
          text: 'Java 相关知识点',
          items: [
            { text: 'Java 面试核心知识点', link: '/java/java_interview_key_points' },
            { text: '设计模式', link: '/java/design_pattern' },
            { text: 'MySQL日志', link: '/java/mysql_log' },
            { text: 'SpringCloud', link: '/java/springcloud' },
            { text: 'JavaGuide', link: '/java/javaguide' },
            { text: '小林Coding', link: '/java/xiaolincoding' },
            { text: '面渣逆袭', link: '/java/javabetter' }
          ]
        }
      ]
    },

    outline: {
      level: 'deep', // 会自动显示 H2 到 H6 的所有标题
      label: '本页目录'
    },

    // 3. 社交链接
    socialLinks: [
      { icon: 'github', link: 'https://github.com/Jim-0621/knowledge-base' }
    ]
  }
})
