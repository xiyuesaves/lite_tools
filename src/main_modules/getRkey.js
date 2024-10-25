import { Logs } from "./logs.js";
import { config } from "./config.js";
import { fetch } from "./updateProxy.js";
const log = new Logs("getRkey");

let rkey;
export async function getRkey(chatType) {
  log("请求rkey", chatType);
  if (!config.rkeyAPI || !chatType) {
    log("没有配置rkey或没有传入chatType");
    return config.global.rkey;
  }
  if (!rkey || (rkey.expired_time ? rkey.expired_time < Date.now() / 1000 : true)) {
    rkey = await fetchRkey();
    if (!rkey) {
      log("获取rkey失败");
      return config.global.rkey;
    }
  }
  const reqRkey = rkey[chatType];
  log("返回rkey", chatType, reqRkey);
  return reqRkey;
}

/**
 * 从接口中获取 rkey 数据。
 * 支持以下两种数据结构：
 * 1. 直接包含 "private_rkey" 和 "group_rkey" 字段的对象。"expired_time" 参数不是必须的，但建议携带，
 *    rkey 的安全有效期为1小时。
 * 2. 包含在 "data" 字段中，其中包含 "private_rkey" 和 "group_rkey" 字段的对象。
 *
 * @typedef {Object} RkeyData
 * @property {string} private_rkey - 包含 "&rkey=xxxxxx" 的私有 rkey。
 * @property {string} group_rkey - 包含 "&rkey=xxxxxx" 的群组 rkey。
 * @property {number} [expired_time] - 可选，rkey 的过期时间戳，精确到秒。
 *
 * @returns {Promise<string|undefined>} 返回一个 Promise，解析为 rkey 字符串或 undefined。
 */
async function fetchRkey() {
  try {
    log("正在更新rkey", config.rkeyAPI);
    const respone = await fetch(config.rkeyAPI).then((res) => res.json());
    // 适配两种接口返回值
    const newRkey = respone?.data?.private_rkey ? respone.data : respone;
    if (typeof newRkey.group_rkey === "string" && typeof newRkey.private_rkey === "string") {
      rkey = newRkey;
      log("成功更新rkey", rkey);
    } else {
      log("数据返回格式错误", newRkey);
      return undefined;
    }
    return rkey;
  } catch (err) {
    log("获取rkey失败", err);
    return undefined;
  }
}
