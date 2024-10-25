import { findEventIndex } from "./findEventIndex.js";
import { config } from "./config.js";
import { checkChatType } from "./checkChatType.js";
import { replaceArk } from "./replaceArk.js";
import { Logs } from "./logs.js";
const log = new Logs("替换小程序卡片");

/**
 * 根据配置替换给定参数中的小程序卡片。
 *
 * @param {Array} args - 包含小程序卡片的参数数组。
 * @return {void} 此函数不返回任何值。
 */
function replaceMiniAppArk(args) {
  if (config.message.convertMiniPrgmArk) {
    // 接收到获取历史消息列表
    const msgList = args[2]?.msgList;
    if (msgList && msgList.length && checkChatType(msgList[0])) {
      // log("历史消息事件");
      replaceMsgList(msgList);
    }
    // 接收到的新消息
    const onRecvMsg = findEventIndex(args, [
      "nodeIKernelMsgListener/onRecvMsg",
      "nodeIKernelMsgListener/onRecvActiveMsg",
      "nodeIKernelMsgListener/onActiveMsgInfoUpdate",
    ]);
    if (onRecvMsg >= 0 && checkChatType(args?.[2]?.[onRecvMsg]?.payload?.msgList?.[0])) {
      // log("新消息事件");
      replaceMsgList(args[2][onRecvMsg].payload.msgList);
    }

    // 转发消息
    const onForwardMsg = findEventIndex(args, "nodeIKernelMsgListener/onAddSendMsg");
    if (onForwardMsg >= 0 && checkChatType(args?.[2]?.[onForwardMsg]?.payload?.msgRecord)) {
      // log("转发消息事件");
      replaceMsgList([args[2][onForwardMsg].payload.msgRecord]);
    }
  }
}

/**
 * 将给定消息列表中的小程序卡片替换为 replaceArk 函数的结果。
 *
 * @param {Array} msgList - 包含小程序卡片的消息对象数组。
 * @return {void} 此函数不返回任何内容。
 */
function replaceMsgList(msgList) {
  msgList.forEach((msgItem) => {
    let msg_seq = msgItem.msgSeq;
    // 遍历消息内容数组
    msgItem.elements.forEach((msgElements) => {
      // 替换历史消息中的小程序卡片
      if (msgElements?.arkElement?.bytesData) {
        const json = JSON.parse(msgElements.arkElement.bytesData);
        if (json?.prompt?.includes("[QQ小程序]")) {
          msgElements.arkElement.bytesData = replaceArk(json, msg_seq);
          log("成功替换卡片", json);
        }
      }
    });
  });
}

export { replaceMiniAppArk };
