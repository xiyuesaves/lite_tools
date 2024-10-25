import { options } from "./options.js";
import { switchButtons } from "./eggs.js";
import { setValueByPath } from "./ObjectPathUtils.js";

/**
 * 向设置界面插入动态选项
 * @param {Ayyay} list 选项列表
 * @param {Element} element 指定插入元素
 * @param {String} objKey 对象路径
 * @param {String} key 控制键值
 */
function addOptionLi(list, element, objKey, key) {
  list.forEach((el, index) => {
    const hr = document.createElement("hr");
    hr.classList.add("horizontal-dividing-line");
    const li = document.createElement("li");
    li.classList.add("vertical-list-item");
    const switchEl = document.createElement("div");
    switchEl.classList.add("q-switch");
    if (!el[key]) {
      switchEl.classList.add("is-active");
    }
    switchEl.setAttribute("index", index);
    switchEl.addEventListener("click", function () {
      setValueByPath(options, `${objKey}[${index}].${key}`, this.classList.contains("is-active"));
      this.classList.toggle("is-active");
      lite_tools.setOptions(options);
      switchButtons();
    });
    const span = document.createElement("span");
    span.classList.add("q-switch__handle");
    switchEl.appendChild(span);
    const title = document.createElement("h2");
    title.innerText = el.name;
    li.append(title, switchEl);
    element.append(hr, li);
  });
}

export { addOptionLi };
