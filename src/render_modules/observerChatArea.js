import { first } from "./first.js";
import { options, updateOptions } from "./options.js";
import { Logs } from "./logs.js";
const log = new Logs("聊天窗口功能列表");

let observe;
/**
 * 监听输入框上方功能
 */
async function observerChatArea() {
  if (!observe) {
    observe = new MutationObserver(() => {
      // 禁用指定功能
      document.querySelectorAll(".chat-func-bar .bar-icon").forEach((el) => {
        const id = el.querySelector(".icon-item").id;
        const find = options.textAreaFuncList.find((el) => el.id === id);
        if (find) {
          el.classList.toggle("LT-disabled", find.disabled);
        }
      });
      const textAreaList = Array.from(document.querySelectorAll(".chat-func-bar .bar-icon"))
        .map((el) => {
          return {
            name: el.querySelector(".icon-item").getAttribute("aria-label"),
            id: el.querySelector(".icon-item").id,
            disabled: el.classList.contains(".disabled"),
          };
        })
        .filter((el) => !options.textAreaFuncList.find((_el) => _el.id === el.id));
      if (textAreaList.length) {
        log("发送聊天窗口功能列表");
        lite_tools.sendTextAreaList(textAreaList);
      }
    });
  }
  if (document.querySelector(".chat-input-area .chat-func-bar")) {
    disabledFunctions();
    if (first("chatInputAreaFuncBar")) {
      log("已捕获指定元素");
      updateOptions(disabledFunctions);
      observe.observe(document.querySelector(".chat-input-area .chat-func-bar"), {
        attributes: false,
        childList: true,
        subtree: true,
      });
    }
  }
}

/**
 * 禁用指定功能
 */
function disabledFunctions() {
  document.querySelectorAll(".chat-func-bar .bar-icon").forEach((el) => {
    const id = el.querySelector(".icon-item").id;
    const find = options.textAreaFuncList.find((el) => el.id === id);
    if (find) {
      el.classList.toggle("LT-disabled", find.disabled);
    }
  });
}

export { observerChatArea };
