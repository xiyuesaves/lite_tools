<p align=center>
  <img width="160" alt="icon" height="160" src="./icon.png" />
</p>

<h1 align="center">轻量工具箱</h1>

<p align="center">
  <a href="/LICENSE"><img src="https://img.shields.io/github/license/xiyuesaves/LiteLoaderQQNT-lite_tools" alt="LICENSE"></a>
  <a href="https://github.com/xiyuesaves/LiteLoaderQQNT-lite_tools/releases"><img src="https://img.shields.io/github/v/release/xiyuesaves/LiteLoaderQQNT-lite_tools" alt="Release"></a>
  <a href="https://github.com/xiyuesaves/LiteLoaderQQNT-lite_tools/issues"><img src="https://img.shields.io/github/issues/xiyuesaves/LiteLoaderQQNT-lite_tools" alt="Issues"></a>
</p>

LiteLoaderQQNT 插件 - 轻量工具箱 —— 轻量 · 优雅 · 高效 · 福瑞

LiteLoaderQQNT 本体：[LiteLoaderQQNT](https://github.com/mo-jinran/LiteLoaderQQNT)

> [!NOTE]\
> 新版仅支持 LiteLoaderQQNT 1.0.0，旧版本在[v3 分支](https://github.com/xiyuesaves/LiteLoaderQQNT-lite_tools/tree/v3) \
> 该插件在 Windows 环境下测试开发，理论全平台兼容，但没有条件对 Mac 和 Linux 平台进行测试

> [!TIP]\
> macOS 用户如果需要使用本地表情功能，请将表情文件夹选择在沙盒里，否则每次重启 QQ 都需要重新选择一次表情目录

> [!CAUTION]\
> **不要在国内平台宣传该插件**\
> **不要在 QQ 官方群聊发送*任何*可以看出你使用了第三方插件的截图**

## 使用方法

### 从 Releases 中下载稳定版的方式进行安装

- 下载 [最新发布版本](https://github.com/xiyuesaves/LiteLoaderQQNT-lite_tools/releases/latest) 中的 `lite_tools_v4.zip`
- 将压缩包中的内容解压到 [LiteLoaderQQNT](https://github.com/mo-jinran/LiteLoaderQQNT) 数据目录的 `plugins/lite_tools` （需要手动创建 `lite_tools` 文件夹）路径下
- 重启 QQNT 安装完成

### 插件内自动更新

- 打开设置页面，选择 `轻量工具箱`
- 滚动到插件页面底部，点击新版本号，在更新日志窗口点击 `更新` 即可

### 手动构建

```
git clone git@github.com:xiyuesaves/LiteLoaderQQNT-lite_tools.git
cd ./LiteLoaderQQNT-lite_tools
pnpm i
pnpm run build
```

### 查看当前版本更新日志

- 打开设置页面，选择 `轻量工具箱`
- 滚动到插件页面底部，点击当前版本号即可

## 功能列表

| 功能列表               |                    |                          |                  |
| ---------------------- | ------------------ | ------------------------ | ---------------- |
| 本地表情               | 阻止撤回           | 查看撤回消息             | 图片搜索         |
| 自定义背景             | 头像浮动           | 消息显示发送时间         | 消息后缀         |
| 小程序卡片转链接       | 精简输入框功能     | 精简侧边栏功能           | 精简聊天框功能   |
| 快速关闭预览图片       | 移除回复@          | 消息合并                 | 禁用 GIF 热图    |
| 划词搜索               | 隐藏小红点         | 禁用表情推荐             | 阻止拖拽多选消息 |
| 消息靠左显示           | 消息转图片         | 消息列表只显示头像       | 自定义字体       |
| 移除 VIP 彩色昵称      | 图片自适应窗口宽度 | 未读气泡显示真实消息数量 | 图片窗口全局拖拽 |
| [右键菜单选项高亮](https://github.com/yige-yigeren/LiteLoaderQQNT-HighlightReplies) | 记录离开时的位置   | 侧键返回                 | 关键词提醒       |
| 阻止 ESC 关闭窗口      | 链接预览           | 图片遮罩                 | 移除头衔         |
| 取消主窗口最小尺寸限制 | 同步系统主题色 |                          |                  |

## 声明

### 一切开发旨在学习，请勿用于非法和商业用途

- 轻量工具箱 是完全免费且开放源代码的软件，仅供学习和娱乐用途使用。
- 轻量工具箱 不会通过任何方式强制收取费用，或对使用者提出物质条件。
- 轻量工具箱 由整个开源社区维护，并不是属于某个个体的作品，所有贡献者都享有其作品的著作权。
- 轻量工具箱 禁止用于任何非法用途，插件开发属学习与研究目的，仅自用，未提供给任何第三方使用。任何不当使用导致的任何侵权问题责任自负。

## Star History

<picture>
  <source
    media="(prefers-color-scheme: dark)"
    srcset="https://starchart.cc/xiyuesaves/LiteLoaderQQNT-lite_tools.svg?background=%23ffffff00&axis=%23e6edf3&line=%2321acec"
  />
  <source
    media="(prefers-color-scheme: light)"
    srcset="https://starchart.cc/xiyuesaves/LiteLoaderQQNT-lite_tools.svg?background=%23ffffff00&axis=%231a1a1a&line=%2321acec"
  />
  <img
    alt="Star History Chart"
    src="https://starchart.cc/xiyuesaves/LiteLoaderQQNT-lite_tools.svg?background=%23ffffff00&axis=%231a1a1a&line=%2321acec"
  />
</picture>
