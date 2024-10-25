/**
 * 应用程序的配置对象。
 * @typedef {Object} Config
 * @property {Object} debug - 调试相关配置
 * @property {boolean} debug.mainConsoleToFile - 主进程日志保存到文件。
 * @property {boolean} debug.console - 渲染进程日志输出。
 * @property {boolean} debug.mainConsole - 启用主进程日志。
 * @property {boolean} debug.autoCompileScss - 自动编译 SCSS 文件。
 * @property {boolean} debug.showWeb - 打开网页显示主进程日志
 * @property {boolean} debug.showChannedCommunication - 显示所有通信数据
 * @property {Object} keywordReminder - 关键词提醒配置
 * @property {boolean} keywordReminder.enabled - 启用关键词提醒。
 * @property {Array<string>} keywordReminder.keyList - 关键词列表。
 * @property {Object} localEmoticons - 本地表情配置
 * @property {boolean} localEmoticons.enabled - 启用本地表情。
 * @property {boolean} localEmoticons.quickEmoticons - 快捷输入表情。
 * @property {boolean} localEmoticons.timeSort - 使用文件创建时间排序。
 * @property {boolean} localEmoticons.showFileName - 显示表情文件名。
 * @property {boolean} localEmoticons.quickEmoticonsAutoInputOnlyOne - 如果快速输入表情的候选只有一个时则自动填入。
 * @property {string} localEmoticons.quickEmoticonsActiveKey - 自定义 快捷输入表情 功能的快捷键。
 * @property {boolean} localEmoticons.sendBigImage - 以图片形式发送。
 * @property {boolean} localEmoticons.majorization - 内存优化。
 * @property {boolean} localEmoticons.commonlyEmoticons - 历史表情。
 * @property {boolean} localEmoticons.copyFileTolocalEmoticons - 添加右键菜单。
 * @property {boolean} localEmoticons.toLeftSlot - 移动功能位置。
 * @property {boolean} localEmoticons.hoverShowCommonlyEmoticons - 悬停显示历史表情。
 * @property {number} localEmoticons.commonlyNum - 历史表情数量。
 * @property {number} localEmoticons.recentlyNum - 最近使用分组数量。
 * @property {number} localEmoticons.rowsSize - 表情行数大小。
 * @property {string} localEmoticons.ffmpegPath - FFmpeg 路径。
 * @property {string} localEmoticons.tgBotToken - Telegram 机器人令牌。
 * @property {string} localEmoticons.localPath - 本地表情路径。
 * @property {Object} sidebar - 侧边栏配置
 * @property {Array<Object>} sidebar.top - 侧边栏顶部内容。
 * @property {Array<Object>} sidebar.bottom - 侧边栏底部内容。
 * @property {Object} imageViewer - 图片查看器配置
 * @property {boolean} imageViewer.quickClose - 启用快速关闭图片查看器。
 * @property {boolean} imageViewer.touchMove - 启用全局拖拽图片查看器。
 * @property {Object} message - 消息配置
 * @property {Object} message.previreUrl - 链接预览配置
 * @property {boolean} message.previreUrl.enabled - 启用链接预览。
 * @property {boolean} message.previreUrl.dontLoadPic - 不加载图片。
 * @property {boolean} message.goBackMainList - 启用侧键返回。
 * @property {boolean} message.disabledSticker - 禁用表情推荐。
 * @property {boolean} message.disabledHotGIF - 禁用表情中的GIF热图。
 * @property {boolean} message.disabledBadge - 禁用小红点。
 * @property {boolean} message.disabledSlideMultipleSelection - 阻止消息窗口拖拽操作。
 * @property {boolean} message.convertMiniPrgmArk - 小程序分享转为url卡片。
 * @property {boolean} message.showMsgTime - 显示消息时间。
 * @property {boolean} message.showMsgElapsedTime 显示消息发送后距离现在过了多久
 * @property {string} message.showMsgTimeFormat - 消息时间格式。
 * @property {string} message.showMsgTimeDateFormat - 消息日期格式。
 * @property {boolean} message.showMsgTimeZone - 显示消息时区。
 * @property {boolean} message.showMsgTimeToSenderName - 插入到用户名后方。
 * @property {boolean} message.replaceBtn - 启用+1。
 * @property {boolean} message.doubleClickReplace - 双击执行。
 * @property {boolean} message.removeReplyAt - 移除回复中的 @。
 * @property {boolean} message.mergeMessage - 合并消息。
 * @property {boolean} message.mergeMessageKeepTime - 保留合并消息时间。
 * @property {boolean} message.selfMsgToLeft - 自身消息在左侧显示。
 * @property {boolean} message.onlyAvatar - 只显示头像。
 * @property {boolean} message.unlockMainMinSize - 解锁主窗口最小尺寸。
 * @property {boolean} message.removeBubbleLimit - 未读气泡显示真实消息数量。
 * @property {boolean} message.removeVipName - 移除 VIP 彩色昵称。
 * @property {boolean} message.imageAutoWidth - 图片自适应窗口宽度。
 * @property {boolean} message.currentLocation - 记录离开时的位置。
 * @property {Object} message.overrideFont - 覆盖字体配置
 * @property {string} message.overrideFont.family - 字体家族。
 * @property {string} message.overrideFont.style - 字体样式。
 * @property {string} message.overrideFont.fullName - 字体全名。
 * @property {string} message.overrideFont.postscriptName - 字体 PostScript 名称。
 * @property {boolean} message.overrideEmoji - 覆盖 Emoji 字体。
 * @property {Object} message.preventNSFW - NSFW 遮罩配置
 * @property {boolean} message.preventNSFW.enabled - 启用 NSFW 遮罩。
 * @property {boolean} message.preventNSFW.includesAnimationEmoticons - 包含动画表情。
 * @property {Array<string>} message.preventNSFW.list - 启用 NSFW 遮罩列表。
 * @property {Object} message.avatarSticky - 头像浮动配置
 * @property {boolean} message.avatarSticky.enabled - 启用头像浮动。
 * @property {boolean} message.avatarSticky.toBottom - 头像浮动到底部。
 * @property {Object} qContextMenu - 右键菜单配置
 * @property {Object} qContextMenu.messageToImage - 消息转图片配置
 * @property {boolean} qContextMenu.messageToImage.enabled - 启用消息转图片。
 * @property {boolean} qContextMenu.messageToImage.highResolution - 启用高分辨率图片。
 * @property {string} qContextMenu.messageToImage.path - 图片保存路径。
 * @property {boolean} qContextMenu.HighlightReplies - 选项高亮。
 * @property {Object} qContextMenu.wordSearch - 划词搜索
 * @property {boolean} qContextMenu.wordSearch.enabled - 启用划词搜索。
 * @property {string} qContextMenu.wordSearch.searchUrl - 划词搜索的 URL 模板。
 * @property {Object} qContextMenu.imageSearch - 图片搜索配置
 * @property {boolean} qContextMenu.imageSearch.enabled - 启用图片搜索。
 * @property {string} qContextMenu.imageSearch.searchUrl - 图片搜索的 URL 模板。
 * @property {Object} preventMessageRecall - 防止消息撤回配置
 * @property {boolean} preventMessageRecall.enabled - 启用防止消息撤回。
 * @property {boolean} preventMessageRecall.localStorage - 使用本地存储防止撤回。
 * @property {boolean} preventMessageRecall.customColor - 自定义颜色。
 * @property {boolean} preventMessageRecall.preventSelfMsg - 防止自己消息撤回。
 * @property {boolean} preventMessageRecall.blockAllRetractions - 阻止所有撤回。
 * @property {boolean} preventMessageRecall.cacheHistory - 缓存历史消息。
 * @property {boolean} preventMessageRecall.stealthMode - 隐蔽模式。
 * @property {Object} preventMessageRecall.textColor - 文本颜色配置
 * @property {string} preventMessageRecall.textColor.light - 浅色主题颜色。
 * @property {string} preventMessageRecall.textColor.dark - 深色主题颜色。
 * @property {Object} tail - 消息后缀配置
 * @property {boolean} tail.enabled - 启用消息后缀功能。
 * @property {boolean} tail.tips - 启用提示功能。
 * @property {Array<Object>} tail.list - 消息后缀列表。
 * @property {Array<Object>} textAreaFuncList - 文本区域功能列表。
 * @property {Array<Object>} chatAreaFuncList - 聊天区域功能列表。
 * @property {boolean} preventEscape - 阻止 ESC 关闭窗口。
 * @property {boolean} setWindowIcon - 窗口使用聊天头像作为图标。
 * @property {boolean} autoRelanch - 更新自动重启。
 * @property {Object} background - 背景配置
 * @property {boolean} background.overlaySiderBar - 覆盖侧边栏。
 * @property {boolean} background.removeMask - 移除遮罩。
 * @property {boolean} background.backgroundVisible - 增强可读性。
 * @property {boolean} background.blurFilter - 启用背景模糊。
 * @property {number} background.opacity - 背景透明度。
 * @property {boolean} background.enabled - 启用背景。
 * @property {string} background.url - 背景 URL。
 * @property {Object} global - 全局配置 - 该对象下的内容将在每次重启时被重置
 * @property {string} global.UA - 用户代理字符串。
 * @property {string} global.rkey - rkey 参数。
 * @property {string} global.updateUrl - 更新 URL。
 * @property {string} global.IMAGE_HTTP_HOST - 图片 HTTP 主机地址。
 * @property {string} global.IMAGE_HTTP_HOST_NT - 图片 HTTP NT 主机地址。
 * @property {string} rkeyAPI - rkey API。
 * @property {Object} proxy - 代理配置
 * @property {boolean} proxy.enabled - 启用代理。
 * @property {string} proxy.url - 代理 URL。
 * @property {Object} disableQtag - 移除头衔配置
 * @property {boolean} disableQtag.level - 移除等级头衔。
 * @property {boolean} disableQtag.title - 移除自定义头衔。
 * @property {boolean} disableQtag.all - 移除所有头衔。
 * @property {Object} appearance - 样式相关
 * @property {boolean} appearance.useSystemAccentColor - 使用系统颜色。// 虽然message是口大锅，但这个塞进去还是感觉有点怪…
 * @property {boolean} appearance.prioritizeColor - 尝试提高优先级。
 * @property {boolean} resetLoginInfo - 重置登录信息。
 */

/**
 * @type {Config}
 */
const options = lite_tools.getOptions();
const updateFunctions = [];

lite_tools.updateOptions((event, newOpt) => {
  Object.keys(newOpt).forEach((key) => {
    options[key] = newOpt[key];
  });
  dispatchUpdateOptions();
});

/**
 * 触发配置更新
 */
function dispatchUpdateOptions() {
  // log("更新配置文件");
  updateFunctions.forEach((fun) => {
    fun(options);
  });
}

/**
 * 监听配置更新
 * @param {Function} callback 触发函数
 */
function updateOptions(callback) {
  updateFunctions.push(callback);
}

export { options, updateOptions };
