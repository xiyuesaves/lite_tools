// 刷新背景样式
let timeout;
import { Logs } from "./logs.js";
import { options } from "./options.js";
const log = new Logs("背景模块");

class BackgroundWallpaper {
  constructor() {
    this.el = document.createElement("div");
    this.el.classList.add("lite-tools-background-wallpaper");
    this.el.updateWallpaper = this.updateWallpaper.bind(this);
    this.el.target = this;
    this.imgEl = document.createElement("img");
    this.imgEl.setAttribute("src", "");
    this.videoEl = document.createElement("video");
    this.videoEl.volume = 0;
    this.videoEl.setAttribute("muted", "");
    this.videoEl.setAttribute("autoplay", "");
    this.videoEl.setAttribute("loop", "true");
    this.videoEl.setAttribute("src", "");
    return this.el;
  }
  updateWallpaper(enabled, wallpaperData) {
    if (enabled) {
      this.videoEl.style.opacity = options.background.opacity;
      this.imgEl.style.opacity = options.background.opacity;
      this.el.classList.toggle("background-transparent", options.background.removeMask);
      const { href, type } = wallpaperData;
      if (type === "video") {
        this.imgEl.remove();
        if (this.videoEl.getAttribute("src") !== href) {
          this.videoEl.setAttribute("muted", "");
          this.videoEl.volume = 0;
          this.videoEl.src = href;
        }
        this.el.appendChild(this.videoEl);
      } else if (type === "image") {
        this.videoEl.remove();
        if (href !== "local:///") {
          if (this.imgEl.getAttribute("src") !== href) {
            this.imgEl.src = href;
          }
          this.el.appendChild(this.imgEl);
        } else {
          this.imgEl.remove();
        }
      }
    } else {
      this.el.remove();
      this.videoEl.setAttribute("src", "");
      this.imgEl.setAttribute("src", "");
      this.videoEl.remove();
      this.imgEl.remove();
    }
  }
}

const wallpaper = new BackgroundWallpaper();

/**
 * 更新背景元素
 */
async function updateWallpaper(enabled, wallpaperData) {
  // 循环直到匹配到对应元素为止
  if (!document.querySelector(".lite-tools-main,.lite-tools-chat,.lite-tools-forward")) {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      log("没有找到元素，等待中");
      updateWallpaper(enabled, wallpaperData);
    }, 100);
    return;
  }
  wallpaper.updateWallpaper(enabled, wallpaperData);
  const liteToolsBackgroundStyle = document.querySelector("#liteToolsBackgroundStyle");
  if (!liteToolsBackgroundStyle) {
    return;
  }
  if (enabled) {
    liteToolsBackgroundStyle.setAttribute(
      "href",
      `local:///${LiteLoader.plugins.lite_tools.path.plugin}/src/css/style.css?r=${new Date().getTime()}`,
    );
    document.body.classList.toggle("lite-tools-blur-filter", options.background.blurFilter);
    document.body.classList.toggle("lite-tools-background-visible", options.background.backgroundVisible);
    // 主窗口
    if (app.classList.contains("lite-tools-main")) {
      app.classList.toggle("lite-tools-full-wallpaper", options.background.overlaySiderBar);
      if (options.background.overlaySiderBar) {
        document.querySelector("#app").appendChild(wallpaper);
      } else {
        document.querySelector(".container .tab-container").appendChild(wallpaper);
      }
    }
    // 聊天窗口
    if (app.classList.contains("lite-tools-chat")) {
      document.querySelector(".container").appendChild(wallpaper);
    }
    // 转发窗口
    if (app.classList.contains("lite-tools-forward")) {
      app.appendChild(wallpaper);
    }
  } else {
    liteToolsBackgroundStyle.setAttribute("href", ``);
    document.body.classList.remove("lite-tools-blur-filter");
    document.body.classList.remove("lite-tools-background-visible");
  }
}
log("模块已加载");
lite_tools.onUpdateWallpaper((...data) => {
  log("被动监听", data);
  updateWallpaper(data[1], data[2]);
});
lite_tools.getWallpaper().then((data) => updateWallpaper(...data));
