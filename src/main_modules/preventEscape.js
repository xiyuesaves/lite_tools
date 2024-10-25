import { config } from "./config.js";

/**
 * 防止在按下 Esc 键时关闭窗口。
 *
 * @param {BrowserWindow} window - 需要防止关闭的窗口。
 * @return {void} 此函数不返回任何内容。
 */
export function preventEscape(window) {
  window.webContents.on("before-input-event", async (event, input) => {
    // 阻止按下 ESC 键时关闭窗口
    if (input.key == "Escape" && config.preventEscape && window.isFocused()) {
      event.preventDefault();
    }
  });
}
