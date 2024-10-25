import { existsSync, writeFileSync, readFileSync, unlinkSync } from "fs";
import { stat, watch, readdir } from "fs/promises";
import { ipcMain } from "electron";
import { normalize, join, extname, basename, parse, dirname } from "path";
import { createHash } from "crypto";
import { config, loadConfigPath, onUpdateConfig } from "./config.js";
import { globalBroadcast } from "./globalBroadcast.js";
import { debounce } from "./debounce.js";
/**
 * 配置模板
 */
const localEmoticonsConfigTemplate = require("../config/localEmoticonsConfigTemplate.json");

import { Logs } from "./logs.js";
import { AsyncLock } from "./AsyncLock.js";
const log = new Logs("本地表情模块");

/**
 * 临时阻止监听事件
 */
let pauseWatch = false;

/**
 * 本地表情配置文件
 */
let localEmoticonsConfig;
/**
 * 本地表情配置文件路径
 */
let localEmoticonsConfigPath;
/**
 * 表情分组列表
 */
let emoticonsList = [];
/**
 * 文件监听函数信号
 * @type {AbortController[]}
 */
let signals = new Map();
/**
 * 加载文件夹路径
 */
let localPath = null;

/**
 * 本地表情常用表情数量
 */
let oldCommonlyNum = -1;

/**
 * 本地表情列表副本
 */
let emoticonsListHash;

/**
 * 异步锁
 */
const loadEmoticonsLock = new AsyncLock();

/**
 * 广播表情列表更新添加防抖
 */
function updateEmoticonList() {
  try {
    const newHash = calculateHash(JSON.stringify(emoticonsList));
    if (emoticonsListHash === newHash) {
      log("列表没有变化，无需更新");
      return;
    }
    log("广播本地表情列表更新");
    emoticonsListHash = newHash;
    // 将所有的图片路径放入Set
    const newPaths = new Set(
      emoticonsList.flatMap((emoticons) => {
        return emoticons.list.map((item) => item.path);
      }),
    );
    // 如果没有启用历史表情
    log("平铺所有表情文件路径", newPaths.size);
    localEmoticonsConfig.commonlyEmoticons = localEmoticonsConfig.commonlyEmoticons.filter((path) => {
      // log("过滤历史表情", path, newPaths.has(path));
      return newPaths.has(path);
    });
    log("广播表情列表", emoticonsList.length);
    globalBroadcast("LiteLoader.lite_tools.updateEmoticons", emoticonsList);
    log("广播常用表情列表", localEmoticonsConfig);
    globalBroadcast("LiteLoader.lite_tools.updateLocalEmoticonsConfig", localEmoticonsConfig);
    log("更新常用表情本地文件", localEmoticonsConfigPath, localEmoticonsConfig);
    writeFileSync(localEmoticonsConfigPath, JSON.stringify(localEmoticonsConfig, null, 4));
    log("广播本地表情列表更新-完成");
  } catch (err) {
    log("广播本地表情列表失败", err);
  }
}

