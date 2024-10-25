import { options } from "./options.js";
import { switchButtons } from "./eggs.js";
import { getValueByPath, setValueByPath } from "./ObjectPathUtils.js";

/**
 * 初始化设置界面监听方法
 * @param {Element} viewEl 插件设置界面容器
 * @returns
 */
function SwitchEventlistener(viewEl) {
  const view = viewEl;

  /**
   *
   * @param {String} optionKey 设置对象key路径
   * @param {String|Element} switchClass 设置界面class选择器或元素
   * @param {Function} callback 回调函数 Event,Boolend
   */
  function addSwitchEventlistener(optionKey, element, callback) {
    const option = getValueByPath(options, optionKey);
    let target;
    if (typeof element === "string") {
      target = view.querySelector(element);
    } else {
      target = element;
    }
    target.classList.toggle("is-active", option);
    // 初始化时执行一次callback方法
    if (callback) {
      callback(null, option);
    }
    target.addEventListener("click", function (event) {
      const newValue = this.classList.toggle("is-active");
      setValueByPath(options, optionKey, newValue);
      lite_tools.setOptions(options);
      if (callback) {
        callback(event, newValue);
      }
      switchButtons();
    });
  }
  return addSwitchEventlistener;
}

export { SwitchEventlistener };
