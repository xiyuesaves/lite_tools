import { config, onUpdateConfig } from "./config.js";
import { Logs } from "./logs.js";
import { mainMessage } from "./captureWindow.js";
const log = new Logs("proxyOn");

// 最小不隐藏聊天区域宽度
const MIN_SAFE_WIDTH = 860;

let unlockMainMinSize = config?.message?.unlockMainMinSize;
let resizeFunc;

onUpdateConfig(() => {
  // 选项切换时根据情况调整窗口宽度
  if (unlockMainMinSize !== undefined && mainMessage && resizeFunc) {
    if (unlockMainMinSize !== config?.message?.unlockMainMinSize) {
      const size = mainMessage.getSize();
      if (size[0] < MIN_SAFE_WIDTH) {
        size[0] = MIN_SAFE_WIDTH;
        mainMessage.setSize(size[0], size[1]);
        resizeFunc();
      }
    }
  }
  unlockMainMinSize = config?.message?.unlockMainMinSize;
});

/**
 * 代理window on对象
 * @param {BrowserWindow} window
 */
function proxyOn(window) {
  try {
    log("代理on方法", window.id);
    const rawOn = window.on;
    const proxtOn = new Proxy(rawOn, {
      apply(target, thisArg, args) {
        try {
          if (args[0] === "resized") {
            resizeFunc = args[1];
            args[1] = () => {
              // 仅在主窗口启用
              if (mainMessage !== window || !config.message.unlockMainMinSize) {
                resizeFunc();
              }
            };
          }
          return target.apply(thisArg, args);
        } catch (err) {
          log("函数调用出现错误", err);
        }
      },
    });
    window.on = proxtOn;
  } catch (err) {
    log("代理on方法出现错误", err);
  }
}

export { proxyOn };
