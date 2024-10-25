const tailElement = `<div class="ruls-item">
<div class="left-box">
  <div class="tail-opt">
    后缀内容：
    <input placeholder="后缀附加文本，留空可实现黑名单效果" spellcheck="false" class="input-text-active-show tail-context" />
  </div>
  <div class="tail-opt">
    是否换行：
    <div class="msg-tail-newline q-switch">
      <span class="q-switch__handle"></span>
    </div>
  </div>
  <div class="tail-opt">
    临时禁用：
    <div class="msg-tail-disabled q-switch">
      <span class="q-switch__handle"></span>
    </div>
  </div>
  <div class="tail-opt">
    匹配群组：
    <input placeholder="留空为全局匹配，多个匹配项用“,”隔开" spellcheck="false" class="input-text-active-show rule-group-list" />
  </div>
</div>
<div class="ruls-control">
  <div class="to-up"></div>
  <div class="delete"></div>
  <div class="to-down"></div>
</div>
</div>`;

const recallGroupItem = `<div class="filter-item"><span class="chat-type"></span><span class="peer-name"></span><span class="peer-uid"></span></div>`;
const recallTail = `<span class="tail" time=""></span>`;
const recallImgItem = `<div class="msg-img-item"><img /></div>`;
const recallMsgItem = `<div class="msg-item">
<div class="msg-box">
  <p class="user-name"></p>
  <div class="msg-content">
    <div class="msg-img-list">
    </div>
    <div class="msg-text-box">
      <p class="msg-text">
      </p>
    </div>
  </div>
</div>
</div>`;

const localEmoticonsHTML = `<div class="full-screen-preview">
<img src="" />
</div>
<div class="commonly-emoticons-panel"><div class="folder-list-commonly"></div></div>
<div class="lite-tools-local-emoticons-main">
  <div class="context-menu">
    <a class="commonly-item context-menu-item delete-from-commonly">
      <span class="context-menu-item__text">从历史表情移除</span>
    </a>
    <a class="commonly-item default-item context-menu-item open-folder">
      <span class="context-menu-item__text">打开表情文件夹</span>
    </a>
    <a class="commonly-item default-item context-menu-item open-file">
      <span class="context-menu-item__text">图片查看器打开</span>
    </a>
    <a class="default-item context-menu-item set-icon">
      <span class="context-menu-item__text">设置为分组图标</span>
    </a>
    <a class="commonly-item default-item context-menu-item context-danger delete-file">
      <span class="context-menu-item__text">从文件夹中删除</span>
    </a>
    <a class="folder-item context-menu-item rename-folder">
      <span class="context-menu-item__text">重命名分组</span>
    </a>
  </div>
  <div class="folder-list"></div>
  <div class="folder-icon-list">
    <div class="folder-scroll"></div>
  </div>
</div>`;

const messageTailTips = `<p title="%title%" class="lite-tools-tail-tips">%s%</p>`;

const subMenuIconEl = `<div class="q-context-menu-item__icon icon_next lite-tools-context-next-icon">
<i class="q-icon">
  <svg viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path fill-rule="evenodd" clip-rule="evenodd" d="M5.6953 3L10.7993 8.10522L5.6953 13.2104L5 12.5161L9.4098 8.10522L5 3.69439L5.6953 3Z"
    ></path>
  </svg>
</i>
</div>`;

const toastContentEl = `<div class="q-toast lite-tools-toast" style="position: fixed; z-index: 5000; top: 0px; left: 0px; pointer-events: none"></div>`;

const toastEl = `<div class="lite-tools-toast-item"><div class="q-toast-item">{{icon}}<span>{{content}}</span></div></div>`;

const defaultIcon = `<i style="width:20px;height:20px; color:#0099ff;"><svg viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
<path fill-rule="evenodd" clip-rule="evenodd" d="M14.5 8C14.5 11.5899 11.5899 14.5 8 14.5C4.41015 14.5 1.5 11.5899 1.5 8C1.5 4.41015 4.41015 1.5 8 1.5C11.5899 1.5 14.5 4.41015 14.5 8ZM8.5 6.5V11.5H7.5V6.5H8.5ZM8.5 5.5V4.5H7.5V5.5H8.5Z"></path>
</svg></i>`;

const successIcon = `<i style="width:20px;height:20px; color:#15D173;"><svg viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
<path fill-rule="evenodd" clip-rule="evenodd" d="M8 14.5C11.5899 14.5 14.5 11.5899 14.5 8C14.5 4.41015 11.5899 1.5 8 1.5C4.41015 1.5 1.5 4.41015 1.5 8C1.5 11.5899 4.41015 14.5 8 14.5ZM7.45232 10.2991L11.3555 6.35155L10.6445 5.64845L7.08919 9.2441L5.22771 7.44087L4.53193 8.15913L6.74888 10.3067L7.10435 10.651L7.45232 10.2991Z"></path>
</svg></i>`;

const errorIcon = `<i style="width:20px;height:20px; color:#FF5967;"><svg viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
<path fill-rule="evenodd" clip-rule="evenodd" d="M14.5 8C14.5 11.5899 11.5899 14.5 8 14.5C4.41015 14.5 1.5 11.5899 1.5 8C1.5 4.41015 4.41015 1.5 8 1.5C11.5899 1.5 14.5 4.41015 14.5 8ZM8.5 4.5V9.5H7.5V4.5H8.5ZM8.5 11.5V10.5H7.5V11.5H8.5Z"></path>
</svg></i>`;

const reminderEl = `<div class="lite-tools-keywordReminder">{{nums}} 条消息有提醒词</div>`;

const troopshareArkCard = `<div class="lite-tools-troopshare-ark-card lite-tools-ark-card">
<div class="desc">
  <div class="troop-avatar">
    <img src="{{troopSrc}}" />
  </div>
  <div class="troop-detail">
    <span class="troop-name text-ellipsis">{{troopname}}</span>
    <span class="troop-uid text-ellipsis">{{troopuid}}</span>
  </div>
</div>
<div class="bottom">
  <i class="user-icon">{{appIcon}}</i>
  <span class="title">{{title}}</span>
</div>
</div>`;

const webPreview = `<div class="lite-tools-web-preview">
<div class="lite-tools-web-preview-box">
  <div class="lite-tools-web-preview-detail">
    <strong class="lite-tools-web-preview-site-name">{{siteName}}</strong>
    <strong class="lite-tools-web-preview-title">{{title}}</strong>
    <span class="lite-tools-web-preview-desc">{{desc}}</span>
  </div>
  <div class="lite-tools-web-preview-img small-img LT-disabled"></div>
</div>
<div class="lite-tools-web-preview-img max-img LT-disabled"></div>
</div>`;

const updateMsgBox = `<div class="lite-tools-mask">
  <div class="lite-tools-update-msg-box">
    <div class="title" title="{{title}}">{{title}}</div>
    <div class="context">{{context}}</div>
    <div class="bottom-solt">
      <button class="q-button q-button--small q-button--primary update-btn {{hiddenUpdate}}">更新</button>
      <button class="q-button q-button--small q-button--secondary detail-btn">详情</button>
      <button class="q-button q-button--small q-button--secondary  quite-btn">返回</button>
    </div>
  </div>
</div>`;

export {
  tailElement,
  recallGroupItem,
  recallTail,
  recallImgItem,
  recallMsgItem,
  localEmoticonsHTML,
  messageTailTips,
  subMenuIconEl,
  toastContentEl,
  toastEl,
  defaultIcon,
  successIcon,
  errorIcon,
  reminderEl,
  troopshareArkCard,
  webPreview,
  updateMsgBox,
};
