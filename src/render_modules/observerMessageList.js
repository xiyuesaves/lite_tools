import { options, updateOptions } from "./options.js";
import { messageRecall } from "./messageRecall.js";
import { forwardMessage } from "./nativeCall.js";
import { debounce } from "./debounce.js";
import { getPeer, addEventPeerChange } from "./curAioData.js";
import { checkChatType } from "./checkChatType.js";
import { showWebPreview } from "./showWebPreview.js";
import { Logs } from "./logs.js";
const log = new Logs("消息列表处理");

/**
 * 过滤消息类型
 * @type {number[]}
 */
const chatTypes = [1, 2, 100];

/**
 * 最大缓存10w条消息合并对应关系
 * @type {number}
 */
const MAX_CACHE_SIZE = 100000;

/**
 * 过滤消息元素
 * @type {string}
 */
const filterClass = ".msg-content-container:not(.ptt-message,.file-message--content,.wallet-message__container,.ark-msg-content-container)";

/**
 * 历史消息合并状态
 * @type {Map}
 */
let msgElMergeType = new Map();

/**
 * 匹配链接正则
 * @type {RegExp}
 */
const urlMatch = /https?:\/\/[\w\-_]+\.[\w]{1,10}[\S]+/i;

/**
 * 判断遮罩是否已经被点开了
 * @type {Set}
 */
let checkNSFW = new Set();

/**
 * 时间格式映射
 * @type {Object}
 */
const TIME_FORMAT_MAPPING = {
  1: "numeric",
  2: "2-digit",
};

/**
 * 获取当前peer
 */
let peer = getPeer();

/**
 * 获取当前时间显示方案
 */
let showMsgElapsedTime = options.message.showMsgElapsedTime;

/**
 * 处理当前可见的消息列表
 */
function processingMsgList() {
  // 消息列表数组
  const msgListRef = app.__vue_app__.config.globalProperties.$store.state.aio_chatMsgArea.msgListRef;

  // 消息类型不在处理范围
  if (!checkChatType(msgListRef.curMsgs?.[0]?.data)) {
    return;
  }

  const msgMergerMap = new Map();

  let currentMainId = null;

  // 循环消息列表
  for (let index = 0; index < msgListRef.curMsgs.length; index++) {
    // 当前消息
    const item = msgListRef.curMsgs[index];
    // 上一条消息
    const prevItem = msgListRef.curMsgs[index - 1];
    // 当前消息元素
    const messageEl = document.querySelector(`[id="${item.id}"] .message`);
    // 当前消息对象
    const msgRecord = msgListRef.curMsgs[index].data;

    // 额外处理下历史撤回数据
    if (messageEl && msgRecord?.lite_tools_recall) {
      messageRecall(messageEl, msgRecord?.lite_tools_recall);
    }

    // 消息合并逻辑
    if (
      messageEl &&
      msgRecord?.elements?.[0]?.grayTipElement === null &&
      options.message.avatarSticky.enabled &&
      options.message.mergeMessage
    ) {
      // 判断当前消息是不是子消息
      if (isChildMessage(prevItem?.data, item?.data)) {
        messageEl.classList.remove("merge-main");
        messageEl.classList.add("merge", "merge-child");
        msgMergerMap.delete(item.id);
        msgMergerMap.get(currentMainId)?.add(item.id);
        msgElMergeType.set(item.id, "merge-child");
      } else {
        messageEl.classList.remove("merge-child");
        messageEl.classList.add("merge", "merge-main");
        currentMainId = item.id;
        msgMergerMap.set(currentMainId, new Set());
        msgElMergeType.set(item.id, "merge-main");
      }

      // 如果缓存消息大于100000，则移除10%最早的数据
      if (msgElMergeType.size >= MAX_CACHE_SIZE) {
        const array = Array.from(msgElMergeType);
        const arrayLength = array.length;
        msgElMergeType = new Map(array.splice(0, arrayLength - arrayLength * 0.1));
      }
    }
  }

  // 计算消息合并后的头像浮动高度
  msgMergerMap.keys().forEach((mainId) => {
    const mainEl = document.querySelector(`[id="${mainId}"] .message .message-container`);
    const childs = msgMergerMap.get(mainId);
    let height = mainEl.offsetHeight; // 减去主消息的padding-top

    childs.forEach((childId) => {
      const childEl = document.querySelector(`[id="${childId}"] .message`);
      if (childEl) {
        height += childEl.offsetHeight;
      }
    });
    height = height - 4;

    const avatarEl = mainEl.querySelector(".avatar-span");
    if (avatarEl) {
      avatarEl.style.height = `${height}px`;
    }
  });
}

