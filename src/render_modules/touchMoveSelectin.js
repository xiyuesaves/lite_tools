import { options } from "./options.js";
import { Logs } from "./logs.js";
const log = new Logs("阻止滑动选择");
/**
 * 是否已捕获目标
 */
let listenTarget = false;

/**
 * 是否拦截事件
 */
let interception = false;

/**
 * 阻止拖拽多选消息
 * @param {String} className 禁止拖拽类名
 */
function touchMoveSelectin(className) {
  log("模块已加载", options.message.disabledSlideMultipleSelection);
  document.querySelector("#app").addEventListener("pointerdown", (event) => {
    if (options.message.disabledSlideMultipleSelection && (event.buttons === 1 || event.buttons === 4)) {
      interception = !!(
        !event.target.closest(".message-content__wrapper") &&
        event.target.closest(`.${className}`) &&
        !event.target.closest(".v-scrollbar-track")
      );
    } else {
      interception = false;
    }
    log("更新状态", interception);
  });
  document.querySelector("#app").addEventListener("pointerup", (event) => {
    if (options.message.disabledSlideMultipleSelection) {
      if (event.buttons === 0) {
        interception = false;
      }
      log("更新状态", interception);
    }
  });

  document.querySelector("#app").addEventListener("mousemove", (event) => {
    // 判断是否已捕获目标
    if (!listenTarget && document.querySelector(`.${className}`)) {
      log("已捕获目标元素");
      document.querySelector(`.${className}`).addEventListener("pointerdown", (event) => {
        if (options.message.disabledSlideMultipleSelection && (event.buttons === 1 || event.buttons === 4)) {
          document.querySelector(".q-context-menu")?.remove();
        }
      });
      listenTarget = true;
    }
    if (options.message.disabledSlideMultipleSelection && (event.buttons === 1 || event.buttons === 4)) {
      if (interception) {
        event.preventDefault();
        event.stopPropagation();
      }
    }
  });
}

export { touchMoveSelectin };
