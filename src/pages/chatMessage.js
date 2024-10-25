import { options, updateOptions } from "../render_modules/options.js";
// 右键菜单相关操作
import { addEventqContextMenu } from "../render_modules/qContextMenu.js";
// 撤回事件监听
import { newMessageRecall } from "../render_modules/messageRecall.js";
// 消息列表监听
import { chatMsgAreaTip } from "../render_modules/observerMessageList.js";
// 监听输入框上方功能
import { observerChatArea } from "../render_modules/observerChatArea.js";
// 背景壁纸模块
import "../render_modules/wallpaper.js";
// 通用监听输入框编辑事件
import { observeChatBox } from "../render_modules/observeChatBox.js";
// 通用聊天消息列表处理模块
import { chatMessageList } from "../render_modules/chatMessageList.js";
// 阻止拖拽多选消息
import { touchMoveSelectin } from "../render_modules/touchMoveSelectin.js";
// 更新输入框上方功能列表
import { observeChatTopFunc } from "../render_modules/observeChatTopFunc.js";
// 页面插入本地表情功能
import { localEmoticons } from "../render_modules/localEmoticons.js";
// 禁用tag
import { disableQtag } from "../render_modules/disabledQtag.js";
// 消息后缀提示模块
import "../render_modules/messageTail.js";
// 更新窗口图标
import "../render_modules/setAppIcon.js";
import { Logs } from "../render_modules/logs.js";
const log = new Logs("聊天窗口");

addEventqContextMenu();
touchMoveSelectin("chat-msg-area");
chatMessageList();
newMessageRecall();

const observe = new MutationObserver(chatMessage);
observe.observe(document.body, {
  childList: true,
  subtree: true,
});
updateOptions(chatMessage);
chatMessage();

/**
 * 聊天页面函数
 */
function chatMessage() {
  log("更新聊天页面配置");

  // 消息合并功能判断右侧悬浮按钮是否显示
  chatMsgAreaTip();

  // 禁用贴纸
  document.querySelector(".sticker-bar")?.classList?.toggle("LT-disabled", options.message.disabledSticker);

  // 禁用GIF热图
  document.querySelector(`.q-icon[title="GIF热图"]`)?.parentElement?.classList?.toggle("LT-disabled", options.message.disabledHotGIF);

  // 移除vip红名
  document.body.classList.toggle("remove-vip-name", options.message.removeVipName);

  disableQtag();
  localEmoticons();
  observeChatTopFunc();
  observerChatArea();
  observeChatBox();
}
