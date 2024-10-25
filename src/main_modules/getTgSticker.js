import { Readable } from "stream";
import Ffmpeg from "fluent-ffmpeg";
import { join } from "path";
import { ipcMain } from "electron";
import { writeFileSync, mkdirSync } from "fs";
import { config } from "./config.js";
import { settingWindow } from "./captureWindow.js";
import { folderUpdate, setPauseWatch } from "./localEmoticons.js";
import { fetch } from "./updateProxy.js";
import { spawn } from "child_process";
import zlib from "zlib";
import { Logs } from "./logs.js";
const log = new Logs("getTgSticker");
const MAX_CONCURRENT_DOWNLOADS = 8;

/**
 * 添加贴纸路径
 * @param {String} url
 */
async function getTgSticker(url) {
  if (config.localEmoticons.ffmpegPath) {
    Ffmpeg.setFfmpegPath(config.localEmoticons.ffmpegPath);
  }
  if (url.startsWith("https://t.me/addstickers/")) {
    try {
      const stickerName = url.split("/")[4];
      const res = await fetch(`https://api.telegram.org/bot${config.localEmoticons.tgBotToken}/getStickerSet?name=${stickerName}`);
      const data = await res.json();
      log("贴图集数据", data);
      if (data.ok) {
        if (data.result.sticker_type !== "regular") {
          throw new Error("不支持的贴纸包类型");
        }
        const stickerData = {
          title: data.result.title,
          name: data.result.name,
          icon: null,
          url,
        };
        settingWindow.webContents.send("LiteLoader.lite_tools.onDownloadTgStickerEvent", {
          message: `开始下载 ${data.result.title}`,
          type: "default",
          duration: 60 * 60 * 1000,
        });
        const stickerList = data.result.stickers;
        const pictureList = [];
        const videoList = [];
        const animatedList = [];
        stickerList.forEach((item) => {
          if (item.is_animated) {
            animatedList.push(item);
          } else if (item.is_video) {
            videoList.push(item);
          } else {
            pictureList.push(item);
          }
        });
        log(`共有 ${pictureList.length}个静图 ${videoList.length}个视频 ${animatedList.length}个tgs`);
        const concatArr = [...pictureList];
        if (config.localEmoticons.tgsToGifPath) {
          concatArr.push(...animatedList);
        }
        if (videoList.length) {
          const supportEncoding = await new Promise((res) => {
            Ffmpeg.getAvailableCodecs(function (err, codecs) {
              if (err) {
                settingWindow.webContents.send("LiteLoader.lite_tools.onDownloadTgStickerEvent", {
                  message: `FFmpeg 命令执行失败，请检查 FFmpeg 路径是否填写正确`,
                  type: "error",
                  duration: 6000,
                });
                res(false);
              } else if (codecs["libvpx-vp9"]) {
                res(true);
              } else {
                settingWindow.webContents.send("LiteLoader.lite_tools.onDownloadTgStickerEvent", {
                  message: `当前 FFmpeg 不支持 libvpx-vp9 编码格式，请更换版本后重试`,
                  type: "error",
                  duration: 6000,
                });
                res(false);
              }
            });
          });
          if (!supportEncoding) {
            return;
          }
          concatArr.push(...videoList);
        }
        if (concatArr.length) {
          try {
            const downloads = [];
            for (let i = 0; i < MAX_CONCURRENT_DOWNLOADS; i++) {
              const item = concatArr.shift();
              downloads.push(downloadFile(item, concatArr, data));
            }
            const resolves = await Promise.all(downloads);
            const downloadFailedNum = resolves.flat().filter((item) => !item).length;
            // 等待表情文件下载完成后再创建贴纸数据文件
            const folderPath = join(config.localEmoticons.localPath, data.result.name);
            const stickerDataPath = join(folderPath, "sticker.json");
            writeFileSync(stickerDataPath, JSON.stringify(stickerData, null, 2));
            if (!downloadFailedNum) {
              settingWindow.webContents.send("LiteLoader.lite_tools.onDownloadTgStickerEvent", {
                message: `${data.result.title} 下载完成`,
                type: "success",
                duration: 6000,
              });
            } else {
              settingWindow.webContents.send("LiteLoader.lite_tools.onDownloadTgStickerEvent", {
                message: `${data.result.title} 下载结束，${downloadFailedNum} 个贴纸下载失败`,
                type: "default",
                duration: 6000,
              });
            }
          } catch (err) {
            log("下载出错", err);
            let message;
            switch (err?.message) {
              case "fetch failed":
                if (config.proxy.enabled) {
                  message = `${data.result.title} 下载失败，网络错误，无法访问Telegram服务器`;
                } else {
                  message = `${data.result.title} 下载失败，网络错误，请尝试添加代理地址`;
                }
                break;
              default:
                message = `${data.result.title} 下载失败，${err?.message}`;
            }
            settingWindow.webContents.send("LiteLoader.lite_tools.onDownloadTgStickerEvent", {
              message,
              type: "error",
              duration: 6000,
            });
          }
        } else {
          if (animatedList.length) {
            settingWindow.webContents.send("LiteLoader.lite_tools.onDownloadTgStickerEvent", {
              message: `无法处理 ${data.result.title} 贴纸包中的 TGS 贴纸`,
              type: "error",
              duration: 6000,
            });
          } else {
            settingWindow.webContents.send("LiteLoader.lite_tools.onDownloadTgStickerEvent", {
              message: `${data.result.title} 没有可下载的贴纸`,
              type: "error",
              duration: 6000,
            });
          }
        }
      } else {
        throw new Error(data?.description);
      }
    } catch (err) {
      log("下载贴纸包失败", err.message, err.stack);
      settingWindow.webContents.send("LiteLoader.lite_tools.onDownloadTgStickerEvent", {
        message: `下载贴纸包时意外退出：${err.message}`,
        type: "error",
        duration: 6000,
      });
    }
  } else {
    settingWindow.webContents.send("LiteLoader.lite_tools.onDownloadTgStickerEvent", {
      message: `输入地址不是 TG 贴纸包`,
      type: "error",
      duration: 6000,
    });
  }
}