/**
 * 防抖批量处理当前可见的消息列表
 */
const debounceProcessingMsgList = debounce(processingMsgList, 10);

/**
 * 图片组件单独处理
 */
function imageComponent(component) {
  if (options.message.preventNSFW.enabled) {
    const vnode = component?.vnode?.el;
    const elementType = vnode?.classList?.contains("reply-element") ? "reply" : vnode?.classList?.contains("image") && "image";
    if (!elementType) {
      return;
    }
    const msgRecord = component?.provides?.msgRecord?.value;
    if (!msgRecord) {
      // 目标没有有效数据
      return;
    }
    // 消息类型不在处理范围
    if (!checkChatType(msgRecord)) {
      return;
    }
    const uuid = component?.attrs?.["element-id"] || msgRecord.msgId;
    if (checkNSFW.has(uuid)) {
      // 目标已被查看
      return;
    }
    const findReply = msgRecord?.elements?.find((element) => element?.replyElement);
    if (findReply) {
      const record = msgRecord?.records?.find((record) => record?.msgId === findReply.replyElement.sourceMsgIdInRecords);
      const picElement = record?.elements?.some((element) =>
        element?.picElement && options.message.preventNSFW.includesAnimationEmoticons
          ? true
          : element?.picElement?.picSubType === 0 && element?.picElement?.picType !== 2000,
      );
      const videoElement = record?.elements?.some((element) => element?.videoElement);
      if (!picElement && !videoElement) {
        return;
      }
    } else {
      const picElements = msgRecord?.elements?.some((element) =>
        element?.picElement && options.message.preventNSFW.includesAnimationEmoticons
          ? true
          : element?.picElement?.picSubType === 0 && element?.picElement?.picType !== 2000,
      );
      const videoElement = msgRecord?.elements?.some((element) => element?.videoElement);
      const videoFileElement = msgRecord?.elements?.some((element) => element?.fileElement && element?.fileElement?.subElementType === 2);
      if (!picElements && !videoElement && !videoFileElement) {
        return;
      }
      if (picElements && !component?.attrs?.["element-id"]) {
        return;
      }
    }

    if (
      options.message.preventNSFW.list.length === 0 ||
      options.message.preventNSFW.list.includes(msgRecord?.peerUin) ||
      options.message.preventNSFW.list.includes(msgRecord?.senderUin)
    ) {
      if (elementType === "image") {
        vnode?.classList?.add("lite-tools-nsfw-mask", "show-mask");
      } else {
        vnode.querySelector(".mixed-container")?.classList?.add("lite-tools-nsfw-mask", "show-mask");
      }
    }
  }
}

/**
 * 元素尺寸更新时更新消息消息列表检测
 */
const updateMsgList = new ResizeObserver(debounceProcessingMsgList);

/**
 * 等待图片元素尺寸更新
 */
const awaitList = new Map();

const resizeObserver = new ResizeObserver((entries) => {
  for (let entry of entries) {
    if (entry?.target?.offsetWidth) {
      // log("放行", entry?.target, entry?.target?.offsetWidth);
      resizeObserver.unobserve(entry.target);
      // 降低处理优先级，避免出现循环监听
      requestIdleCallback(
        () => {
          awaitList.get(entry.target)();
          awaitList.delete(entry.target);
        },
        {
          timeout: 500,
        },
      );
    }
  }
});

function addlImgResizeEvent(img) {
  resizeObserver.observe(img);
  return new Promise((res) => awaitList.set(img, res));
}

/**
 * 向 hookVue3 模块添加功能
 */
window?.__VUE_MOUNT__?.push((component) => {
  try {
    // 消息靠左单独处理函数
    messageToleft(component);
    // 图片组件单独处理
    imageComponent(component);
    // 单条消息处理
    if (component?.vnode?.el && component?.props?.msgRecord) {
      singleMessageProcessing(component.vnode.el, component.props.msgRecord);
      processingMsgList();
    }
  } catch (err) {
    log("出现错误", err);
  }
});

