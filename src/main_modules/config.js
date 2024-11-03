import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";

import { join } from "node:path";
import { EventEmitter } from "node:events";
import { ipcMain } from "electron";
// import { globalBroadcast } from "./globalBroadcast.js";
// import { settingWindow } from "./captureWindow.js";
import { BaseConfig } from "./BaseConfig.js";

/**
 * 事件发射器
 * @type {EventEmitter}
 * 事件：update
 */
const configEvent = new EventEmitter();
/**
 * 配置合并模块
 */
import { recursiveAssignment } from "./recursiveAssignment.js";
/**
 * 插件信息
 */
import manifest from "../../manifest.json";
/**
 * 配置模板
 */
import configTemplate from "../config/configTemplate.json";

/**
 * 日志模块
 */
const log = () => {};

/**
 * 用户配置
 * @type {Object} 配置数据
 */
let config = null;

/**
 * 插件配置文件夹路径
 */
const pluginDataPath = LiteLoader.plugins[manifest.slug].path.data;
/**
 * 前置配置文件路径
 */
const baseConfigPath = join(pluginDataPath, "user.json");
/**
 * 当前读取的配置文件夹路径
 */
let configFolder;
/**
 * 当前读取的配置文件路径
 */
let configPath;
/**
 * 初始化配置文件夹
 */
if (!existsSync(pluginDataPath)) {
  mkdirSync(pluginDataPath, { recursive: true });
}
/**
 * 读取用户独立配置
 */
const baseConfig = new BaseConfig(baseConfigPath);
/**
 * 加载用户配置
 * @param {String} userId 根据 userId 来判断读取哪个配置文件
 */
function loadUserConfig(userId) {
  // 获取独立配置文件路径
  const standalonePath = baseConfig.get(userId);
  configFolder = standalonePath ? join(pluginDataPath, standalonePath) : join(pluginDataPath, "default-config");

  log(standalonePath ? "找到独立配置" : "使用默认配置");

  configPath = join(configFolder, "config.json");

  // 初始化配置目录
  if (!existsSync(configFolder)) {
    log("初始化配置目录");
    mkdirSync(configFolder, { recursive: true });
    writeFileSync(configPath, JSON.stringify(configTemplate, null, 2));
  }

  // 读取配置文件
  let userConfig = null;
  try {
    const fileConfig = JSON.parse(readFileSync(configPath, "utf-8"));
    userConfig = recursiveAssignment(fileConfig, configTemplate);
  } catch {
    log("读取配置文件失败，重置为默认配置");
    userConfig = configTemplate;
    writeFileSync(configPath, JSON.stringify(configTemplate, null, 2));
  }

  // 更新配置
  updateConfig(userConfig);
}

/**
 * 更新配置文件
 * @param {Object} newConfig 新的配置文件
 */
function updateConfig(newConfig) {
  log("更新配置文件", configPath);
  configEvent.emit("update", newConfig);
  config = newConfig;
  writeFileSync(configPath, JSON.stringify(newConfig, null, 2));
}

/**
 * 同步返回配置文件
 */
ipcMain.on("LiteLoader.lite_tools.getOptions", (event) => {
  event.returnValue = config;
});

/**
 * 设置插件配置
 */
ipcMain.on("LiteLoader.lite_tools.setOptions", (_, newConfig) => updateConfig(newConfig));

/**
 * 获取用户独立配置
 */
ipcMain.handle("LiteLoader.lite_tools.getUserConfig", () => baseConfig.list);

/**
 * 删除用户独立配置
 */
ipcMain.on("LiteLoader.lite_tools.deleteUserConfig", (_, uid) => baseConfig.delete(uid));

/**
 * 添加用户独立配置
 */
ipcMain.on("LiteLoader.lite_tools.addUserConfig", (_, uid, uin) => baseConfig.set(uid, uin));

export { config, baseConfig, configFolder, loadUserConfig, updateConfig, configEvent };
