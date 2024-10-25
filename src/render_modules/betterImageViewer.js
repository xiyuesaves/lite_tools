import { options } from "./options.js";
import { Logs } from "./logs.js";
const log = new Logs("快速关闭图片");
/**
 * 媒体预览增强
 */
function betterImageViewer() {
  // 判断图片是否超过窗口大小
  let overflow = false;
  let mainImageWrap = null;
  let outerEl = null;
  let newX = 0;
  let newY = 0;
  let width = 0;
  let height = 0;
  let lastCall = 0;
  const throttle = 0;
  log("模块加载");
  // 修复弹窗字体模糊
  document.body.classList.add("image-viewer");
  let offset = 3;
  document.addEventListener(
    "pointerdown",
    (event) => {
      if (event.buttons === 1) {
        offset = 0;
        newX = window.screenX;
        newY = window.screenY;
        width = window.outerWidth;
        height = window.outerHeight;
      } else {
        offset = 3;
      }
    },
    true,
  );
  document.addEventListener(
    "pointermove",
    (event) => {
      if (event.buttons === 1) {
        offset += Math.abs(event.movementX) + Math.abs(event.movementY);
        if (options.imageViewer.touchMove && !overflow && !document.querySelector("embed") && !document.querySelector("canvas")) {
          const now = new Date();
          if (now - lastCall > throttle) {
            lastCall = now;
            newX += event.movementX;
            newY += event.movementY;
            window.moveTo(newX, newY);
            if (window.devicePixelRatio !== 1) {
              window.resizeTo(width, height);
            }
          } else {
            newX += event.movementX;
            newY += event.movementY;
          }
          event.preventDefault();
          event.stopPropagation();
        }
      }
    },
    true,
  );
  document.addEventListener(
    "pointerup",
    (event) => {
      const rightMenu = document.querySelector(".q-context-menu");
      const video = document.querySelector("embed");
      if (event.button !== 0) {
        return
      }
      if (options.imageViewer.quickClose && offset < 2 && !rightMenu && !video) {
        if (event.target.closest(".main-area__content")) {
          document.querySelector(`div[aria-label="关闭"]`).click();
        }
      } else if (offset > 2 && options.imageViewer.touchMove) {
        window.moveTo(newX, newY);
        if (window.devicePixelRatio !== 1) {
          window.resizeTo(width, height);
        }
      }
    },
    true,
  );
  function addEventImageContainer() {
    outerEl = document.querySelector(".main-area__image-rotate-wrap");
    mainImageWrap = document.querySelector(".main-area__image-wrap");
    if (mainImageWrap && outerEl) {
      mainImageWrap.addEventListener("transitionend", () => {
        if (mainImageWrap) {
          const rect = mainImageWrap.getBoundingClientRect();
          overflow = rect.width > outerEl.offsetWidth || rect.height > outerEl.offsetHeight;
        }
      });
    } else {
      setTimeout(addEventImageContainer, 10);
    }
  }
  addEventImageContainer();
}

export { betterImageViewer };