/**
 * 单条消息处理流程
 * @param {Element} target 目标消息元素
 * @param {Object} msgRecord 目标消息对象
 */
async function singleMessageProcessing(target, msgRecord) {
  // 消息类型不在处理范围
  if (!checkChatType(msgRecord)) {
    return;
  }
  // 处理消息列表
  if (target?.classList?.contains?.("message")) {
    const messageEl = target;
    if (messageEl) {
      if (chatTypes.includes(msgRecord?.chatType)) {
        // 尺寸监听器
        updateMsgList.observe(messageEl);

        // 消息靠左
        if (options.message.selfMsgToLeft) {
          messageEl.querySelector(".message-container")?.classList?.remove("message-container--self");
          messageEl.querySelector(".message-container")?.classList?.remove("message-container--align-right");
          messageEl.querySelector(".user-name")?.classList?.remove("user-name--selfRole");
          messageEl.querySelector(".user-name")?.classList?.remove("user-name--selfReverse");
        }

        // 图片自适应宽度 - 有问题，会使消息滚动时不受控制的跳动
        if (options.message.imageAutoWidth) {
          const findImageElement = msgRecord?.elements?.find((element) => element?.picElement && element?.picElement?.picSubType === 0);
          if (findImageElement) {
            messageEl.classList.add("image-auto-width");
            messageEl
              .querySelector(".msg-content-container")
              .style.setProperty("--img-max-width-2", `${findImageElement.picElement.picWidth}px`);
            messageEl.querySelectorAll(".image.pic-element").forEach((imgEl) => {
              if (imgEl?.__VUE__?.[0]?.props?.picSubType === 0) {
                imgEl.classList.add("max-width");
              }
            });
          }
        }

        // 移除超级表情，收藏表情，商城表情，单张图片消息的背景
        if (options.background.enabled && msgRecord?.elements?.length === 1) {
          if (
            (msgRecord?.elements?.[0]?.elementType === 6 && msgRecord?.elements?.[0]?.faceElement?.faceType === 3) ||
            msgRecord?.elements?.[0]?.picElement ||
            msgRecord?.elements?.[0]?.elementType === 11
          ) {
            target.querySelector(".mix-message__container")?.classList?.add("hidden-background");
          }
        }

        // 消息添加插槽
        let slotEl = null;
        if (!messageEl.querySelector(".lite-tools-slot")) {
          // 插槽元素
          slotEl = document.createElement("div");
          slotEl.classList.add("lite-tools-slot");
          // 气泡-嵌入（必须含有文本内容的消息,文件消息）
          const bubbleEmbed = messageEl.querySelector(
            ":not(.mix-message__container--pic,.mix-message__container--market-face,.mix-message__container--lottie-face)>.message-content.mix-message__inner,.normal-file.file-element .file-info,.file-info-mask p:last-child,.message-content__wrapper .count,.reply-message__container .reply-message__inner",
          );
          // 气泡-内部消息（单独的图片/视频消息，自己发送的表情）
          const bubbleInside = messageEl.querySelector(
            ".mix-message__container--pic,.mix-message__container--market-face,.mix-message__container--lottie-face,.msg-preview",
          );
          // 气泡-外部消息（兜底样式）
          const bubbleOutside = messageEl.querySelector(".message-container .message-content__wrapper");
          // 插入插槽
          if (bubbleEmbed) {
            slotEl.classList.add("embed-slot");
            bubbleEmbed.appendChild(slotEl);
          } else if (bubbleInside) {
            // 如果是图片或表情则额外判断一次
            const classList = ["mix-message__container--pic", "mix-message__container--market-face"];
            if (classList.some((className) => bubbleInside.classList.contains(className))) {
              const msgContentEl = target.querySelector(".msg-content-container");
              if (!msgContentEl.offsetWidth) {
                await addlImgResizeEvent(msgContentEl);
              }
              // log("图片尺寸", msgContentEl.offsetWidth, document.body.contains(msgContentEl));
              const elements = msgRecord?.elements;
              const minWidth =
                options.message.showMsgTime && // 开启了显示时间
                options.message.showMsgTimeDateFormat !== "000" && // 开启了日期显示
                (!options.message.showMsgTimeToSenderName || peer.chatType !== 2) // 没有开启插入到用户名后方或当前聊天是私聊
                  ? 200
                  : 130;
              if (
                elements.length === 1 &&
                ((elements[0]?.marketFaceElement ? 150 : 0) >= minWidth || msgContentEl.offsetWidth >= minWidth)
              ) {
                slotEl.classList.add("inside-slot");
                bubbleInside.appendChild(slotEl);
              } else {
                slotEl.classList.add("outside-slot");
                if (messageEl.querySelector(".message-container--self") && !options.message.selfMsgToLeft) {
                  bubbleOutside.insertBefore(slotEl, bubbleOutside.firstChild);
                } else {
                  bubbleOutside.appendChild(slotEl);
                }
              }
            } else {
              slotEl.classList.add("inside-slot");
              bubbleInside.appendChild(slotEl);
            }
          } else if (bubbleOutside) {
            slotEl.classList.add("outside-slot");
            if (messageEl.querySelector(".message-container--self") && !options.message.selfMsgToLeft) {
              bubbleOutside.insertBefore(slotEl, bubbleOutside.firstChild);
            } else {
              bubbleOutside.appendChild(slotEl);
            }
          } else {
            slotEl = null;
          }
        }

        // 插入消息时间
        if (slotEl && options.message.showMsgTime) {
          if (!messageEl.querySelector(".lite-tools-time")) {
            const find = (msgRecord?.msgTime ?? 0) * 1000;
            if (find) {
              const showTime = options.message.showMsgElapsedTime ? autoTime(find) : absTime(find);

              // 完整时间
              const fullTime = new Intl.DateTimeFormat("zh-CN", {
                timeStyle: "full",
                dateStyle: "full",
              }).format(new Date(find));

              const newTimeEl = document.createElement("div");
              newTimeEl.innerText = showTime;
              newTimeEl.title = `${fullTime}`;
              newTimeEl.setAttribute("time", showTime);
              newTimeEl.setAttribute("data-date", find);
              newTimeEl.classList.add("lite-tools-time");

              /**
               * @type {Element}
               */
              const senderNameEl = messageEl.querySelector(".user-name");
              if (options.message.showMsgTimeToSenderName && senderNameEl) {
                senderNameEl.classList.add("disabled-send-time");
                if (messageEl.querySelector(".message-container--self") && !options.message.selfMsgToLeft) {
                  if (messageEl.querySelector(".q-tag")) {
                    senderNameEl.classList.add("self-and-tag");
                    senderNameEl.insertAdjacentElement("beforeend", newTimeEl);
                  } else {
                    senderNameEl.insertAdjacentElement("afterbegin", newTimeEl);
                  }
                } else {
                  senderNameEl.insertAdjacentElement("beforeend", newTimeEl);
                }
              } else {
                slotEl.appendChild(newTimeEl);
              }
            }
          }
        }

        // 插入+1按钮
        if (slotEl && options.message.replaceBtn && !msgRecord?.lite_tools_recall) {
          // +1插入元素
          if (messageEl.querySelector(filterClass) && !messageEl.querySelector(".message-content-replace")) {
            const msgEl = messageEl.querySelector(".message-content__wrapper");
            const newReplaceEl = document.createElement("div");
            const msgId = msgRecord?.msgId;
            let doubleClick = false;
            newReplaceEl.classList.add("message-content-replace");
            newReplaceEl.innerText = "+1";
            newReplaceEl.addEventListener("click", () => {
              if (options.message.doubleClickReplace) {
                setTimeout(() => {
                  doubleClick = false;
                }, 500);
                if (doubleClick) {
                  log("复读消息", peer);
                  forwardMessage(peer, peer, [msgId]);
                  doubleClick = false;
                }
                doubleClick = true;
              } else {
                log("复读消息", peer);
                forwardMessage(peer, peer, [msgId]);
              }
            });
            if (slotEl.classList.contains("outside-slot")) {
              if (messageEl.querySelector(".message-container--self") && !options.message.selfMsgToLeft) {
                if (slotEl.querySelector(".lite-tools-time")) {
                  slotEl.classList.add("fix-padding-right");
                }
                slotEl.insertBefore(newReplaceEl, slotEl.firstChild);
              } else {
                if (slotEl.querySelector(".lite-tools-time")) {
                  slotEl.classList.add("fix-padding-left");
                }
                slotEl.appendChild(newReplaceEl);
              }
            } else {
              newReplaceEl.classList.add("single");
              if (messageEl.querySelector(".message-container--self") && !options.message.selfMsgToLeft) {
                msgEl.insertBefore(newReplaceEl, msgEl.firstChild);
              } else {
                msgEl.appendChild(newReplaceEl);
              }
            }
          }
        }

        // 插入撤回提示
        if (slotEl && options.preventMessageRecall.enabled) {
          if (msgRecord?.lite_tools_recall) {
            messageRecall(messageEl, msgRecord?.lite_tools_recall);
          }
        }

        // 连续消息合并
        if (options.message.avatarSticky.enabled && options.message.mergeMessage) {
          const oldType = msgElMergeType.get(msgRecord?.msgId);
          if (oldType) {
            messageEl.classList.add("merge", oldType);
          }
        }

        // 添加url预览信息
        if (options.message.previreUrl.enabled) {
          const findURL = msgRecord?.elements?.find((element) => urlMatch.test(element?.textElement?.content));
          if (findURL?.textElement?.content) {
            log("请求url卡片数据", msgRecord.msgId, findURL.textElement.content);
            showWebPreview(findURL.textElement.content, messageEl, msgRecord.msgId);
          }
        }
      }
    }
  }
}

