# 📚 Jim's Knowledge Base

![VitePress](https://img.shields.io/badge/VitePress-Powered-10b981?logo=vite&logoColor=white)
![Build Status](https://github.com/Jim-0621/knowledge-base/actions/workflows/deploy.yml/badge.svg)
![License](https://img.shields.io/badge/license-MIT-blue)

> **不积跬步，无以至千里。**
> 
> 这是一个基于 [VitePress](https://vitepress.dev/) 构建的个人技术知识库，用于沉淀我在软件开发（Java、Python和C#）过程中的学习笔记与实战经验。



## 🚀 在线预览 | Live Demo

👉 **访问地址：[https://jim-0621.github.io/knowledge-base/**

**[](https://jim-0621.github.io/knowledge-base/)**



## 💻 本地开发指南

如果你想在本地运行该项目，请确保你的环境已安装 [Node.js](https://nodejs.org/) (推荐 v18+)。



### 1. 克隆项目
```bash
git clone [https://github.com/Jim-0621/knowledge-base.git](https://github.com/Jim-0621/knowledge-base.git)
cd knowledge-base
```

### 2. 安装依赖

``` bash
npm install
# 或者如果只有 package.json 没有 lock 文件
npm add -D vitepress
```

### 3. 启动本地预览

``` bash
npm run docs:dev
```

启动后访问 http://localhost:5173/knowledge-base/ 即可看到实时更新的文档。



## 📦 部署流程

本项目使用 GitHub Actions 实现自动化部署。

- 提交代码：将 Markdown 文件推送到 main 分支。
- 自动构建：GitHub Actions 会自动触发 .github/workflows/deploy.yml 脚本。
- 发布上线：构建产物会被自动推送到 GitHub Pages 环境。