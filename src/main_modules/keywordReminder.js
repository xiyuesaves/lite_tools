import { findEventIndex } from "./findEventIndex.js";
import { checkChatType } from "./checkChatType.js";
import { mainMessage } from "./captureWindow.js";
import { config } from "./config.js";

/**
 * 关键字提醒功能模块
 *
 * @param {Array} args - 包含事件数据的参数数组。
 * @return {void} 此函数不返回任何值。
 */
function keywordReminder(args) {
  if (config.keywordReminder.enabled) {
    const onRecvMsg = findEventIndex(args, `nodeIKernelMsgListener/onRecvMsg`);
    const onRecvActiveMsg = findEventIndex(args, `nodeIKernelMsgListener/onRecvActiveMsg`);
    const events = onRecvMsg !== -1 ? onRecvMsg : onRecvActiveMsg;
    if (checkChatType(args?.[2]?.[events]?.payload?.msgList?.[0])) {
      args[2][events].payload.msgList.forEach((msgData) => {
        msgData.elements.forEach((msgElements) => {
          if (msgElements?.textElement) {
            if (config.keywordReminder.keyList.some((key) => msgElements?.textElement?.content?.includes(key))) {
              mainMessage.webContents.send("LiteLoader.lite_tools.onKeywordReminder", msgData.peerUid, msgData.msgId);
            }
          }
        });
      });
    }
  }
}

export { keywordReminder };
