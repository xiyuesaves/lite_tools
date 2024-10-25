import { config } from "./config.js";
import { Logs } from "./logs.js";
import { checkChatType } from "./checkChatType.js";

const log = new Logs("消息后缀");

/**
 * 根据特定条件添加消息尾部的函数。
 *
 * @param {Array} args - 传递给函数的参数。
 */
function addMsgTail(args) {
  // 消息发送事件
  if (config?.tail?.enabled) {
    if (args[3]?.[1]?.[0] === "nodeIKernelMsgService/sendMsg") {
      log("消息发送事件", args);
      if (checkChatType(args[3][1][1].peer)) {
        if (args[3][1][1] && args[3][1][1].msgElements) {
          const peerUid = args[3][1][1]?.peer?.peerUid;
          const tail = config.tail.list.find((tail) => {
            if (tail.filter.length === 1 && tail.filter[0] === "") {
              return true;
            }
            if (tail.filter.includes(peerUid)) {
              return true;
            }
          });
          // 必须含有peerUid且匹配到后缀数据
          if (peerUid && tail && !tail.disabled) {
            const tailContext = tail.content;
            const newLine = tail.newLine;
            args[3][1][1].msgElements.forEach((el) => {
              if (el.textElement && el.textElement?.content?.length !== 0) {
                if (newLine) {
                  el.textElement.content += "\n";
                }
                el.textElement.content += tailContext;
                log("消息增加后缀", el.textElement.content);
              }
            });
          }
        }
      } else {
        log("消息发送事件-拒绝处理");
      }
    }
  }
}
export { addMsgTail };
