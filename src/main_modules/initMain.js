import { copyFile, writeFileSync, existsSync } from "fs";
import { ipcMain, shell, dialog, BrowserWindow } from "electron";
import { normalize, join } from "path";
import { randomUUID } from "crypto";
import { config, updateConfig } from "./config.js";
// import { getRkey } from "./getRkey.js";
import { Logs } from "./logs.js";
const log = new Logs("initMain");

import { EventEmitter } from "node:events";
const mainEvent = new EventEmitter();

// 重置函数this指向
ipcMain.emit = ipcMain.emit.bind(ipcMain);

function initMain() {
  log("初始化主进程");
}

/**
 * 初始化 IPC 通信
 */
function initializeIPCCommunication() {
  log("初始化IPC通信");
  // 打开网址
  ipcMain.on("LiteLoader.lite_tools.openWeb", (_, url) => {
    shell.openExternal(url);
  });

  // 复制文件
  ipcMain.handle("LiteLoader.lite_tools.copyFile", async (_, from, to) => {
    return await new Promise((res) => {
      copyFile(from, to, (err) => {
        if (err) {
          res(false);
        } else {
          res(true);
        }
      });
    });
  });

  // 返回窗口id
  ipcMain.on("LiteLoader.lite_tools.getWebContentId", (event) => {
    log("获取窗口id", event.sender.id.toString());
    event.returnValue = event.sender.id.toString();
  });

  // 更新侧边栏功能列表
  ipcMain.on("LiteLoader.lite_tools.sendSidebar", (_, list) => {
    config.sidebar = list;
    updateConfig(config);
  });

  // 更新输入框上方功能列表
  ipcMain.on("LiteLoader.lite_tools.sendTextAreaList", (_, list) => {
    list.forEach((item) => {
      const find = config.textAreaFuncList.find((el) => el.id === item.id);
      if (find) {
        find.name === item.name;
      }
      if (!find) {
        config.textAreaFuncList.push(item);
      }
    });
    updateConfig(config);
  });

  // 更新聊天框上方功能列表
  ipcMain.on("LiteLoader.lite_tools.sendChatTopList", (_, list) => {
    list.forEach((item) => {
      const find = config.chatAreaFuncList.find((el) => el.id === item.id);
      if (find) {
        find.name = item.name;
      }
      if (!find) {
        config.chatAreaFuncList.push(item);
      }
    });
    updateConfig(config);
  });

  // 打开文件夹
  ipcMain.on("LiteLoader.lite_tools.openFolder", (_, localPath) => {
    const openPath = normalize(localPath);
    shell.showItemInFolder(openPath);
  });

  // 打开文件
  ipcMain.on("LiteLoader.lite_tools.openFile", (_, localPath) => {
    const openPath = normalize(localPath);
    shell.openPath(openPath);
  });

  // 获取用户信息事件
  ipcMain.handle("LiteLoader.lite_tools.getUserInfo", async (_, uid) => {
    const userInfo = await new Promise((resolve) => {
      const onEvent = (channel, ...args) => {
        if (channel === "IPC_DOWN_2" && args[1]?.[0]?.cmdName === "onProfileSimpleChanged") {
          mainEvent.off("ipc-send", onEvent);
          resolve(args[1]);
        }
      };

      mainEvent.on("ipc-send", onEvent);

      ipcMain.emit("IPC_UP_2", {}, { type: "request", callbackId: randomUUID(), eventName: "ns-ntApi-2" }, [
        "nodeIKernelProfileService/fetchUserDetailInfo",
        {
          callFrom: "BuddyProfileStore",
          uid: [uid],
          source: 1,
          bizList: [0],
        },
        undefined,
      ]);
    });
    return userInfo;
  });

  // 跳转到指定聊天窗口的对应消息
  ipcMain.on("LiteLoader.lite_tools.sendToMsg", (_, sceneData) => {
    ipcMain.emit(
      "IPC_UP_2",
      {
        sender: {
          send: () => {},
        },
      },
      { type: "request", callbackId: randomUUID(), eventName: "ns-WindowApi-2" },
      [
        "goMainWindowScene",
        {
          scene: sceneData.scene,
          sceneParams: {
            peerUid: sceneData.peerUid,
            chatType: sceneData.chatType,
            type: sceneData.type,
            params: {
              msgId: sceneData.msgId,
            },
          },
        },
      ],
    );
  });

  // 设置窗口图标
  ipcMain.on("LiteLoader.lite_tools.setWindowIcon", (_, path, webContentId) => {
    try {
      const webContent = BrowserWindow.fromId(parseInt(webContentId));
      webContent.setIcon(path);
    } catch (err) {
      log("设置窗口图标失败", err.message);
    }
  });

  // 保存图片消息到本地
  ipcMain.on("LiteLoader.lite_tools.saveBase64ToFile", async (_, fileName, base64) => {
    log("接收到保存为文件事件");
    const buffer = Buffer.from(base64.split(",")[1], "base64");
    if (config.qContextMenu.messageToImage.path && existsSync(config.qContextMenu.messageToImage.path)) {
      const savePath = join(config.qContextMenu.messageToImage.path, fileName);
      log("默认文件路径", savePath);
      writeFileSync(savePath, buffer, { encoding: null });
    } else {
      dialog
        .showSaveDialog({
          title: "请选择位置", //默认路径,默认选择的文件
          properties: ["dontAddToRecent"],
          message: "选择图片保存位置",
          defaultPath: fileName,
        })
        .then((result) => {
          log(result);
          if (!result.canceled) {
            log("选择了文件夹", result.filePath);
            writeFileSync(result.filePath, buffer, { encoding: null });
          }
        })
        .catch((err) => {
          log("无效操作", err);
        });
    }
  });

  // 将文件选择api暴露给渲染进程
  ipcMain.handle("LiteLoader.lite_tools.showOpenDialog", async (_, data) => {
    return await dialog.showOpenDialog(data);
  });

  // 获取rkey
  ipcMain.handle("LiteLoader.lite_tools.getRkey", async (_, chatType) => {
    //const chatTypeStr = chatType === 2 ? "group_rkey" : "private_rkey";
    log(chatType);
    return "false"; // await getRkey(chatTypeStr);
  });
}
initializeIPCCommunication();

export { initMain, mainEvent };