onUpdateConfig(async () => {
  // 初始化配置文件
  const newLocalEmoticonsConfigPath = join(loadConfigPath, "localEmoticonsConfig.json");
  if (localEmoticonsConfigPath !== newLocalEmoticonsConfigPath) {
    localEmoticonsConfigPath = newLocalEmoticonsConfigPath;
    if (!existsSync(localEmoticonsConfigPath)) {
      log("初始化常用表情列表", localEmoticonsConfigPath, localEmoticonsConfigTemplate);
      writeFileSync(localEmoticonsConfigPath, JSON.stringify(localEmoticonsConfigTemplate, null, 4));
    }
    localEmoticonsConfig = require(localEmoticonsConfigPath);
    log("读取常用表情列表数据", localEmoticonsConfigPath, localEmoticonsConfig);
    if (!localEmoticonsConfig.recentFolders) {
      localEmoticonsConfig.recentFolders = [];
    }
  }

  // 动态更新本地表情文件夹
  if (config.localEmoticons.enabled && config.localEmoticons.localPath) {
    if (localPath !== config.localEmoticons.localPath) {
      log("本地表情文件夹路径更新", localPath, config.localEmoticons.localPath);
      if (localPath !== null) {
        resetCommonlyEmoticons();
      }
      localPath = config.localEmoticons.localPath;
      log("读取目标文件夹", config.localEmoticons.localPath);
      const execute = await loadEmoticonsLock.execute(async () => {
        // 在更新列表前先停止对所有文件夹的监听事件
        abortAllWatchers();
        emoticonsList = await loadFolder(config.localEmoticons.localPath);
        log("读取目标文件夹-完成", emoticonsList);
      });
      if (execute) {
        updateEmoticonList();
      }
    }
  } else if (localPath) {
    log("功能关闭");
    localPath = null;
    emoticonsListHash = null;
    emoticonsList = [];
    abortAllWatchers();
  }

  // 如果没有启用历史表情，或者关闭了历史表情，则清除数据
  if (!config.localEmoticons.commonlyEmoticons && localEmoticonsConfig.commonlyEmoticons.length) {
    resetCommonlyEmoticons();
  }

  // 动态更新历史表情数量限制
  if (oldCommonlyNum === -1) {
    oldCommonlyNum = config.localEmoticons.commonlyNum;
  }
  if (config.localEmoticons.commonlyNum !== oldCommonlyNum) {
    if (config.localEmoticons.commonlyNum < oldCommonlyNum) {
      localEmoticonsConfig.commonlyEmoticons = localEmoticonsConfig.commonlyEmoticons.splice(0, config.localEmoticons.commonlyNum);
      globalBroadcast("LiteLoader.lite_tools.updateLocalEmoticonsConfig", localEmoticonsConfig);
      log("更新常用表情本地文件", localEmoticonsConfigPath, localEmoticonsConfig);
      writeFileSync(localEmoticonsConfigPath, JSON.stringify(localEmoticonsConfig, null, 4));
    }
    oldCommonlyNum = config.localEmoticons.commonlyNum;
  }

  // 动态更新最近使用分组的数量
  if (config.localEmoticons.recentlyNum >= 0 && localEmoticonsConfig.recentFolders.length > config.localEmoticons.recentlyNum) {
    localEmoticonsConfig.recentFolders = localEmoticonsConfig.recentFolders.slice(0, config.localEmoticons.recentlyNum);
    globalBroadcast("LiteLoader.lite_tools.updateEmoticons", emoticonsList);
    log("更新最近使用分组数量", localEmoticonsConfigPath, localEmoticonsConfig);
    writeFileSync(localEmoticonsConfigPath, JSON.stringify(localEmoticonsConfig, null, 4));
  }
});

// 文件监听函数，添加防抖
const folderUpdate = debounce(async () => {
  const execute = await loadEmoticonsLock.execute(async () => {
    // 在更新列表前先停止对所有文件夹的监听事件
    abortAllWatchers();
    emoticonsList = await loadFolder(config.localEmoticons.localPath);
  });
  if (execute) {
    updateEmoticonList();
  } else {
    log("读取失败，跳过更新");
  }
}, 50);

function abortAllWatchers() {
  if (!signals.size) {
    return;
  }
  signals.forEach((signal) => {
    signal.abort();
  });
  signals.clear();
  log("已取消所有监听");
}

/**
 * 批量监听文件夹变动
 * @param {String} String 文件夹路径
 */
async function addWatchFolders(path) {
  if (!signals.has(path)) {
    log("添加监听", path);
    const signal = new AbortController();
    signals.set(path, signal);
    const watcher = watch(path, { signal: signal.signal });
    for await (const event of watcher) {
      // 临时阻止更新本地表情数据
      if (pauseWatch) {
        log("临时阻止更新事件");
        continue;
      }
      log("检测到文件夹更新", path, event);
      folderUpdate();
    }
  } else {
    log("无需重复监听", path);
  }
}

/**
 * 异步加载文件夹及其内容到列表中。
 *
 * @param {string} folderPath - 要加载的文件夹的路径。
 * @param {number} [itemIndex=0] - 列表中项目的起始索引。
 * @return {Promise<Array>} 一个解析为表示文件夹及其内容的对象数组的 Promise。
 */