/**
 * 消息靠左额外处理函数
 * @param {Object} component 目标消息对象
 */
function messageToleft(component) {
  if (options.message.selfMsgToLeft && component?.vnode?.el?.classList?.contains("message-container")) {
    Object.defineProperty(component.proxy, "isSelfAlignRight", {
      enumerable: true,
      configurable: true,
      get() {
        return false;
      },
      set() {},
    });
  }
}

/**
 * 初始化当前已加载的消息元素
 * @param {Boolean} recursion 是否递归检测
 */
const initMessageList = (recursion = true) => {
  const curMsgs = app.__vue_app__.config.globalProperties.$store.state.aio_chatMsgArea.msgListRef.curMsgs;
  const curMsgsLength = curMsgs.length;
  // 没有找到消息列表数组且兼容选项未启用时，调用自身防抖函数并直接退出
  if (!curMsgs.length && recursion) {
    debounceInitMessageList();
    return;
  }
  for (let index = 0; index < curMsgsLength; index++) {
    const el = curMsgs[index];
    const msgItemEl = document.querySelector(`[id="${el.id}"]`);
    const messageEl = msgItemEl.querySelector(".message");
    if (messageEl) {
      singleMessageProcessing(messageEl, el.data);
    } else if (!msgItemEl && recursion) {
      log("消息元素不存在，重新检测可见消息数据", el.id);
      // 如果指定id的消息还没有被渲染出来，则调用自身防抖函数重新处理
      debounceInitMessageList();
    }
  }
};

