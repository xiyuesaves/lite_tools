import { recallGroupItem, recallTail, recallImgItem, recallMsgItem } from "../render_modules/HTMLtemplate.js";

document.querySelector(".logs").innerText += "脚本正在工作\n";
const groupList = new Map();
const parser = new DOMParser();
let concatMap = new Map();

const filterListEl = document.querySelector(".qq-number-filter");

async function initPage(map) {
  document.querySelector(".logs").innerText += `获取到消息map 共有${map.size}\n`;
  document.querySelector(".logs").innerText += `开始整理数据\n`;

  if (!map.size) {
    const tipsEl = parser.parseFromString(recallGroupItem, "text/html").querySelector(".filter-item");
    tipsEl.querySelector(".chat-type").innerText = `没有撤回数据`;
    filterListEl.appendChild(tipsEl);
  }

  map.forEach((msgData) => {
    const peerUid = msgData.peerUid;
    const find = groupList.get(peerUid);
    if (find) {
      find.push(msgData);
    } else {
      groupList.set(peerUid, [msgData]);
    }
  });

  groupList.forEach((msgArr) => msgArr.sort((a, b) => a.msgTime - b.msgTime));

  document.querySelector(".logs").innerText += `整理结束，共有 ${groupList.size} 个独立群组或私聊，输出到dom\n`;

  try {
    document.querySelector(".loading-tips").remove();
    for (const [key] of groupList) {
      const msgArr = groupList.get(key);
      const chatTypeName = msgArr[0].chatType === 1 ? "私聊" : msgArr[0].chatType === 100 ? "临时" : "群组";
      let peerName = getPeerName(msgArr);
      let peerUid = msgArr[0].peerUid;
      const uuid = peerUid;
      const groupItemEl = parser.parseFromString(recallGroupItem, "text/html").querySelector(".filter-item");
      groupItemEl.peerUid = peerUid;
      document.querySelector(".logs").innerText += `--> ${msgArr[0].chatType}\n`;
      if (msgArr[0].chatType === 1 || msgArr[0].chatType === 100) {
        // document.querySelector(".logs").innerText += `尝试获取 - ${JSON.stringify(msgArr, null, 2)}\n`;
        // document.querySelector(".logs").innerText += `尝试获取 - ${msgArr[0]?.peerUid}\n`;
        let userInfo;
        // 循环10次获取对应用户信息的请求
        for (let i = 0; i < 10; i++) {
          userInfo = await lite_tools.getUserInfo(msgArr[0].peerUid);
          // document.querySelector(".logs").innerText += `获取数据 - ${userInfo[0]?.payload?.info?.uin}\n`;
          // document.querySelector(".logs").innerText += `获取数据 - ${JSON.stringify(userInfo, null, 2)}\n`;
          if (userInfo[0]?.payload?.profiles?.[msgArr[0].peerUid]?.coreInfo) {
            userInfo = userInfo[0].payload.profiles[msgArr[0].peerUid].coreInfo;
            break;
          }
          await new Promise((res) => setTimeout(res, 10));
        }
        peerName = userInfo?.remark || userInfo?.nick || "未知数据";
        peerUid = userInfo?.uin || "N/A";
        document.querySelector(".logs").innerText += JSON.stringify(userInfo, null, 4);
        document.querySelector(".logs").innerText += `peerName - ${peerName}\n`;
      }
      groupItemEl.querySelector(".chat-type").innerText = `[${chatTypeName}]`;
      groupItemEl.querySelector(".peer-name").innerText = peerName;
      groupItemEl.querySelector(".peer-name").title = peerName;
      groupItemEl.querySelector(".peer-uid").innerText = `(${peerUid})`;
      groupItemEl.addEventListener("click", () => {
        document.querySelector(".filter-item.active")?.classList?.remove("active");
        groupItemEl.classList.add("active");
        updateUid(uuid);
      });
      filterListEl.appendChild(groupItemEl);
    }
  } catch (err) {
    document.querySelector(".logs").innerText += `出错${err.message} ${err?.stack}\n`;
  }
}