async function downloadFile(item, stickerList, data, resolve = []) {
  const fileId = item.file_id;
  const file_unique_id = item.file_unique_id;
  const res = await fetch(`https://api.telegram.org/bot${config.localEmoticons.tgBotToken}/getFile?file_id=${fileId}`);
  const fileData = await res.json();
  const fileRes = await fetch(`https://api.telegram.org/file/bot${config.localEmoticons.tgBotToken}/${fileData.result.file_path}`);
  const arrayBuffer = await fileRes.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const folderPath = join(config.localEmoticons.localPath, data.result.name);
  mkdirSync(folderPath, { recursive: true });
  if (item.is_video) {
    const fileName = `${file_unique_id}.gif`;
    const filePath = join(folderPath, fileName);
    resolve.push(await convertWebmToGif(buffer, filePath));
  } else if (item.is_animated) {
    const fileName = `${file_unique_id}.gif`;
    const filePath = join(folderPath, fileName);
    resolve.push(await convertLottieToGif(buffer, filePath));
  } else {
    const fileName = `${file_unique_id}.png`;
    const filePath = join(folderPath, fileName);
    resolve.push(await convertWebpToPng(buffer, filePath));
  }
  if (stickerList.length) {
    const sticker = stickerList.shift();
    return downloadFile(sticker, stickerList, data, resolve);
  } else {
    return resolve;
  }
}

/**
 * 将webp转换为png
 * @param {Buffer} buffer Webp 二进制文件
 * @param {String} outputPath 保存路径
 * @returns {Boolean}
 */
function convertWebpToPng(buffer, outputPath) {
  return new Promise((res) => {
    Ffmpeg(Readable.from(buffer))
      .on("error", (err) => {
        log("webp 转 png 失败", err.message);
        res(false);
      })
      .on("end", () => {
        log("静图下载完成", outputPath);
        res(true);
      })
      .save(outputPath);
  });
}

/**
 * 将webm转换为gif
 * @param {Buffer} buffer Webm 二进制文件
 * @param {String} outputPath 保存路径
 * @returns {Boolean}
 */
function convertWebmToGif(buffer, outputPath) {
  return new Promise((res) => {
    Ffmpeg(Readable.from(buffer))
      .inputOptions(["-vcodec", "libvpx-vp9"])
      .outputOptions(["-vf", "split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse", "-loop", "0"])
      .on("error", (err) => {
        log("webm 转 gif 失败", err.message);
        res(false);
      })
      .on("end", () => {
        log("动图下载完成", outputPath);
        res(true);
      })
      .save(outputPath);
  });
}

/**
 * 将lottie转换为gif
 * @param {Buffer} buffer Lottie 二进制文件
 * @param {String} outputPath 保存路径
 * @returns {Boolean}
 */
function convertLottieToGif(buffer, outputPath) {
  return new Promise((res, rej) => {
    const exePath = config.localEmoticons.tgsToGifPath;
    const convertStdin = spawn(exePath, [outputPath]);
    const inputStream = Readable.from(buffer);
    convertStdin.stderr.on("data", (err) => {
      log("Lottie 转 Gif 出错:", err.toString());
      const errbuffer = zlib.gunzipSync(buffer);
      log(outputPath, "出错数据：", errbuffer.toString());
      res(false);
    });
    convertStdin.on("close", (code) => {
      if (code === 0) {
        log("Lottie 转 Gif 完成", outputPath);
      } else {
        log(outputPath, "Lottie 转 Gif 非正常退出", code);
      }
      res(true);
    });
    convertStdin.on("error", (code) => {
      console.log(code);
      rej(new Error("TGS 转 GIF 出错，请检查 tgs_to_gif 路径是否填写正确"));
    });
    inputStream.pipe(convertStdin.stdin);
  });
}

ipcMain.on("LiteLoader.lite_tools.downloadTgSticker", (_, url) => {
  setPauseWatch(true);
  getTgSticker(url).finally(() => {
    setPauseWatch(false);
    folderUpdate();
  });
});
