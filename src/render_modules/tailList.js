import { tailElement } from "./HTMLtemplate.js";
import { deleteIcon, foldIcon } from "./svg.js";
import { options } from "./options.js";
import { debounce } from "./debounce.js";
// 配置界面日志
import { Logs } from "./logs.js";
const log = new Logs("后缀实例");

class TailList {
  constructor(view, tailList) {
    log("开始初始化");
    this.list = tailList;
    this.ElementList = []; // 元素列表
    this.viewEl = view;
    this.parser = new DOMParser();
    this.init();
  }
  updateOptions() {
    options.tail.list.forEach((tail) => {
      this.list.find((el) => el.id === tail.id).disabled = tail.disabled;
      this.ElementList.find((el) => el.getAttribute("data-id") === tail.id)
        .querySelector(".msg-tail-disabled")
        .classList.toggle("is-active", tail.disabled);
    });
  }
  createNewTail() {
    this.list.unshift({
      id: crypto.randomUUID(),
      newLine: false,
      disabled: false,
      filter: [""],
      content: "",
    });
    const tailEl = this.newTail(this.list[0]);
    this.ElementList.unshift(tailEl);
    this.updateDom();
    this.updateOption();
  }
  init() {
    log("创建元素", this.list);
    for (let i = 0; i < this.list.length; i++) {
      const tail = this.list[i];
      const tailEl = this.newTail(tail);
      this.ElementList.push(tailEl);
    }
    this.updateDom();
  }
  updateDom() {
    log("更新页面元素", this.ElementList);
    this.ElementList.forEach((el) => {
      this.viewEl.appendChild(el);
    });
  }
  newTail(tail) {
    const tailEl = this.parser.parseFromString(tailElement, "text/html").querySelector(".ruls-item");
    tailEl.setAttribute("data-id", tail.id);
    const deleteEl = tailEl.querySelector(".delete");
    const toUpEl = tailEl.querySelector(".to-up");
    const toDownEl = tailEl.querySelector(".to-down");
    const tailContext = tailEl.querySelector(".tail-context");
    const ruleGroupList = tailEl.querySelector(".rule-group-list");
    const msgTailNewline = tailEl.querySelector(".msg-tail-newline");
    const msgTailDisabled = tailEl.querySelector(".msg-tail-disabled");

    deleteEl.innerHTML = deleteIcon;
    toUpEl.innerHTML = foldIcon;
    toDownEl.innerHTML = foldIcon;
    deleteEl.addEventListener("click", () => this.deleteThis(tail.id));
    toUpEl.addEventListener("click", () => this.rearrangeItem(tail.id, -1));
    toDownEl.addEventListener("click", () => this.rearrangeItem(tail.id, 1));

    tailContext.value = tail.content;
    ruleGroupList.value = tail.filter.join(",");
    msgTailNewline.classList.toggle("is-active", tail.newLine);
    msgTailDisabled.classList.toggle("is-active", tail.disabled);

    // 监听换行开关
    msgTailNewline.addEventListener("click", () => {
      tail.newLine = !tail.newLine;
      msgTailNewline.classList.toggle("is-active", tail.newLine);
      this.updateOption();
    });
    // 监听临时禁用开关
    msgTailDisabled.addEventListener("click", () => {
      tail.disabled = !tail.disabled;
      msgTailDisabled.classList.toggle("is-active", tail.disabled);
      this.updateOption();
    });
    // 监听后缀内容修改
    const debounceTailContextInput = debounce(() => {
      tail.content = tailContext.value;
      this.updateOption();
    }, 100);
    tailContext.addEventListener("input", debounceTailContextInput);
    // 监听过滤群组修改
    const debounceRuleGroupListInput = debounce(() => {
      tail.filter = ruleGroupList.value.split(",");
      this.updateOption();
    }, 100);
    ruleGroupList.addEventListener("input", debounceRuleGroupListInput);
    log("返回元素", tailEl);
    return tailEl;
  }
  deleteThis(id) {
    log("删除此数据", id);
    const deleteIndex = this.list.findIndex((tail) => tail.id === id);
    if (deleteIndex !== -1) {
      this.list.splice(deleteIndex, 1);
      const deleteEl = this.ElementList.splice(deleteIndex, 1);
      deleteEl[0].remove();
    }
    this.updateOption();
  }
  rearrangeItem(id, offset) {
    const moveIndex = this.list.findIndex((tail) => tail.id === id);
    const targetIndex = moveIndex + offset;
    log(moveIndex, targetIndex);
    if (targetIndex >= 0) {
      [this.list[moveIndex], this.list[targetIndex]] = [this.list[targetIndex], this.list[moveIndex]];
      [this.ElementList[moveIndex], this.ElementList[targetIndex]] = [this.ElementList[targetIndex], this.ElementList[moveIndex]];
      this.updateDom();
      this.updateOption();
    }
  }
  updateOption() {
    log("更新options");
    options.tail.list = this.list;
    lite_tools.setOptions(options);
  }
}

export { TailList };
