import { reminderEl } from "./HTMLtemplate.js";
import { options } from "./options.js";
import { getPeer } from "./curAioData.js";
import { Logs } from "./logs.js";
const log = new Logs("提醒词模块");

lite_tools.onKeywordReminder((_, peerUid, msgId) => {
  if (!window.keywordReminder) {
    window.keywordReminder = new Map();
  }
  const peer = getPeer();
  log("获取 peer ", peer);
  const curUid = peer?.peerUid;
  if (peerUid === curUid) {
    log("是当前群聊，跳过记录");
    return;
  }
  let value = window.keywordReminder.get(peerUid);
  if (!value) {
    value = [];
  }
  value.push(msgId);
  log("新增 关键词提醒", peerUid, msgId, value);
  window.keywordReminder.set(peerUid, value);
  injectReminder(curUid);
});

function injectReminder(uid) {
  if (!uid) {
    return;
  }
  if (!options.keywordReminder.enabled) {
    document.querySelector(".lite-tools-keywordReminder")?.remove();
    return;
  }
  if (!window.keywordReminder) {
    window.keywordReminder = new Map();
  }
  const value = window.keywordReminder.get(uid);
  log("获取当前页面的关键词提醒", uid, value);
  if (value?.length) {
    document.querySelector(".lite-tools-keywordReminder")?.remove();
    const HTMLtemplate = reminderEl.replace("{{nums}}", value.length);
    document.querySelector(".chat-msg-area__tip--top").insertAdjacentHTML("beforeend", HTMLtemplate);
    const keywordReminderEl = document.querySelector(".lite-tools-keywordReminder");
    keywordReminderEl.innerText = `${value.length} 条消息有提醒词`;
    keywordReminderEl.addEventListener("click", () => {
      const msgId = value.pop();
      document.querySelector(".ml-area.v-list-area").__VUE__[0].exposed.scrollToItem(msgId);
      window.keywordReminder.set(uid, value);
      if (value.length) {
        keywordReminderEl.innerText = `${value.length} 条消息有提醒词`;
      } else {
        keywordReminderEl.remove();
        hookUpdate();
      }
    });
  } else {
    document.querySelector(".lite-tools-keywordReminder")?.remove();
    hookUpdate();
  }
}
function hookUpdate() {
  if (!options.keywordReminder.enabled) {
    document.querySelector(".lite-tools-keywordReminder")?.remove();
    window.keywordReminder = null;
  }
  document.querySelectorAll(".two-col-layout__aside .viewport-list__inner .list-item").forEach((el) => {
    if (el?.__VUE__?.[1] && !el?.__VUE__?.[1]?.update?.isHooked) {
      const vue = el.__VUE__[1];
      const peerUid = vue.ctx.peerUid;
      const tempUpdate = vue.update;
      if (!window.keywordReminder) {
        window.keywordReminder = new Map();
      }
      vue.update = () => {
        const value = window?.keywordReminder?.get(peerUid);
        if (value?.length) {
          if (vue?.ctx?.abstracts?.[0]?.content !== "关键词提醒") {
            vue.ctx.abstracts.unshift({
              content: "关键词提醒",
              contentStyle: "warning",
              type: "msgBox",
            });
          }
        } else {
          if (vue?.ctx?.abstracts?.[0]?.content === "关键词提醒") {
            vue.ctx.abstracts.shift();
          }
        }
        tempUpdate();
      };
      vue.update.isHooked = true;
    } else {
      el?.__VUE__?.[1]?.update();
    }
  });
}

export { injectReminder, hookUpdate };
