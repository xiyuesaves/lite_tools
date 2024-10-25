import { createWriteStream, unlinkSync } from "fs";
import { Readable } from "stream";
import { finished } from "stream/promises";
import { app, ipcMain } from "electron";
import { join } from "path";
import { fetch } from "./updateProxy.js";
import AdmZip from "adm-zip";
import { config } from "./config.js";
import { settingWindow } from "./captureWindow.js";

let isUpdating = "false";

// 更新插件
ipcMain.on("LiteLoader.lite_tools.updatePlugins", async (_, url) => {
  if (isUpdating === "false") {
    try {
      isUpdating = "true";
      settingWindow.webContents.send("LiteLoader.lite_tools.updateEvent", {
        toast: { content: "开始更新，请不要关闭本窗口和退出QQ", type: "info", duration: "10000000" },
        status: "note",
      });
      const compressedPackagePath = join(LiteLoader.plugins.lite_tools.path.plugin, "lite_tools_v4.zip");
      const res = await fetch(url);
      const fileStream = createWriteStream(compressedPackagePath, { flags: "w" });
      await finished(Readable.fromWeb(res.body).pipe(fileStream));
      settingWindow.webContents.send("LiteLoader.lite_tools.updateEvent", {
        toast: { content: `下载压缩包成功`, type: "info", duration: "10000000" },
        status: "processing",
      });
      settingWindow.webContents.send("LiteLoader.lite_tools.updateEvent", {
        toast: { content: `解压中`, type: "info", duration: "10000000" },
        status: "processing",
      });
      const zip = new AdmZip(compressedPackagePath);
      zip.extractAllTo(join(LiteLoader.plugins.lite_tools.path.plugin), true);
      settingWindow.webContents.send("LiteLoader.lite_tools.updateEvent", {
        toast: { content: `解压完成，删除压缩包`, type: "success", duration: "10000000" },
        status: "processing",
      });
      unlinkSync(compressedPackagePath);
      if (config.autoRelanch) {
        settingWindow.webContents.send("LiteLoader.lite_tools.updateEvent", {
          toast: { content: `更新完成，3 秒后自动重启`, type: "success", duration: "10000" },
          status: "end",
        });
        isUpdating = "waitingRestart";
        setTimeout(() => {
          app.relaunch();
          app.exit();
        }, 3000);
      } else {
        settingWindow.webContents.send("LiteLoader.lite_tools.updateEvent", {
          toast: { content: `更新完成，建议立即重启`, type: "success", duration: "10000" },
          status: "end",
        });
        isUpdating = "waitingRestart";
      }
    } catch (err) {
      settingWindow.webContents.send("LiteLoader.lite_tools.updateEvent", {
        toast: { content: `更新失败，错误原因：\n${err?.message}`, type: "error", duration: "10000" },
        status: "end",
      });
      isUpdating = "false";
    }
  } else if (isUpdating === "true") {
    settingWindow.webContents.send("LiteLoader.lite_tools.updateEvent", {
      toast: { content: "更新中，请勿重复点击", type: "error", duration: "3000" },
      status: "note",
    });
  } else if (isUpdating === "waitingRestart") {
    settingWindow.webContents.send("LiteLoader.lite_tools.updateEvent", {
      toast: { content: "请先完成重启", type: "error", duration: "3000" },
      status: "note",
    });
  }
});

// 获取插件更新
ipcMain.handle("LiteLoader.lite_tools.checkUpdate", async () => {
  return (await fetch(config.global.updateUrl)).json();
});