// 接收撤回数据
lite_tools.onReacllMsgData((_, map, next) => {
  concatMap = new Map([...concatMap, ...map]);
  document.querySelector(".logs").innerText += `获取到数据 ${concatMap.size}, ${next}\n`;
  if (next === 0) {
    document.querySelector(".logs").innerText += `接收结束，开始加载数据\n`;
    initPage(concatMap);
  }
});

// operatorNick - 用户昵称
// operatorRemark - 备注名称
// operatorMemRemark - 群昵称

function updateUid(uid) {
  const msgList = groupList.get(uid);
  document.title = `撤回消息查看 ${document.querySelector(".filter-item.active").innerText} 共计 ${msgList.length} 条数据`;
  const msgListEl = document.querySelector(".msg-list");
  msgListEl.innerHTML = "";
  msgListEl.scrollTop = 0;
  try {
    msgList.forEach((msg) => {
      const recallMsgItemEl = parser.parseFromString(recallMsgItem, "text/html").querySelector(".msg-item");
      const recallTailEl = parser.parseFromString(recallTail, "text/html").querySelector(".tail");
      recallTailEl.innerText = msg?.lite_tools_recall?.recallTime
        ? `${new Date(msg.lite_tools_recall.recallTime * 1000).toLocaleTimeString("zh-CN", {
            year: "2-digit",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          })} 被 ${
            msg.lite_tools_recall.operatorMemRemark || msg.lite_tools_recall.operatorRemark || msg.lite_tools_recall.operatorNick
          } 撤回`
        : "没有撤回信息";
      recallTailEl.setAttribute("time", recallTailEl.innerText);
      const textContent = getTextContent(msg.elements);
      recallMsgItemEl.querySelector(".user-name").innerText =
        msg.lite_tools_recall.origMsgSenderMemRemark || // 群备注
        msg.lite_tools_recall.origMsgSenderRemark || // 用户备注
        msg.lite_tools_recall.origMsgSenderNick; // 账号昵称
      recallMsgItemEl.querySelector(".msg-text").innerText = textContent;
      const picList = getPicList(msg.elements);
      if (picList.length) {
        const imgListEl = recallMsgItemEl.querySelector(".msg-img-list");
        picList.forEach((pic) => {
          const picEl = parser.parseFromString(recallImgItem, "text/html").querySelector(".msg-img-item");
          const imgEl = picEl.querySelector("img");
          imgEl.src = `appimg://${pic}`;
          imgEl.setAttribute("alt", "加载失败");
          imgListEl.appendChild(picEl);
        });
      }
      if (!textContent.length && !picList.length) {
        recallMsgItemEl.querySelector(".msg-text").innerHTML = `<blue>[不支持的消息类型]</blue>`;
      }
      recallMsgItemEl.querySelector(".msg-text").appendChild(recallTailEl);
      recallMsgItemEl.querySelector(".msg-content").addEventListener("click", () => {
        lite_tools.sendToMsg({
          scene: "aio",
          msgId: msg.msgId,
          chatType: msg.chatType,
          peerUid: msg.peerUid,
          type: 1,
        });
      });
      const prevEl = msgListEl.querySelector(".msg-item");
      if (prevEl) {
        msgListEl.insertBefore(recallMsgItemEl, prevEl);
      } else {
        msgListEl.appendChild(recallMsgItemEl);
      }
    });
  } catch (err) {
    document.querySelector(".logs").innerText += `出错${err.message}\n`;
  }
}

function getTextContent(elements) {
  let textContent = "";
  elements.forEach((element) => {
    if (element.textElement && element.textElement.content) {
      textContent += element.textElement.content;
    }
  });
  return textContent;
}

function getPicList(elements) {
  const picList = [];
  elements.forEach((element) => {
    if (element.picElement && element.picElement.sourcePath) {
      picList.push(element.picElement.sourcePath);
    }
  });
  return picList;
}

function getPeerName(elements) {
  for (let i = 0; i < elements.length; i++) {
    const element = elements[i];
    if (element.peerName) {
      return element.peerName;
    }
  }
  return "没有找到名称";
}

// 刷新
window.addEventListener("keydown", (event) => {
  if (event.code === "F5") {
    location.reload();
  }
});

lite_tools.getReacllMsgData();