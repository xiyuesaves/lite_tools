import { join } from "path";
import { existsSync, mkdirSync, writeFileSync, unlink, readdirSync } from "fs";
import { ipcMain, dialog, BrowserWindow } from "electron";
import { randomUUID } from "crypto";
import { config, loadConfigPath, onUpdateConfig } from "./config.js";
import { settingWindow } from "./captureWindow.js";
import { MessageRecallList } from "./MessageRecallList.js";
import { globalBroadcast } from "./globalBroadcast.js";
import { checkChatType } from "./checkChatType.js";
import { findEventIndex } from "./findEventIndex.js";
import { LimitedMap } from "./LimitedMap.js";
import { processPic } from "./processPic.js";
import { Logs } from "./logs.js";
const log = new Logs("阻止撤回模块");

// 重置函数this指向
ipcMain.emit = ipcMain.emit.bind(ipcMain);

/**
 * 撤回数据保存文件夹路径
 * @type {string}
 */
let recallMsgDataFolderPath;

/**
 * 最新的撤回消息本地json文件路径
 * @type {string}
 */
let recallMsgDataPath;

/**
 * 常驻内存撤回数据
 * @type {MessageRecallList} 撤回数据实例
 */
let recordMessageRecallIdList;

/**
 * 内存缓存撤回消息
 */
let tempRecordMessageRecallIdList;

/**
 * 撤回消息数量
 * @type {number}
 */
let localRecallMsgNum;

/**
 * 历史撤回消息文件列表
 */
let messageRecallFileList;

/**
 * 查看撤回数据窗口
 */
let recallViewWindow;

/**
 * 内存缓存消息记录实例-用于根据消息id获取撤回原始内容
 * 每1万条消息大概占用50M内存
 */
const catchMsgList = new LimitedMap(20000);

/**
 * 被主动激活的消息列表
 */
const activeMessageList = new Set();

// 初始化模块
let initModule = false;

/**
 * 加载阻止撤回模块
 * @param {String} loadConfigPath 本地配置文件路径
 */
onUpdateConfig(() => {
  if (!initModule) {
    initModule = true;
    log("加载配置文件", loadConfigPath);
    recallMsgDataFolderPath = join(loadConfigPath, "messageRecall");
    recallMsgDataPath = join(recallMsgDataFolderPath, "latestRecallMessage.json");
    initLocalFile();
    recordMessageRecallIdList = new MessageRecallList(recallMsgDataPath, recallMsgDataFolderPath, 100);
    tempRecordMessageRecallIdList = new Map();
    localRecallMsgNum = messageRecallFileList.length * 100 + recordMessageRecallIdList.map.size;
    // 监听常驻历史撤回记录实例创建新的文件切片
    recordMessageRecallIdList.onNewFile((sliceTime) => {
      messageRecallFileList.push(sliceTime);
      messageRecallFileList.sort((a, b) => a - b);
    });
    recordMessageRecallIdList.onNewRecallMsg(() => {
      localRecallMsgNum = messageRecallFileList.length * 100 + recordMessageRecallIdList.map.size;
      log("更新本地撤回消息数量", localRecallMsgNum);
      globalBroadcast("LiteLoader.lite_tools.updateRecallListNum", localRecallMsgNum);
    });
  }
});

