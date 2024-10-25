import { BrowserWindow } from "electron";
/**
 * 向所有未销毁页面发送广播
 * @param {String} channel 事件名称
 * @param  {...any} data 发送数据
 */
function globalBroadcast(channel, ...data) {
  const allWindows = BrowserWindow.getAllWindows();
  allWindows.forEach((window) => {
    if (!window.isDestroyed()) {
      window.webContents.send(channel, ...data);
    }
  });
}
export { globalBroadcast };