async function loadFolder(folderPath, itemIndex = 0) {
  const list = [];
  const thisItemIndex = itemIndex;
  let nextItemIndex = itemIndex;
  if (existsSync(folderPath)) {
    addWatchFolders(folderPath);
    // 异步io操作
    const files = await readdir(folderPath).catch(() => []);
    let listIndex = 0;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const filePath = normalize(join(folderPath, file));
      const fileStat = await stat(filePath).catch(() => null);
      if (fileStat) {
        if (fileStat.isFile()) {
          if (![".png", ".jpg", ".jpeg", ".gif", ".webp"].includes(extname(filePath).toLocaleLowerCase())) {
            continue;
          }
          // 如果id不一致则初始化一个新的表情对象
          const id = calculateHash(folderPath);
          if (!list[0] || list[0].id !== id) {
            list.unshift({
              id,
              name: basename(folderPath),
              folderPath,
              index: thisItemIndex,
              path: folderPath,
              list: [],
            });
            const stickerDataPath = join(folderPath, "sticker.json");
            if (existsSync(stickerDataPath)) {
              try {
                const data = JSON.parse(readFileSync(stickerDataPath, "utf-8"));
                if (data.title) {
                  list[0].name = data.title;
                }
                if (data.icon) {
                  const iconPath = join(folderPath, data.icon);
                  if (existsSync(iconPath)) {
                    list[0].icon = iconPath;
                  }
                }
              } catch (err) {
                log("贴图集配置文件读取失败", err);
              }
            }
          }
          const name = parse(filePath).name;
          if (name === "icon") {
            list[0].icon = filePath;
          } else {
            list[0].list.push({
              name,
              path: filePath,
              index: listIndex,
              birthtimeMs: fileStat.birthtimeMs,
            });
            listIndex++;
          }
        } else if (fileStat.isDirectory()) {
          nextItemIndex++;
          list.push(...(await loadFolder(filePath, nextItemIndex)));
        }
      }
    }
    // 调整排序方式为创建时间递减
    if (config.localEmoticons.timeSort) {
      list.forEach((item) => {
        item.list.sort((a, b) => b.birthtimeMs - a.birthtimeMs);
        item.list.forEach((item, index) => {
          item.index = index;
        });
      });
    }
  }
  return list;
}

/**
 * 重置常用表情列表
 */
function resetCommonlyEmoticons() {
  localEmoticonsConfig.commonlyEmoticons = [];
  globalBroadcast("LiteLoader.lite_tools.updateLocalEmoticonsConfig", localEmoticonsConfig);
  log("重置常用表情列表", localEmoticonsConfigPath, localEmoticonsConfig);
  writeFileSync(localEmoticonsConfigPath, JSON.stringify(localEmoticonsConfig, null, 4));
}

// 返回本地表情包数据
ipcMain.handle("LiteLoader.lite_tools.getLocalEmoticonsList", () => {
  log("返回本地表情包数据");
  return emoticonsList;
});

// 返回常用表情包数据
ipcMain.handle("LiteLoader.lite_tools.getLocalEmoticonsConfig", () => {
  log("返回常用表情列表", localEmoticonsConfig);
  return localEmoticonsConfig;
});

// 更新常用表情列表
ipcMain.on("LiteLoader.lite_tools.addCommonlyEmoticons", (_, src) => {
  if (!config.localEmoticons.commonlyEmoticons) {
    return;
  }
  const newSet = new Set(localEmoticonsConfig.commonlyEmoticons);
  // 如果已经有这个表情了，则更新位置
  newSet.delete(src);
  localEmoticonsConfig.commonlyEmoticons = Array.from(newSet);
  localEmoticonsConfig.commonlyEmoticons.unshift(src);
  // 删除多余的值
  if (localEmoticonsConfig.commonlyEmoticons.length > config.localEmoticons.commonlyNum) {
    localEmoticonsConfig.commonlyEmoticons.pop();
  }
  globalBroadcast("LiteLoader.lite_tools.updateLocalEmoticonsConfig", localEmoticonsConfig);
  log("常用表情列表", localEmoticonsConfigPath, localEmoticonsConfig);
  writeFileSync(localEmoticonsConfigPath, JSON.stringify(localEmoticonsConfig, null, 4));
});

// 更新最近使用分组
ipcMain.on("LiteLoader.lite_tools.updateRecentFolders", (_, src) => {
  // 固定当前排序
  if (config.localEmoticons.recentlyNum === -2) {
    return;
  }

  // 更新recentFolders
  const folderPath = dirname(src);

  // 删除不存在的路径
  localEmoticonsConfig.recentFolders = localEmoticonsConfig.recentFolders.filter((path) => {
    const exists = existsSync(path);
    if (!exists) {
      log(`路径不存在，已移除: ${path}`);
    }
    return exists;
  });

  const index = localEmoticonsConfig.recentFolders.indexOf(folderPath);
  if (index !== -1) {
    localEmoticonsConfig.recentFolders.splice(index, 1);
  }
  localEmoticonsConfig.recentFolders.unshift(folderPath);

  // 删除多余的值
  const maxRecentFolders = config.localEmoticons.recentlyNum;
  if (maxRecentFolders >= 0 && localEmoticonsConfig.recentFolders.length > maxRecentFolders) {
    localEmoticonsConfig.recentFolders = localEmoticonsConfig.recentFolders.slice(0, maxRecentFolders);
  }

  log("最近使用分组", localEmoticonsConfigPath, localEmoticonsConfig);
  writeFileSync(localEmoticonsConfigPath, JSON.stringify(localEmoticonsConfig, null, 4));
});