/**
 * 防抖处理已加载的消息元素
 */
const debounceInitMessageList = debounce(initMessageList);
initMessageList();

/**
 * 判断当前消息是不是子消息
 * @return {Boolean}
 */
function isChildMessage(prevRecord, record) {
  // 如果其中一个参数为空则直接返回false
  if (!(prevRecord && record)) {
    return false;
  }

  // uni是否一致
  const uniEqual = prevRecord?.senderUid === record?.senderUid;

  // 匿名昵称是否一致
  const anonymousEqual = prevRecord?.anonymousExtInfo?.anonymousNick === record?.anonymousExtInfo?.anonymousNick;

  // 消息是不是灰色提示
  const grayTip = prevRecord?.elements?.[0]?.grayTipElement === null;

  // 消息有没有显示时间
  const showTime = options.message.mergeMessageKeepTime ? !record?.showTimestamp : true;

  // 返回是不是主消息
  return uniEqual && anonymousEqual && grayTip && showTime;
}

// 一个全局点击监听器，用于处理防剧透图片点击事件
document.addEventListener("click", (e) => {
  const maskEl = e.target.closest(".lite-tools-nsfw-mask.show-mask");
  if (maskEl) {
    e.preventDefault();
    e.stopPropagation();
    maskEl.classList.remove("show-mask");
    const msgId = maskEl.getAttribute("element-id") || maskEl.closest(".ml-item").getAttribute("id");
    checkNSFW.add(msgId);
    // 如果缓存消息大于MAX_CACHE_SIZE，则移除10%最早的数据
    if (checkNSFW.size >= MAX_CACHE_SIZE) {
      const array = Array.from(checkNSFW);
      const arrayLength = array.length;
      checkNSFW = new Set(array.splice(0, arrayLength - arrayLength * 0.1));
    }
  }
});

