import { first } from "./first.js";
import { options, updateOptions } from "./options.js";
import { Logs } from "./logs.js";
const log = new Logs("窗口顶部功能列表");

let observe;
/**
 * 监听聊天框上方功能
 */
function observeChatTopFunc() {
  if (!observe) {
    observe = new MutationObserver(() => {
      document.querySelectorAll(".panel-header__action .func-bar .bar-icon").forEach((el) => {
        const id = el.querySelector(".icon-item").id;
        const find = options.chatAreaFuncList.find((el) => el.id === id);
        if (find) {
          el.classList.toggle("LT-disabled", find.disabled);
        }
      });
      // 更新聊天框上方功能列表
      const textAreaList = Array.from(document.querySelectorAll(".panel-header__action .func-bar .bar-icon"))
        .map((el) => {
          return {
            name: el.querySelector(".icon-item").getAttribute("aria-label") || "更多",
            id: el.querySelector(".icon-item").id,
            disabled: el.classList.contains(".disabled"),
          };
        })
        .filter((el) => !options.chatAreaFuncList.find((_el) => _el.id === el.id));
      if (textAreaList.length) {
        log("发送聊天框上方功能列表");
        lite_tools.sendChatTopList(textAreaList);
      }
    });
  }

  if (document.querySelector(".panel-header__action .func-bar")) {
    disabledFunctions();
    if (first("observePanelHeaderFunctions")) {
      log("已捕获指定元素");
      updateOptions(disabledFunctions);
      observe.observe(document.querySelector(".panel-header__action .func-bar"), {
        attributeFilter: ["style"],
        attributes: true,
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
  document.querySelectorAll(".panel-header__action .func-bar .bar-icon").forEach((el) => {
    const id = el.querySelector(".icon-item").id;
    const find = options.chatAreaFuncList.find((el) => el.id === id);
    if (find) {
      el.classList.toggle("LT-disabled", find.disabled);
    }
  });
}

export { observeChatTopFunc };