// 阻止撤回send
function messageRecall(args) {
  // 阻止撤回逻辑
  if (config.preventMessageRecall.enabled) {
    // 接收到获取历史消息列表
    const msgList = args[2]?.msgList;
    if (msgList && msgList.length && checkChatType(msgList[0])) {
      preventRecallMessage(msgList);
      return;
    }

    // 最近联系人列表更新事件 - 选项>阻止撤回>拦截所有撤回
    const findRecentListIndex = findEventIndex(args, "nodeIKernelRecentContactListener/onRecentContactListChangedVer2");
    if (config.preventMessageRecall.blockAllRetractions && findRecentListIndex !== -1) {
      activeAllChat(args?.[2]?.[findRecentListIndex]);
      return;
    }

    // 接收到的新消息
    const onRecvMsg = findEventIndex(args, `nodeIKernelMsgListener/onRecvMsg`);
    const onRecvActiveMsg = findEventIndex(args, `nodeIKernelMsgListener/onRecvActiveMsg`);
    const recvMsgUpdate = onRecvMsg !== -1 ? onRecvMsg : onRecvActiveMsg;
    if (checkChatType(args?.[2]?.[recvMsgUpdate]?.payload?.msgList?.[0])) {
      const msgList = args[2][recvMsgUpdate].payload.msgList;
      for (let i = 0; i < msgList.length; i++) {
        const msgItem = msgList[i];
        if (msgItem?.elements?.length) {
          catchMsgList.set(msgItem.msgId, msgItem);
        }
      }
      return;
    }

    // 消息列表更新
    const onMsgInfoListUpdate = findEventIndex(args, "nodeIKernelMsgListener/onMsgInfoListUpdate");
    const onActiveMsgInfoUpdate = findEventIndex(args, "nodeIKernelMsgListener/onActiveMsgInfoUpdate");
    const msgInfoListUpdate = onMsgInfoListUpdate !== -1 ? onMsgInfoListUpdate : onActiveMsgInfoUpdate;
    if (checkChatType(args?.[2]?.[msgInfoListUpdate]?.payload?.msgList?.[0])) {
      const msgList = args[2][msgInfoListUpdate].payload.msgList;
      for (let i = 0; i < msgList.length; i++) {
        const msgItem = msgList[i];
        /**
         * 找到的撤回元素
         */
        const findRevokeElement = msgItem?.elements?.find((element) => element?.grayTipElement?.revokeElement);
        if (findRevokeElement) {
          const revokeElement = findRevokeElement.grayTipElement.revokeElement;
          if (revokeElement.isSelfOperate && !config.preventMessageRecall.preventSelfMsg) {
            continue;
          }
          log("捕获到实时撤回事件", msgItem);
          const findInCatch = catchMsgList.get(msgItem.msgId);
          if (findInCatch) {
            const recallData = getRecallData(msgItem, revokeElement);
            findInCatch.lite_tools_recall = recallData;
            globalBroadcast("LiteLoader.lite_tools.onMessageRecall", {
              msgId: findInCatch.msgId,
              recallData,
            });
            if (config.preventMessageRecall.localStorage) {
              recordMessageRecallIdList.set(findInCatch.msgId, findInCatch);
            } else {
              tempRecordMessageRecallIdList.set(findInCatch.msgId, findInCatch);
            }
            processPic(findInCatch);
            if (!config.preventMessageRecall.stealthMode) {
              args[2][msgInfoListUpdate].payload.msgList.splice(i, 1);
            }
            log("成功阻止实时撤回");
          } else {
            log("撤回消息没有被记录，反撤回失败");
          }
        } else if (msgItem.elements.length) {
          //是正常消息，存入缓存
          catchMsgList.set(msgItem.msgId, msgItem);
        }
      }
      return;
    }
  }
}

// 激活所有聊天对象
function activeAllChat(recentContactList) {
  // log("检测到联系人列表更新", recentContactList);
  const recentContactLists = recentContactList?.payload?.changedRecentContactLists;
  if (recentContactLists instanceof Array) {
    for (let i = 0; i < recentContactLists.length; i++) {
      const list = recentContactLists[i];
      if (list.changedList instanceof Array) {
        for (let i = 0; i < list.changedList.length; i++) {
          const item = list.changedList[i];
          // 过滤好友，群组，临时会话的消息
          if (checkChatType(item)) {
            const peer = {
              chatType: item.chatType,
              peerUid: item.peerUid,
              guildId: "",
            };
            if (activeMessageList.has(peer.peerUid)) {
              continue;
            }
            log("激活聊天", activeMessageList.size, peer);
            activeMessageList.add(peer.peerUid);
            ipcMain.emit("IPC_UP_2", {}, { type: "request", callbackId: randomUUID(), eventName: "ns-ntApi-2" }, [
              "nodeIKernelMsgService/getAioFirstViewLatestMsgsAndAddActiveChat",
              {
                peer,
                cnt: 10,
              },
              null,
            ]);
          }
        }
      }
    }
  }
}

