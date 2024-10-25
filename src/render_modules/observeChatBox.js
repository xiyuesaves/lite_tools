import { options } from "./options.js";
import { Logs } from "./logs.js";
const log = new Logs("阻止回复自带At");

let ckeditorInstance;
/**
 * 通用监听输入框编辑事件
 */
function observeChatBox() {
  // 获取到编辑器实例后阻止继续调用
  if (ckeditorInstance) {
    return;
  }
  ckeditorInstance = document.querySelector(".ck.ck-content.ck-editor__editable")?.ckeditorInstance;
  let isReply = false;

  const originalApplyOperation = ckeditorInstance?.model?.applyOperation;
  if (!originalApplyOperation) {
    return;
  }
  const patchedApplyOperation = function (...args) {
    // 在检测到插入回复节点后，在10ms内阻止插入At节点和空格消息
    if (options.message.removeReplyAt) {
      if (args[0]?.nodes?._nodes[0]?.name === "msg-reply" && !isReply) {
        isReply = true;
        setTimeout(() => {
          isReply = false;
          // 功能参考自 LLAPI
          const model = ckeditorInstance.model;
          model.change((writer) => {
            const rootNodes = model.document.getRoot();
            const node = rootNodes.getChild(1) ?? rootNodes.getChild(0);
            if (node && node.is("element", "paragraph") && node?._children?._nodes?.[0]?._data === " ") {
              const position = model.document.selection.getFirstPosition();
              const range = writer.createRange(position.getShiftedBy(-1), position);
              writer.remove(range);
            }
          });
        });
      }
      if (args[0]?.nodes?._nodes[0]?.name === "msg-at" && isReply) {
        args[0].nodes._nodes = [];
        isReply = false;
      }
    }
    return originalApplyOperation?.call(ckeditorInstance.model, ...args);
  };
  ckeditorInstance.model.applyOperation = patchedApplyOperation;
  log("模块已加载");
}

export { observeChatBox };
