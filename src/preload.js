// Electron 主进程 与 渲染进程 交互的桥梁
const { contextBridge, ipcRenderer } = require("electron");

// 在window对象下导出只读对象
contextBridge.exposeInMainWorld("lite_tools", {
  // 更新样式信息
  updateStyle: (callback) => ipcRenderer.on("LiteLoader.lite_tools.updateStyle", callback),
  // 更新全局样式
  updateGlobalStyle: (callback) => ipcRenderer.on("LiteLoader.lite_tools.updateGlobalStyle", callback),
  // 更新设置界面样式
  updateSettingStyle: (callback) => ipcRenderer.on("LiteLoader.lite_tools.updateSettingStyle", callback),
  // 更新配置信息
  updateOptions: (callback) => ipcRenderer.on("LiteLoader.lite_tools.updateOptions", callback),
  // 撤回事件监听
  onMessageRecall: (callback) => ipcRenderer.on("LiteLoader.lite_tools.onMessageRecall", callback),
  // 监听本地表情更新
  updateEmoticons: (callback) => ipcRenderer.on("LiteLoader.lite_tools.updateEmoticons", callback),
  // 监听常用表情列表更新
  updateLocalEmoticonsConfig: (callback) => ipcRenderer.on("LiteLoader.lite_tools.updateLocalEmoticonsConfig", callback),
  // 主动获取本地表情列表
  getLocalEmoticonsList: () => ipcRenderer.invoke("LiteLoader.lite_tools.getLocalEmoticonsList"),
  // 主动获取常用表情列表
  getLocalEmoticonsConfig: () => ipcRenderer.invoke("LiteLoader.lite_tools.getLocalEmoticonsConfig"),
  // 删除本地表情文件
  deleteEmoticonsFile: (path) => ipcRenderer.invoke("LiteLoader.lite_tools.deleteEmoticonsFile", path),
  // 设置窗口向主进程请求消息窗口侧边栏按钮信息
  getSidebar: (msg) => ipcRenderer.invoke("LiteLoader.lite_tools.getSidebar", msg),
  // 获取配置文件
  getOptions: () => ipcRenderer.sendSync("LiteLoader.lite_tools.getOptions"),
  // 更新配置文件
  setOptions: (options) => ipcRenderer.send("LiteLoader.lite_tools.setOptions", options),
  // 获取撤回信息数据
  getMessageRecallId: () => ipcRenderer.invoke("LiteLoader.lite_tools.getMessageRecallId"),
  // 消息窗口向主进程发送输入框上方功能列表
  sendTextAreaList: (list) => ipcRenderer.send("LiteLoader.lite_tools.sendTextAreaList", list),
  // 消息窗口向主进程发送侧边栏按钮信息
  sendSidebar: (list) => ipcRenderer.send("LiteLoader.lite_tools.sendSidebar", list),
  // 监听背景数据变化
  onUpdateWallpaper: (callback) => ipcRenderer.on("LiteLoader.lite_tools.updateWallpaper", callback),
  // 获取背景数据
  getWallpaper: () => ipcRenderer.invoke("LiteLoader.lite_tools.getWallpaper"),
  // 聊天窗口顶部功能列表
  sendChatTopList: (list) => ipcRenderer.send("LiteLoader.lite_tools.sendChatTopList", list),
  // 在浏览器打开页面
  openWeb: (url) => ipcRenderer.send("LiteLoader.lite_tools.openWeb", url),
  // 在主进程的终端打印渲染进程日志
  log: (...args) => ipcRenderer.send("LiteLoader.lite_tools.log", ...args),
  // 更新常用表情列表
  addCommonlyEmoticons: (src) => ipcRenderer.send("LiteLoader.lite_tools.addCommonlyEmoticons", src),
  // 更新更新最近使用分组
  updateRecentFolders: (src) => ipcRenderer.send("LiteLoader.lite_tools.updateRecentFolders", src),
  // 获取窗口Id
  getWebContentId: () => ipcRenderer.sendSync("LiteLoader.lite_tools.getWebContentId"),
  // 打开文件路径
  openFolder: (path) => ipcRenderer.send("LiteLoader.lite_tools.openFolder", path),
  // 打开文件
  openFile: (path) => ipcRenderer.send("LiteLoader.lite_tools.openFile", path),
  // 清理本地保存撤回记录
  clearLocalStorageRecallMsg: () => ipcRenderer.send("LiteLoader.lite_tools.clearLocalStorageRecallMsg"),
  // 打开本地撤回数据
  openRecallMsgList: () => ipcRenderer.send("LiteLoader.lite_tools.openRecallMsgList"),
  // 获取所有的撤回消息
  getReacllMsgData: () => ipcRenderer.send("LiteLoader.lite_tools.getReacllMsgData"),
  // 获取所有撤回数据
  onReacllMsgData: (callback) => ipcRenderer.on("LiteLoader.lite_tools.onReacllMsgData", callback),
  // 获取所有的撤回消息数量
  getRecallListNum: () => ipcRenderer.sendSync("LiteLoader.lite_tools.getRecallListNum"),
  // 更新撤回消息数量
  onUpdateRecallListNum: (callback) => ipcRenderer.on("LiteLoader.lite_tools.updateRecallListNum", callback),
  // 跳转到指定聊天对话的指定位置处
  sendToMsg: (sceneData) => ipcRenderer.send("LiteLoader.lite_tools.sendToMsg", sceneData),
  // 通过Uid获取用户信息
  getUserInfo: (uid) => ipcRenderer.invoke("LiteLoader.lite_tools.getUserInfo", uid),
  // 保存blob到本地
  saveBase64ToFile: (...args) => ipcRenderer.send("LiteLoader.lite_tools.saveBase64ToFile", ...args),
  // 从历史记录中移除指定文件
  deleteCommonlyEmoticons: (path) => ipcRenderer.send("LiteLoader.lite_tools.deleteCommonlyEmoticons", path),
  // 设为分组图标
  setEmoticonsIcon: (path) => ipcRenderer.send("LiteLoader.lite_tools.setEmoticonsIcon", path),
  // 设为分组名称
  renameEmoticons: (...args) => ipcRenderer.send("LiteLoader.lite_tools.renameEmoticons", ...args),
  // 关键字提醒
  onKeywordReminder: (callback) => ipcRenderer.on("LiteLoader.lite_tools.onKeywordReminder", callback),
  // 复制文件
  copyFile: (...args) => ipcRenderer.invoke("LiteLoader.lite_tools.copyFile", ...args),
  // 获取链接预览数据
  getWebPrevew: (...args) => ipcRenderer.send("LiteLoader.lite_tools.getWebPrevew", ...args),
  // 获取链接预览数据回调
  onWebPreviewData: (callback) => ipcRenderer.on("LiteLoader.lite_tools.onWebPreviewData", callback),
  // 设置窗口图标
  setWindowIcon: (...args) => ipcRenderer.send("LiteLoader.lite_tools.setWindowIcon", ...args),
  // 检测插件是否更新
  checkUpdate: () => ipcRenderer.invoke("LiteLoader.lite_tools.checkUpdate"),
  // 发送更新请求到主进程
  updatePlugins: (url) => ipcRenderer.send("LiteLoader.lite_tools.updatePlugins", url),
  // 监听更新事件
  updateEvent: (callback) => ipcRenderer.on("LiteLoader.lite_tools.updateEvent", callback),
  // 获取用户配置数据
  getUserConfig: () => ipcRenderer.invoke("LiteLoader.lite_tools.getUserConfig"),
  // 请求更新代理可用性
  applyProxy: (url) => ipcRenderer.invoke("LiteLoader.lite_tools.applyProxy", url),
  // 请求更新代理可用性
  checkProxy: () => ipcRenderer.send("LiteLoader.lite_tools.checkProxy"),
  // 检测代理可用性监听
  updateProxyStatus: (callback) => ipcRenderer.on("LiteLoader.lite_tools.updateProxyStatus", callback),
  // 通用文件选择窗口
  showOpenDialog: (data) => ipcRenderer.invoke("LiteLoader.lite_tools.showOpenDialog", data),
  // 获取图片rkey
  getRkey: (chatType) => ipcRenderer.invoke("LiteLoader.lite_tools.getRkey", chatType),
  // 删除账号独立配置
  deleteUserConfig: (uid) => ipcRenderer.send("LiteLoader.lite_tools.deleteUserConfig", uid),
  // 添加账号独立配置
  addUserConfig: (uid, value) => ipcRenderer.send("LiteLoader.lite_tools.addUserConfig", uid, value),
  // Telegram贴纸集下载请求
  downloadTgSticker: (url) => ipcRenderer.send("LiteLoader.lite_tools.downloadTgSticker", url),
  // Telegram贴纸集下载事件回调
  onDownloadTgStickerEvent: (callback) => ipcRenderer.on("LiteLoader.lite_tools.onDownloadTgStickerEvent", callback),
  // 导入eif表情文件
  extractEifFile: (eifPath) => ipcRenderer.send("LiteLoader.lite_tools.extractEifFile", eifPath),
  // 主进程向渲染进程发送通知
  onToast: (...args) => ipcRenderer.on("LiteLoader.lite_tools.onToast", ...args),
  // 获取系统主色
  getSystemAccentColor: () => ipcRenderer.invoke("LiteLoader.lite_tools.getSystemAccentColor"),
  // 系统主色变化
  onSystemAccentColorChanged: (...args) => ipcRenderer.on("LiteLoader.lite_tools.onSystemAccentColorChanged", ...args),
  // 窗口加载完成事件
  windowOnload: () => ipcRenderer.send("LiteLoader.lite_tools.windowOnload"),
  // 清除所有提示
  clearToast: (callback) => ipcRenderer.on("LiteLoader.lite_tools.clearToast", callback),
  /**
   *
   * @param {String} sendEventName 发送事件名称
   * @param {String} cmdName 命令名称
   * @param {Array} args 参数数组
   * @param {Null | Boolean | String | String[]} awaitCallback 是否需要等待回调，如果传入为字符串，则将回调监听事件改为该字符串
   * @param {Boolean} register 注册事件监听回调用，只在启动QQ时使用，基本不会用到
   * @returns
   */
  nativeCall: (sendEventName, cmdName, args, webContentId = 2, awaitCallback = false, register = false) => {
    const callbackId = crypto.randomUUID();
    const eventName = `${sendEventName}-${webContentId}${register ? "-register" : ""}`;
    let resolve;
    if (awaitCallback) {
      resolve = new Promise((res) => {
        function onEvent(event, ...args) {
          if (typeof awaitCallback === "boolean") {
            if (args[0]?.callbackId === callbackId) {
              ipcRenderer.off(`IPC_DOWN_${webContentId}`, onEvent);
              res(args[1]);
            }
          } else if (Array.isArray(awaitCallback)) {
            if (awaitCallback.includes(args?.[1]?.[0]?.cmdName)) {
              ipcRenderer.off(`IPC_DOWN_${webContentId}`, onEvent);
              res(args[1]);
            }
          } else {
            if (args?.[1]?.[0]?.cmdName === awaitCallback) {
              ipcRenderer.off(`IPC_DOWN_${webContentId}`, onEvent);
              res(args[1]);
            }
          }
        }
        ipcRenderer.on(`IPC_DOWN_${webContentId}`, onEvent);
      });
    } else {
      resolve = Promise.resolve(true);
    }
    // 发送事件
    ipcRenderer.send(
      `IPC_UP_${webContentId}`,
      {
        type: "request",
        callbackId,
        eventName,
      },
      [cmdName, ...args],
    );
    return resolve;
  },
});
