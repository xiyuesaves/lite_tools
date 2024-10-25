import { updateMsgBox } from "./HTMLtemplate.js";
/**
 * 显示更新日志，该模块只能在设置页面使用
 * @param {String} html html字符串
 * @param {Boolean} showDownloadBtn 是否显示下载按钮
 */
function openChangeLog(html, updateUrl = false, detailUrl) {
  const newMsgBox = updateMsgBox.replace(/\{\{([^}]+)\}\}/g, (match, name) => {
    switch (name) {
      case "title":
        return "更新日志";
      case "context":
        return html;
      case "hiddenUpdate":
        return updateUrl ? "" : "LT-disabled";
      default:
        return name;
    }
  });
  document.querySelector(".tab-view.lite_tools").insertAdjacentHTML("beforeend", newMsgBox);
  const showMsgBox = document.querySelector(".lite-tools-mask");
  showMsgBox.offsetHeight;
  showMsgBox.classList.add("show");
  showMsgBox.querySelector(".quite-btn").addEventListener("click", () => {
    showMsgBox.addEventListener("transitionend", () => {
      showMsgBox.remove();
    });
    showMsgBox.classList.remove("show");
  });
  showMsgBox.querySelector(".update-btn").addEventListener("click", () => {
    lite_tools.updatePlugins(updateUrl);
  });
  showMsgBox.querySelector(".detail-btn").addEventListener("click", () => {
    lite_tools.openWeb(detailUrl);
  });
}
export { openChangeLog };
