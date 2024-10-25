import { join } from "path";
import { watch, writeFileSync } from "fs";
import { Logs } from "./logs.js";
import { globalBroadcast } from "./globalBroadcast.js";
import { config, onUpdateConfig } from "./config.js";
import { debounce } from "./debounce.js";
import { ipcMain, systemPreferences } from "electron";
const log = new Logs("样式调试模块");

const pluginPath = LiteLoader.plugins.lite_tools.path.plugin;
const styleSassPath = join(pluginPath, "src/scss/style.scss");
const stylePath = join(pluginPath, "src/css/style.css");
const globalScssPath = join(pluginPath, "src/scss/global.scss");
const globalPath = join(pluginPath, "src/css/global.css");
const settingScssPath = join(pluginPath, "src/scss/view.scss");
const settingPath = join(pluginPath, "src/css/view.css");

let abortController;
let sass;
onUpdateConfig(() => {
  try {
    if (config.debug.autoCompileScss) {
      if (abortController) {
        return;
      }
      abortController = new AbortController();
      // 编译样式
      if (!sass) {
        sass = require("sass");
      }
      log("开始监听scss变动");
      // 监听并编译style.scss
      watch(
        styleSassPath,
        { signal: abortController.signal },
        debounce(() => {
          writeFileSync(stylePath, sass.compile(styleSassPath).css);
          log("updateStyle");
          globalBroadcast("LiteLoader.lite_tools.updateStyle");
        }, 100),
      );
      // 监听并编译global.scss
      watch(
        globalScssPath,
        { signal: abortController.signal },
        debounce(() => {
          writeFileSync(globalPath, sass.compile(globalScssPath).css);
          log("updateGlobalStyle");
          globalBroadcast("LiteLoader.lite_tools.updateGlobalStyle");
        }, 100),
      );
      // 监听并编译view.scss
      watch(
        settingScssPath,
        { signal: abortController.signal },
        debounce(() => {
          writeFileSync(settingPath, sass.compile(settingScssPath).css);
          log("updateSettingStyle");
          globalBroadcast("LiteLoader.lite_tools.updateSettingStyle");
        }, 100),
      );
    } else {
      if (abortController) {
        log("结束动态更新样式");
        abortController.abort();
        abortController = null;
      }
    }
  } catch (err) {
    log("当前环境未安装sass，动态更新样式无法工作", err);
  }
});

// 色表：https://www.electronjs.org/docs/latest/api/system-preferences#systempreferencesgetaccentcolor-windows-macos
ipcMain.handle("LiteLoader.lite_tools.getSystemAccentColor", () => `#${systemPreferences.getAccentColor()}`);
systemPreferences.on("accent-color-changed", () => globalBroadcast("LiteLoader.lite_tools.onSystemAccentColorChanged"));