// 从历史记录中移除指定文件
ipcMain.on("LiteLoader.lite_tools.deleteCommonlyEmoticons", (_, localPath) => {
  const newSet = new Set(localEmoticonsConfig.commonlyEmoticons);
  // 如果已经有这个表情了，则更新位置
  newSet.delete(localPath);
  localEmoticonsConfig.commonlyEmoticons = Array.from(newSet);
  globalBroadcast("LiteLoader.lite_tools.updateLocalEmoticonsConfig", localEmoticonsConfig);
  log("从常用表情中移除", localEmoticonsConfigPath, localPath, localEmoticonsConfig);
  writeFileSync(localEmoticonsConfigPath, JSON.stringify(localEmoticonsConfig, null, 4));
});

// 设为分组图标
ipcMain.on("LiteLoader.lite_tools.setEmoticonsIcon", (_, localPath) => {
  const stickerDataPath = join(dirname(localPath), "sticker.json");
  const newIconValue = basename(localPath);
  if (existsSync(stickerDataPath)) {
    try {
      const data = JSON.parse(readFileSync(stickerDataPath, "utf-8"));
      data.icon = newIconValue;
      writeFileSync(stickerDataPath, JSON.stringify(data, null, 2));
    } catch (err) {
      log("更新sticker.json失败", err);
    }
  } else {
    const newStickerData = {
      icon: newIconValue,
    };
    try {
      writeFileSync(stickerDataPath, JSON.stringify(newStickerData, null, 2));
    } catch (err) {
      log("创建sticker.json失败", err);
    }
  }
  // 如果当前暂停了文件监听，则主动发送更新事件
  if (pauseWatch) {
    globalBroadcast("LiteLoader.lite_tools.updateLocalEmoticonsConfig", localEmoticonsConfig);
  }
});

// 重命名分组
ipcMain.on("LiteLoader.lite_tools.renameEmoticons", (_, localPath, title) => {
  const stickerDataPath = join(localPath, "sticker.json");
  log("重命名分组", stickerDataPath, title);
  if (existsSync(stickerDataPath)) {
    try {
      const data = JSON.parse(readFileSync(stickerDataPath, "utf-8"));
      data.title = title;
      writeFileSync(stickerDataPath, JSON.stringify(data, null, 2));
      log("更新成功", data);
    } catch (err) {
      log("更新sticker.json失败", err);
    }
  } else {
    log("目标没有sticker.json", localPath, title);
    const newStickerData = {
      title: title,
    };
    try {
      writeFileSync(stickerDataPath, JSON.stringify(newStickerData, null, 2));
      log("更新成功", newStickerData);
    } catch (err) {
      log("创建sticker.json失败", err);
    }
  }
  // 如果当前暂停了文件监听，则主动发送更新事件 - 不需要，文件名前端更新即可
  // if (pauseWatch) {
  //   globalBroadcast("LiteLoader.lite_tools.updateLocalEmoticonsConfig", localEmoticonsConfig);
  // }
});

// 删除指定文件
ipcMain.handle("LiteLoader.lite_tools.deleteEmoticonsFile", async (_, path) => {
  log("删除表情文件", path);
  if (existsSync(path)) {
    // 验证要删除的文件目录是否在本地表情指定目录中
    if (path.startsWith(config.localEmoticons.localPath)) {
      try {
        unlinkSync(path);
        return {
          success: true,
          msg: "删除成功",
        };
      } catch (err) {
        log("没有权限", err);
        return {
          success: false,
          msg: "没有权限",
        };
      }
    } else {
      return {
        success: false,
        msg: "路径错误",
      };
    }
  } else {
    return {
      success: false,
      msg: "文件不存在",
    };
  }
});

/**
 * 使用指定的算法计算给定字符串的哈希值。
 *
 * @param {string} str - 要计算哈希值的字符串。
 * @param {string} [algorithm="md5"] - 用于哈希的算法。默认为“md5”。
 * @return {string}
 */
function calculateHash(str) {
  const hash = createHash("md5");
  hash.update(str);
  return hash.digest("hex");
}

function setPauseWatch(pause) {
  log("更新pause状态", pause);
  pauseWatch = pause;
}

export { folderUpdate, setPauseWatch };