// 监听peer更新
addEventPeerChange((newPeer) => {
  peer = newPeer;
  checkNSFW = new Set();
});

// 动态时间
function autoTime(sendTime) {
  const sendTimeStamp = new Date(sendTime);
  const nowTimeStamp = new Date();
  const diff = nowTimeStamp - sendTimeStamp;
  const diffYear = Math.floor(diff / 1000 / 60 / 60 / 24 / 30 / 12);
  const diffMonth = Math.floor(diff / 1000 / 60 / 60 / 24 / 30);
  const diffDay = Math.floor(diff / 1000 / 60 / 60 / 24);
  const diffHour = Math.floor(diff / 1000 / 60 / 60);
  const diffMin = Math.floor(diff / 1000 / 60);
  const diffSec = Math.floor(diff / 1000);
  if (diffYear > 0) {
    return `${diffYear} 年前`;
  } else if (diffMonth > 0) {
    return `${diffMonth} 个月前`;
  } else if (diffDay > 0) {
    return `${diffDay} 天前`;
  } else if (diffHour > 0) {
    return `${diffHour} 小时前`;
  } else if (diffMin > 0) {
    return `${diffMin} 分钟前`;
  } else if (diffSec > 0) {
    return `${diffSec} 秒前`;
  } else {
    return "当前";
  }
}

// 每隔30秒更新一次动态时间
setInterval(() => {
  if (options.message.showMsgElapsedTime) {
    document.querySelectorAll(".lite-tools-time").forEach((item) => {
      const newTime = autoTime(item.getAttribute("data-date") * 1);
      item.innerText = newTime;
      item.setAttribute("time", newTime);
    });
  }
}, 30 * 1000);

// 配置更新时触发
updateOptions(() => {
  if (showMsgElapsedTime !== options.message.showMsgElapsedTime) {
    showMsgElapsedTime = options.message.showMsgElapsedTime;
    if (options.message.showMsgElapsedTime) {
      document.querySelectorAll(".lite-tools-time").forEach((item) => {
        const newTime = autoTime(item.getAttribute("data-date") * 1);
        item.innerText = newTime;
        item.setAttribute("time", newTime);
      });
    } else {
      document.querySelectorAll(".lite-tools-time").forEach((item) => {
        const newTime = absTime(item.getAttribute("data-date") * 1);
        item.innerText = newTime;
        item.setAttribute("time", newTime);
      });
    }
  }
});

// 绝对时间
function absTime(sendTime) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: TIME_FORMAT_MAPPING[options.message.showMsgTimeDateFormat[0]],
    month: TIME_FORMAT_MAPPING[options.message.showMsgTimeDateFormat[1]],
    day: TIME_FORMAT_MAPPING[options.message.showMsgTimeDateFormat[2]],
    hour: TIME_FORMAT_MAPPING[options.message.showMsgTimeFormat[0]],
    minute: TIME_FORMAT_MAPPING[options.message.showMsgTimeFormat[1]],
    second: TIME_FORMAT_MAPPING[options.message.showMsgTimeFormat[2]],
    timeZoneName: options.message.showMsgTimeZone ? "shortOffset" : undefined,
  }).format(new Date(sendTime));
}

/**
 * 初始化监听器
 */
function initObserver() {
  const mlList = document.querySelector(".ml-area.v-list-area .virtual-scroll-area .ml-list.list");
  if (mlList) {
    new MutationObserver(() => {
      // 在消息列表发生变化时触发更新消息列表更新逻辑
      debounceProcessingMsgList();
    }).observe(mlList, {
      childList: true,
      subtree: true,
    });
  } else {
    setTimeout(initObserver, 500);
  }
}
initObserver();

export function chatMsgAreaTip() {
  if (options.message.mergeMessage) {
    document.body.classList.toggle("lite-tools-merge-message-tip-top-btn-fix", document.querySelector(".chat-msg-area__tip--top-btn"));
    document.body.classList.toggle("lite-tools-merge-message-tip-bottom-fix", document.querySelector(".chat-msg-area__tip--bottom"));
  }
}
