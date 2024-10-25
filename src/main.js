import { loadUserConfig } from "./main_modules/config.js";
import { initMain, mainEvent } from "./main_modules/initMain.js";

const log = console.log; //new Logs("main");
const err = console.log; //new Logs("Error");

/**
 * 是否已加载配置文件
 * @type {boolean}
 */
let isConfigLoaded = false;

/**
 * 处理当浏览器窗口被创建的事件。
 *
 * @param {BrowserWindow} window - 浏览器窗口对象。
 */
function onBrowserWindowCreated(window) {
  try {
    proxyIpcMessage(window);
    proxySend(window);
  } catch (err) {
    log("onBrowserWindowCreated 出现错误", err.message, err.stack);
  }
}

/**
 * 将给定 Electron 浏览器窗口的 IPC 消息事件代理到添加自定义行为。
 *
 * @param {Electron.BrowserWindow} window - 代理其 IPC 消息事件的浏览器窗口。
 */
function proxyIpcMessage(window) {
  const ipcEvents = window.webContents._events["-ipc-message"];
  const ipcEventsIsArray = Array.isArray(ipcEvents);
  const ipcMessageProxy = ipcEventsIsArray ? ipcEvents[0] : ipcEvents;

  if (!ipcMessageProxy) return;

  const proxyIpcMsg = new Proxy(ipcMessageProxy, {
    apply(target, thisArg, args) {
      try {
        // ...do something
      } catch (err) {
        log("proxyIpcMessage 出现错误", err.message, err.stack);
      }
      return target.apply(thisArg, args);
    },
  });

  if (ipcEventsIsArray) {
    ipcEvents[0] = proxyIpcMsg;
  } else {
    window.webContents._events["-ipc-message"] = proxyIpcMsg;
  }
}

/**
 * 复写并监听给定 Electron 浏览器窗口中的 IPC 通信内容。
 *
 * @param {Electron.BrowserWindow} window - 要代理 IPC 消息事件的浏览器窗口。
 * @return {void} 此函数不返回任何内容。
 */
function proxySend(window) {
  const originalSend = window.webContents.send;

  window.webContents.send = (...args) => {
    try {
      if (
        !isConfigLoaded &&
        args?.[2]?.[0]?.cmdName === "nodeIKernelSessionListener/onSessionInitComplete" &&
        args?.[2]?.[0]?.payload?.uid
      ) {
        loadUserConfig(args[2][0].payload.uid);
        initMain();
        isConfigLoaded = true;
        log("成功读取配置文件");
      }

      // 如果配置已经加载，或处理其他情况
      if (isConfigLoaded) {
        mainEvent.emit("ipc-send", ...args);
        // ...do something
      }
    } catch (err) {
      log("proxySend 出现错误", err.message, err.stack);
    }

    // 始终调用原始的 send 方法
    originalSend.call(window.webContents, ...args);
  };
}

/**
 * 错误捕获
 */
process.on("uncaughtException", (e) => {
  err("主进程出错", e, e?.stack);
});

module.exports = { onBrowserWindowCreated };
