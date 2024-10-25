// 消息后缀模块
import { Logs } from "./logs.js";
import { messageTailTips } from "./HTMLtemplate.js";
import { options, updateOptions } from "./options.js";
import { debounce } from "./debounce.js";
import { getPeer, addEventPeerChange } from "./curAioData.js";
const log = new Logs("消息后缀");
log("模块加载");
let peer = null;
let tail, tailIndex;

const debounceSetOptions = debounce(() => {
  lite_tools.setOptions(options);
}, 10);

addEventPeerChange((newPeer) => {
  peer = newPeer;
  // log("peer更新", peer);
  messageTail();
});

updateOptions(() => {
  // log("配置文件更新", options.tail);
  messageTail();
});

/**
 * 消息后缀模块
 */
function messageTail() {
  const container = document.querySelector(".chat-input-area .operation");
  if (!container) {
    setTimeout(messageTail, 100);
    log("等待加载完成");
    return;
  }
  peer = getPeer();
  // log("加载完成", peer);
  let tailTipsEl = document.querySelector(".lite-tools-tail-tips");
  if (container && peer?.peerUid && options.tail.tips) {
    tailIndex = options.tail.list.findIndex((tail) => {
      if (tail.filter.length === 1 && tail.filter[0] === "") {
        return true;
      }
      if (tail.filter.includes(peer?.peerUid)) {
        return true;
      }
    });
    tail = options.tail.list[tailIndex];
    log("初始化", tail, tailIndex);
    if (tail && options.tail.enabled && tail.content) {
      if (!tailTipsEl) {
        log("插入html");
        container.insertAdjacentHTML(
          "afterbegin",
          messageTailTips
            .replace("%s%", `${tail.content}`)
            .replace(
              "%title%",
              tail.disabled ? "当前已禁用后缀，点击启用" : `发送将附带 ${tail.newLine ? "换行" : ""} ${tail.content} 后缀，点击禁用`,
            ),
        );
        tailTipsEl = document.querySelector(".lite-tools-tail-tips");
        tailTipsEl.addEventListener("click", updateTail);
      }
      tailTipsEl.classList.toggle("disabled-tail", tail.disabled);
      tailTipsEl.innerText = tail.content;
      tailTipsEl.title = tail.disabled
        ? "当前已禁用后缀，点击启用"
        : `发送将附带 ${tail.newLine ? "换行" : ""} ${tail.content} 后缀，点击禁用`;
    } else {
      document.querySelector(".lite-tools-tail-tips")?.remove();
    }
  } else {
    document.querySelector(".lite-tools-tail-tips")?.remove();
  }
}
messageTail();
function updateTail() {
  if (tail && options.tail.enabled && tailIndex >= 0) {
    tail.disabled = !tail.disabled;
    options.tail.list[tailIndex] = tail;
    debounceSetOptions();
  }
}
