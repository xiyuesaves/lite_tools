import { ipcMain } from "electron";
import { fetch } from "./updateProxy.js";
import { globalBroadcast } from "./globalBroadcast.js";
import { config, onUpdateConfig } from "./config.js";
import { getTweetWebMeta, isValidTwitterPostUrl, isTwitterProfileUrl, getTwitterUserInfoWebMeta } from "./getTwitterWebPreview.js";
import { get } from "./getWeb.js";
import { Logs } from "./logs.js";
const log = new Logs("链接预览");

// 把缓存逻辑移到这里，好让所有页面共用
// 缓存200条url预览数据，因为增加了图片数据，为了避免内存占用过多所以只缓存200条
const MAX_CACHE_SIZE = 200;
let previewCatch = new Map();
let dontLoadPic;

onUpdateConfig(() => {
  if (dontLoadPic !== config.message.previreUrl.dontLoadPic) {
    previewCatch = new Map();
  }
  dontLoadPic = config.message.previreUrl.dontLoadPic;
});

/**
 * 从给定的URL获取元数据（如果是HTML页面）。
 *
 * @param {string} url - 要从中检索元数据的URL。
 * @return {Promise<Object>} 包含成功状态和检索到的元数据的对象。
 *                           如果URL不是HTML页面，则成功状态将为false，并提供错误消息。
 */
async function getMeatData(url) {
  const res = await get(url);
  if (!res.success) {
    return res;
  }
  const metaTags = res.data.match(/<meta[^>]+>/g);
  if (!(metaTags && metaTags.length)) {
    return {
      success: false,
      err: "没有找到meta数据",
    };
  }
  const meta = {};
  metaTags.forEach((tag) => {
    const name = tag.match(/name=["']([^"']+)["']/) || tag.match(/<title>([^<]+)<\/title>/);
    const content = tag.match(/content=["']([^"']+)["']/);
    const property = tag.match(/property=["']([^"']+)["']/);
    if (((name && name.length) || (property && property.length)) && content && content.length) {
      meta[name?.[1] ?? property?.[1]] = content[1];
    }
  });
  const urlObj = new URL(url);
  meta.url = urlObj.host.replace(/^www\./, "").replace(/^.{1}/, (str) => str.toUpperCase());
  log("获取到元数据", meta);
  return {
    success: true,
    data: meta,
  };
}

/**
 * 获取指定 URL 的网页预览数据。
 *
 * @param {string} url - 要获取网页预览数据的 URL。
 * @return {Promise<Object>} - 一个解析为包含网页预览数据的对象的 Promise。
 *                           该对象具有以下属性：
 *                           - success: 一个布尔值，表示获取是否成功。
 *                           - data: 一个包含网页预览数据的对象，包括：
 *                                - title: 网页标题。
 *                                - imageUrl: 要作为预览显示的图像的 URL。
 *                                - image: 图像的 base64 编码字符串。
 *                                - alt: 图像的替代文本。
 *                                - description: 网页的描述。
 *                                - site_name: 网站的名称。
 *                           - err: 如果获取不成功，则为错误消息。
 */
async function getWebPrevew(url) {
  log("获取预览数据", url);
  try {
    let standardData = previewCatch.get(url);
    if (!standardData) {
      let webMeta = {
        success: false,
        err: "没有找到预览数据",
      };
      if (isValidTwitterPostUrl(url)) {
        webMeta = await getTweetWebMeta(url);
      } else if (isTwitterProfileUrl(url)) {
        webMeta = await getTwitterUserInfoWebMeta(url);
      } else {
        webMeta = await getMeatData(url);
      }
      if (!webMeta.success) {
        return webMeta;
      }
      standardData = {
        url,
        title: webMeta.data["og:title"] || webMeta.data["twitter:title"] || webMeta.data["title"],
        imageUrl: (
          webMeta.data["og:image"] ||
          webMeta.data["twitter:image:src"] ||
          webMeta.data["twitter:image"] ||
          webMeta.data["image"]
        )?.replace(/^(http:\/\/|https:\/\/|\/\/)?/, "https://"),
        alt: webMeta.data["og:image:alt"] || webMeta.data["twitter:description"] || webMeta.data["description"],
        description: webMeta.data["og:description"] || webMeta.data["twitter:description"] || webMeta.data["description"],
        site_name: webMeta.data["og:site_name"] || webMeta.data["twitter:site"] || webMeta.data["url"],
      };
      if (standardData.imageUrl && !config.message.previreUrl.dontLoadPic) {
        standardData.image = await imageUrlToBase64(standardData.imageUrl);
      }
      previewCatch.set(url, standardData);
      // 如果超过限制则移除最老的10%数据
      if (previewCatch.size >= MAX_CACHE_SIZE) {
        const array = Array.from(previewCatch);
        const arrayLength = array.length;
        previewCatch = new Map(array.splice(0, arrayLength - arrayLength * 0.1));
      }
      log("查询成功", url, standardData);
    } else {
      log("命中缓存", url, standardData);
    }
    return {
      success: true,
      data: standardData,
    };
  } catch (err) {
    log("出现错误", err, err.stack);
    return {
      success: false,
      err: `代码错误 ${err}`,
    };
  }
}

/**
 * 将图像URL初始化为base64编码的字符串。
 *
 * @param {string} url - 要转换的图像的URL。
 * @return {Promise<string|boolean>} 如果请求成功，则解析为图像的base64编码字符串，如果请求失败，则返回 false。
 */
async function imageUrlToBase64(url) {
  log("获取图像", url);
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "User-Agent": config.global.UA,
      },
    });
    if (response.status === 200) {
      return `data:image/jpeg;base64,${Buffer.from(await response.arrayBuffer()).toString("base64")}`;
    } else {
      return false;
    }
  } catch (err) {
    log("图片请求失败", err);
    return false;
  }
}

/**
 * 获取链接预览信息
 */
ipcMain.on("LiteLoader.lite_tools.getWebPrevew", async (_, msgId, url) => {
  const resData = await getWebPrevew(url);
  globalBroadcast("LiteLoader.lite_tools.onWebPreviewData", msgId, resData);
});