// 替换消息列表中的撤回标记
function preventRecallMessage(msgList) {
  let historyMessageRecallList = new Map();
  // log("处理消息列表", msgList.length);
  for (let i = 0; i < msgList.length; i++) {
    const msgItem = msgList[i];
    for (let j = 0; j < msgItem.elements.length; j++) {
      const msgElements = msgItem.elements[j];
      // 不是撤回消息，跳过
      if (!msgElements?.grayTipElement?.revokeElement) {
        // 缓存历史消息
        if (config.preventMessageRecall.cacheHistory) {
          catchMsgList.set(msgItem.msgId, msgItem);
        }
        continue;
      }
      // 是自己的撤回消息，判断是否开启了拦截自己的撤回消息
      if (msgElements?.grayTipElement?.revokeElement?.isSelfOperate && !config.preventMessageRecall.preventSelfMsg) {
        continue;
      }
      log("检测到撤回标记", msgItem);
      const revokeElement = msgElements.grayTipElement.revokeElement;
      const findInCatch = catchMsgList.get(msgItem.msgId);
      if (findInCatch) {
        // 添加插件撤回标记
        findInCatch.lite_tools_recall = getRecallData(msgItem, revokeElement);
        // 判断存储位置
        if (config.preventMessageRecall.localStorage) {
          recordMessageRecallIdList.set(findInCatch.msgId, findInCatch);
        } else {
          tempRecordMessageRecallIdList.set(findInCatch.msgId, findInCatch);
        }
        processPic(findInCatch);
        log(`${msgItem.msgId} 从常驻内存撤回列表中找到消息记录`, findInCatch);
        if (!config.preventMessageRecall.stealthMode) {
          msgList[i] = findInCatch;
        }
      } else {
        let recallIdList;
        // 判断是从哪个对象中读取撤回数据
        if (config.preventMessageRecall.localStorage) {
          recallIdList = recordMessageRecallIdList;
        } else {
          recallIdList = tempRecordMessageRecallIdList;
        }
        const findInRecord = recallIdList.get(msgItem.msgId);
        if (findInRecord) {
          processPic(findInRecord);
          log(`${msgItem.msgId} 从常驻内存中找撤回数据`, findInRecord);
          if (!config.preventMessageRecall.stealthMode) {
            findInRecord.lite_tools_recall = getRecallData(msgItem, revokeElement);
            msgList[i] = findInRecord;
          }
        } else if (config.preventMessageRecall.localStorage) {
          const msgRecallTime = parseInt(msgItem.recallTime) * 1000; // 获取消息发送时间
          const historyFile = messageRecallFileList.find((sliceTime) => sliceTime >= msgRecallTime); // 有概率含有这条撤回消息的切片文件
          if (historyFile) {
            if (!historyMessageRecallList.has(historyFile)) {
              log(`加载可能含有撤回消息的历史切片 ${historyFile}`);
              const messageRecallList = new MessageRecallList(join(recallMsgDataFolderPath, `${historyFile}.json`));
              log(messageRecallList.map);
              historyMessageRecallList.set(historyFile, messageRecallList);
            } else {
              log("已加载历史切片", historyFile);
            }
            const findInHistory = historyMessageRecallList.get(historyFile).get(msgItem.msgId);
            if (findInHistory) {
              processPic(findInHistory);
              log(`${msgItem.msgId} 从历史切片中找到消息记录`, findInHistory);
              if (!config.preventMessageRecall.stealthMode) {
                findInHistory.lite_tools_recall = getRecallData(msgItem, revokeElement);
                msgList[i] = findInHistory;
              }
            } else {
              log(`${msgItem.msgId} 本地没有撤回记录`);
            }
          } else {
            log(`${msgItem.msgId} 没有对应时间的历史切片`);
          }
        } else {
          log(`${msgItem.msgId} 内存中没有撤回记录`);
        }
      }
    }
  }
  // log("消息列表处理完成");
}

// 初始化本地撤回数据结构
function initLocalFile() {
  try {
    // 初始化撤回消息列表文件路径
    if (!existsSync(recallMsgDataFolderPath)) {
      mkdirSync(recallMsgDataFolderPath, { recursive: true });
    }
    // 初始化当前撤回消息保存文件
    if (!existsSync(recallMsgDataPath)) {
      writeFileSync(recallMsgDataPath, JSON.stringify([], null, 4));
    }
    // 获取当前撤回消息文件列表
    const dirList = readdirSync(recallMsgDataFolderPath);
    messageRecallFileList = dirList
      .filter((item) => parseInt(item).toString().length === 13)
      .map((item) => parseInt(item.replace(".json", "")))
      .sort((a, b) => a - b);
  } catch (err) {
    log("初始化本地撤回数据结构失败", err);
  }
}

/**
 * 返回撤回数据
 * @param {Object} msgItem 消息对象
 * @param {Object} revokeElement 撤回元素
 * @returns {Object} 撤回数据
 */
function getRecallData(msgItem, revokeElement) {
  return {
    operatorNick: revokeElement.operatorNick, // 执行撤回昵称
    operatorRemark: revokeElement.operatorRemark, // 执行撤回备注昵称
    operatorMemRemark: revokeElement.operatorMemRemark, // 执行撤回群昵称
    origMsgSenderNick: revokeElement.origMsgSenderNick, // 发送消息角色
    origMsgSenderRemark: revokeElement.origMsgSenderRemark, // 发送消息角色
    origMsgSenderMemRemark: revokeElement.origMsgSenderMemRemark, // 发送消息角色
    recallTime: msgItem.recallTime, // 撤回时间
  };
}

