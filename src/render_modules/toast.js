import { toastContentEl, toastEl, defaultIcon, successIcon, errorIcon } from "./HTMLtemplate.js";

const toastContent = createToastContentEl(toastContentEl);

const domparser = new DOMParser();

function createToastContentEl(HTMLtemplate) {
  document.body.insertAdjacentHTML("beforeend", HTMLtemplate);
  return document.querySelector(".lite-tools-toast");
}
/**
 * 显示提示内容
 * @param {String} content 提示内容
 * @param {String} type 提示类型
 * @param {Number} duration 延迟时间
 * @returns {Element} 提示元素
 */
function showToast(content, type, duration) {
  const toast = createToastEl(content, type);
  toastContent.appendChild(toast);
  toast.offsetHeight;
  toast.classList.add("lite-tools-toast-show");
  toast.close = function () {
    clearTimeout(this.timeout);
    toast.addEventListener(
      "transitionend",
      () => {
        this.remove();
      },
      { once: true },
    );
    this.classList.remove("lite-tools-toast-show");
  };
  const timeout = setTimeout(() => {
    toast.close();
  }, duration);
  toast.timeout = timeout;
  return toast;
}

/**
 * 创建提示元素
 * @param {String} content 提示内容
 * @param {String} type 提示类型
 * @returns {Element} 提示元素
 */
function createToastEl(content, type) {
  const newToastEl = toastEl.replace("{{content}}", content).replace("{{icon}}", getIcon(type));
  return domparser.parseFromString(newToastEl, "text/html").querySelector(".lite-tools-toast-item");
}

/**
 * 获取指定类型的图标html字符串
 * @param {String} type 提示类型
 * @returns {String} 图标html字符串
 */
function getIcon(type) {
  switch (type) {
    case "success":
      return successIcon;
    case "error":
      return errorIcon;
    case "none":
      return "";
    case "default":
    default:
      return defaultIcon;
  }
}

/**
 * 清除所有提示
 */
function clearToast() {
  document.querySelectorAll(".lite-tools-toast-item").forEach((toast) => {
    clearTimeout(toast.timeout);
    toast.addEventListener("transitionend", () => {}, { once: true });
    toast.classList.remove("lite-tools-toast-show");
  });
}

lite_tools.onToast((_, toast) => {
  showToast(toast.content, toast.type, toast.duration);
});

lite_tools.clearToast(clearToast);

export { showToast, clearToast };
