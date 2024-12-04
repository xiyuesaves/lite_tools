import { extname, basename } from "node:path";
import { config, onUpdateConfig } from "./config.js";
import { Logs } from "./logs.js";
import { RangesServer } from "./rangesServer.js";
import { globalBroadcast } from "./globalBroadcast.js";
import { ipcMain } from "electron";
const videoServer = new RangesServer();
const log = new Logs("背景模块");

let backgroundData;

onUpdateConfig(() => {
  // 更新窗口背景
  if (config.background.enabled) {
    if ([".mp4", ".webm"].includes(extname(config.background.url))) {
      videoServer.setFilePath(config.background.url);
      videoServer
        .startServer()
        .then((port) => {
          backgroundData = {
            href: `http://localhost:${port}/${basename(config.background.url)}`,
            type: "video",
          };
          log("背景-更新为视频");
          globalBroadcast("LiteLoader.lite_tools.updateWallpaper", config.background.enabled, backgroundData);
        })
        .catch((err) => {
          log("启用视频背景服务时出错", err);
          backgroundData = {
            href: "",
            type: "image",
          };
          globalBroadcast("LiteLoader.lite_tools.updateWallpaper", false, backgroundData);
        });
    } else {
      videoServer.stopServer();
      backgroundData = {
        href: `local:///${config.background.url.replace(/\\/g, "//")}`,
        type: "image",
      };
      log("背景-更新为图片");
      globalBroadcast("LiteLoader.lite_tools.updateWallpaper", config.background.enabled, backgroundData);
    }
  } else {
    videoServer.stopServer();
    backgroundData = {
      href: "",
      type: "image",
    };
    globalBroadcast("LiteLoader.lite_tools.updateWallpaper", false, backgroundData);
  }
});

ipcMain.handle("LiteLoader.lite_tools.getWallpaper", () => {
  return [config.background.enabled, backgroundData];
});
