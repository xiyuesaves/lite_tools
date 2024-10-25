import { BrowserWindow, ipcMain } from "electron";
import { config, onUpdateConfig } from "./config.js";
import { Logs } from "./logs.js";
const log = new Logs("unlockMinSize");

const rawMinSize = new Map();
let unlockMainMinSize;

// 配置文件更新时执行
onUpdateConfig(() => {
  if (config.unlockMainMinSize !== unlockMainMinSize) {
    unlockMainMinSize = config.unlockMainMinSize;
    const allWindows = BrowserWindow.getAllWindows();
    log("配置更新", allWindows.length);
    allWindows.forEach((window) => windowUnlockMinSize(window));
  }
});

ipcMain.on("LiteLoader.lite_tools.windowOnload", (event) => {
  if (config.unlockMainMinSize) {
    const window = BrowserWindow.fromId(event.sender.id);
    windowUnlockMinSize(window);
  }
});

function windowUnlockMinSize(window) {
  if (!window.isDestroyed()) {
    if (config.unlockMainMinSize) {
      const minSize = window.getMinimumSize();
      rawMinSize.set(window.id, minSize);
      window.setMinimumSize(0, 0);
    } else {
      const minSize = rawMinSize.get(window.id);
      if (minSize?.length) {
        const size = window.getSize();
        // 如果窗口尺寸小于最小尺寸，调整窗口尺寸
        if (size[0] < minSize[0] || size[1] < minSize[1]) {
          const restSize = [size[0] > minSize[0] ? size[0] : minSize[0], size[1] > minSize[1] ? size[1] : minSize[1]];
          window.setSize(...restSize);
        }
        window.setMinimumSize(...minSize);
      }
    }
  }
}