import { settingWindow } from "./captureWindow.js";
import { fetch as u_fetch, ProxyAgent, Agent } from "undici";
import { config, updateConfig, onUpdateConfig } from "./config.js";
import { Logs } from "./logs.js";
import { ipcMain } from "electron";
const log = new Logs("updateProxy");

let useProxy;
let dispatcher = new Agent();

onUpdateConfig(() => {
  if (config.proxy.enabled && useProxy !== config.proxy.url) {
    useProxy = config.proxy.url;
    dispatcher = new ProxyAgent(config.proxy.url);
    log("代理已更新", config.proxy.url);
  }
});

ipcMain.on("LiteLoader.lite_tools.checkProxy", () => {
  checkProxy();
});
ipcMain.handle("LiteLoader.lite_tools.applyProxy", async (event, agent) => {
  try {
    const status = await checkProxy(agent);
    if (status) {
      config.proxy.enabled = true;
      config.proxy.url = agent;
      dispatcher = new ProxyAgent(agent);
      log("应用代理成功", agent);
    } else {
      config.proxy.enabled = false;
      config.proxy.url = agent;
      dispatcher = new Agent();
      log("应用代理失败", agent);
    }
    updateConfig(config);
    return status;
  } catch (err) {
    log("应用代理失败", err);
    return false;
  }
});

async function checkProxy(agent) {
  try {
    let res;
    if (agent) {
      log("有代理", agent);
      res = await u_fetch("http://www.google.com/generate_204", {
        dispatcher: new ProxyAgent(agent),
      });
    } else {
      log("无代理");
      res = await u_fetch("http://www.google.com/generate_204");
    }
    if (res.status === 204) {
      log("代理有效");
      settingWindow.webContents.send("LiteLoader.lite_tools.updateProxyStatus", {
        success: true,
        message: "代理有效",
      });
      return true;
    } else {
      log("请求失败", res.status);
      settingWindow.webContents.send("LiteLoader.lite_tools.updateProxyStatus", {
        success: false,
        message: `请求失败 ${res.status}`,
      });
      return false;
    }
  } catch (err) {
    log("代理地址有误", err);
    settingWindow.webContents.send("LiteLoader.lite_tools.updateProxyStatus", {
      success: false,
      message: `请求失败 ${err}`,
    });
    return false;
  }
}
const fetch = async (url, options = {}) => {
  return u_fetch(url, {
    dispatcher,
    ...options,
  });
};

export { fetch };
