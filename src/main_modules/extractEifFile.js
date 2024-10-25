import path from "path";
import fs from "fs";
import { writeFile } from "node:fs/promises";
import CFB from "./cfbFixed.js";
import { ipcMain } from "electron";
import { settingWindow } from "./captureWindow.js";
import { Logs } from "./logs.js";
import { config } from "./config.js";
import { folderUpdate, setPauseWatch } from "./localEmoticons.js";
const log = new Logs("eif表情处理模块");

async function extract(src) {
  for (let zipped_file of listFiles(src, [".jpg", ".png", ".gif"])) {
    let local_path = zipped_file.path.replace(/^Root Entry\//, "");
    let entry_file = path.join(config.localEmoticons.localPath, path.basename(src, path.extname(src)), local_path);
    ensureFileSync(entry_file);
    await writeFile(entry_file, zipped_file?.entry?.content);
  }
}

function ensureFileSync(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      return;
    }
    const dir = path.dirname(filePath);
    fs.mkdirSync(dir, { recursive: true });
  } catch (err) {
    log(`创建路径失败 ${err}`);
    throw err;
  }
}

function listFiles(src, allowed_exts = []) {
  let eif = CFB.read(src, { type: "file" });
  let valid_paths = [];
  let valid_content = eif.FileIndex.filter((e, i) => {
    if (e.size > 0) {
      valid_paths.push(eif.FullPaths[i]);
      return true;
    }
    return false;
  });
  let file_list = [];
  for (let idx in valid_content) {
    let entry = valid_content[idx];
    if (entry.type == 2 && (!allowed_exts || allowed_exts.indexOf(path.extname(entry.name)) >= 0)) {
      file_list.push({ path: valid_paths[idx], entry: entry });
    }
  }
  return file_list;
}

ipcMain.on("LiteLoader.lite_tools.extractEifFile", async (_, eifPath) => {
  const baseName = path.basename(eifPath, path.extname(eifPath));
  settingWindow.webContents.send("LiteLoader.lite_tools.onToast", {
    content: `开始导入 ${baseName}`,
    type: "default",
    duration: 60 * 60 * 1000,
  });
  try {
    setPauseWatch(true);
    await extract(eifPath);
    settingWindow.webContents.send("LiteLoader.lite_tools.clearToast");
    settingWindow.webContents.send("LiteLoader.lite_tools.onToast", {
      content: `${baseName} 导入成功`,
      type: "success",
      duration: 6 * 1000,
    });
  } catch (err) {
    settingWindow.webContents.send("LiteLoader.lite_tools.clearToast");
    settingWindow.webContents.send("LiteLoader.lite_tools.onToast", {
      content: `导入失败 ${err?.message}`,
      type: "error",
      duration: 6 * 1000,
    });
  } finally {
    setPauseWatch(false);
    folderUpdate();
  }
});
