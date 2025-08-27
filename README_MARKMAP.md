# Markmap文本提取器 Chrome扩展

一键提取网页所有文本内容并转换为markmap格式（以DOM嵌套层级作为结构）的浏览器扩展。

## 功能特点

- 🚀 **一键提取**：点击扩展按钮即可提取当前网页的所有文本
- 📊 **Markmap格式**：按DOM嵌套结构生成层级化的markdown格式
- 📋 **自动复制**：提取结果自动复制到剪贴板
- 🔧 **智能过滤**：自动过滤脚本、样式等无关内容
- 👁️ **可见性检测**：只提取用户可见的文本内容

## 安装方法

1. 构建扩展：
```bash
npm install
npm run build:chrome
```

2. 在Chrome中加载扩展：
   - 打开 `chrome://extensions/`
   - 开启"开发者模式"
   - 点击"加载已解压的扩展程序"
   - 选择 `dist_chrome` 文件夹

## 使用方法

1. 在任意网页上点击扩展图标
2. 点击"🚀 提取文本到剪贴板"按钮
3. 提取的markmap格式文本将自动复制到剪贴板
4. 粘贴到支持markmap的编辑器中查看层级结构

## 输出格式示例

```markdown
# 网页标题

## URL: https://example.com

## Content Structure

- 页面主要内容 [div]
  - 导航菜单 [nav]
    - 首页 [a]
    - 关于我们 [a]
  - 主要区域 [main]
    - 文章标题 [h1]
    - 文章内容 [p]
      - 强调文本 [strong]
```

## 技术实现

- **DOM遍历**：递归遍历页面DOM树结构
- **文本提取**：只提取直接文本节点，避免重复
- **可见性检测**：过滤隐藏元素
- **层级保持**：按DOM嵌套深度生成markdown层级
- **自动清理**：移除多余空白和无意义内容

## 开发

- `npm run dev:chrome` - 开发模式
- `npm run build:chrome` - 构建Chrome版本
- `npm run build:firefox` - 构建Firefox版本

## 权限说明

- `activeTab` - 访问当前活动标签页
- `clipboardWrite` - 写入剪贴板
- `scripting` - 注入内容脚本