/**
 * 清理本地撤回数据
 */
function deleteAllLocalRecallData() {
  try {
    // 读取目录中的所有文件
    const files = readdirSync(recallMsgDataFolderPath);
    // 遍历文件数组，删除历史数据
    files.forEach((file) => {
      const filePath = join(recallMsgDataFolderPath, file);
      if (file !== "latestRecallMessage.json") {
        // 删除文件
        unlink(filePath, (err) => {
          if (err) {
            console.error("删除文件失败:", err);
          } else {
            log("删除成功:", filePath);
          }
        });
      }
    });
    messageRecallFileList = [];
    localRecallMsgNum = 0;
    settingWindow.webContents.send("LiteLoader.lite_tools.updateRecallListNum", localRecallMsgNum);
    settingWindow.webContents.send("LiteLoader.lite_tools.onToast", {
      content: `删除成功`,
      type: "success",
      duration: "3000",
    });
    log("已清空本地撤回数据");
  } catch (err) {
    settingWindow.webContents.send("LiteLoader.lite_tools.onToast", {
      content: `删除失败：${err.message}`,
      type: "error",
      duration: "3000",
    });
  }
}

function discardDeleteActive(args) {
  if (config?.preventMessageRecall?.blockAllRetractions && args[3]?.[1]?.[0] === "nodeIKernelMsgService/deleteActiveChatByUid") {
    log("丢弃删除激活窗口消息", args);
    return false;
  }
  return true;
}

// 删除所有本地保存撤回记录
ipcMain.on("LiteLoader.lite_tools.clearLocalStorageRecallMsg", () => {
  log("尝试清除本地数据");
  const result = dialog.showMessageBoxSync(settingWindow, {
    type: "warning",
    title: "警告",
    message: "您即将清空所有撤回消息数据，是否继续？",
    buttons: ["是", "否"],
    defaultId: 0,
    cancelId: 1,
  });
  if (result === 0) {
    recordMessageRecallIdList.map = new Map();
    recordMessageRecallIdList.saveFile();
    log("已清空常驻历史撤回记录");
    deleteAllLocalRecallData();
  }
});

// 查看本地撤回数据
ipcMain.on("LiteLoader.lite_tools.openRecallMsgList", () => {
  if (recallViewWindow) {
    recallViewWindow.webContents.focus();
  } else {
    log("打开撤回消息查看窗口");
    recallViewWindow = new BrowserWindow({
      width: 800,
      height: 600,
      autoHideMenuBar: true,
      webPreferences: {
        preload: join(LiteLoader.plugins.lite_tools.path.plugin, "/src/preload.js"),
      },
    });
    recallViewWindow.loadFile(join(LiteLoader.plugins.lite_tools.path.plugin, `/src/html/showRecallList.html`));
    log("加载页面");
    recallViewWindow.webContents.on("before-input-event", (_, input) => {
      if (input.key == "F5" && input.type == "keyUp") {
        log("刷新页面");
        recallViewWindow.loadFile(join(LiteLoader.plugins.lite_tools.path.plugin, `/src/html/showRecallList.html`));
      }
    });
    recallViewWindow.on("closed", () => {
      log("窗口被关闭");
      recallViewWindow = null;
    });
  }
});

// 获取本地保存的撤回消息数量
ipcMain.on("LiteLoader.lite_tools.getRecallListNum", (event) => {
  event.returnValue = localRecallMsgNum;
});

// 发送所有的本地撤回数据
ipcMain.on("LiteLoader.lite_tools.getReacllMsgData", () => {
  log("开始发送所有的本地撤回数据");
  recallViewWindow.webContents.send("LiteLoader.lite_tools.onReacllMsgData", recordMessageRecallIdList.map, messageRecallFileList.length);
  for (let i = 0; i < messageRecallFileList.length; i++) {
    const sliceTime = messageRecallFileList[i];
    const recall = new MessageRecallList(join(recallMsgDataFolderPath, `${sliceTime}.json`));
    recallViewWindow.webContents.send("LiteLoader.lite_tools.onReacllMsgData", recall.map, messageRecallFileList.length - i - 1);
    log("发送切片数据", sliceTime);
  }
  log("发送结束");
});

export { messageRecall, discardDeleteActive };
