import "../render_modules/wallpaper.js";
import { options, updateOptions } from "../render_modules/options.js";

/**
 * 时间格式映射
 * @type {Object}
 */
const TIME_FORMAT_MAPPING = {
  1: "numeric",
  2: "2-digit",
};

updateOptions(chatMessage);

/**
 * 合并转发页面
 */
function chatMessage() {
  // 过滤消息类型
  const chatTypes = [1, 2, 100];
  const messages = document.querySelectorAll(".message");
  messages.forEach((messageEl) => {
    const elProps = messageEl.__VUE__[0].props;
    if (chatTypes.includes(elProps?.msgRecord?.chatType)) {
      // 图片自适应宽度
      const findImageElement = elProps?.msgRecord?.elements?.find(
        (element) => element?.picElement && element?.picElement?.picSubType === 0,
      );
      if (options.message.imageAutoWidth && findImageElement) {
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
      // 开启背景时优化小图展示
      if (options.background.enabled) {
        // 过小尺寸的图片移除气泡效果
        const mixPicEl = messageEl.querySelector(".mix-message__container--pic");
        if (mixPicEl) {
          const picEl = mixPicEl.querySelector(".pic-element");
          if (picEl && !picEl.classList.contains("hidden-background") && !(picEl.offsetWidth >= 80 && picEl.offsetHeight >= 50)) {
            mixPicEl.classList.add("hidden-background");
          }
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
          // 如果是图片则额外判断一次
          if (bubbleInside.classList.contains("mix-message__container--pic")) {
            const elements = elProps?.msgRecord?.elements;
            if (
              elements.length === 1 &&
              elements[0].picElement &&
              elements[0].picElement.picHeight >= 50 &&
              elements[0].picElement.picWidth >= 120
            ) {
              slotEl.classList.add("inside-slot");
              bubbleInside.appendChild(slotEl);
            } else {
              slotEl.classList.add("outside-slot");
              if (messageEl.querySelector(".message-container--self")) {
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
          if (messageEl.querySelector(".message-container--self")) {
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
          const find = (elProps?.msgRecord?.msgTime ?? 0) * 1000;
          if (find) {
            const showTime = new Intl.DateTimeFormat("zh-CN", {
              year: TIME_FORMAT_MAPPING[options.message.showMsgTimeDateFormat[0]],
              month: TIME_FORMAT_MAPPING[options.message.showMsgTimeDateFormat[1]],
              day: TIME_FORMAT_MAPPING[options.message.showMsgTimeDateFormat[2]],
              hour: TIME_FORMAT_MAPPING[options.message.showMsgTimeFormat[0]],
              minute: TIME_FORMAT_MAPPING[options.message.showMsgTimeFormat[1]],
              second: TIME_FORMAT_MAPPING[options.message.showMsgTimeFormat[2]],
              timeZoneName: options.message.showMsgTimeZone ? "shortOffset" : undefined,
            }).format(new Date(find));

            const fullTime = new Intl.DateTimeFormat("zh-CN", {
              timeStyle: "full",
              dateStyle: "full",
            }).format(new Date(find));

            const newTimeEl = document.createElement("div");
            newTimeEl.innerText = showTime;
            newTimeEl.title = `${fullTime}`;
            newTimeEl.setAttribute("time", showTime);
            newTimeEl.classList.add("lite-tools-time");
            /**
             * @type {Element}
             */
            const senderNameEl = messageEl.querySelector(".user-name");
            if (options.message.showMsgTimeToSenderName && senderNameEl) {
              if (messageEl.querySelector(".message-container--self")) {
                if (messageEl.querySelector(".q-tag")) {
                  newTimeEl.classList.add("self-and-tag");
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
    }
  });
}

chatMessage();
setTimeout(chatMessage, 500);
