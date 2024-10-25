import { basename, join } from "path";
import { writeFileSync, readFileSync } from "fs";
import { Logs } from "./logs.js";
const log = new Logs("本地撤回数据实例");
import superjson from "superjson";

/**
 * 撤回消息切片管理
 */
class MessageRecallList {
  constructor(messageRecallJson, messageRecallPath = false, limit = 0) {
    log(`新的历史记录实例，目标文件 ${basename(messageRecallJson)} 实例状态 ${messageRecallPath ? "读写" : "只读"} 切片大小 ${limit}`);
    this.limit = limit;
    this.messageRecallPath = messageRecallPath;
    this.latestPath = messageRecallJson;
    this.newFileEvent = new Set();
    this.newRecallMsgEvent = new Set();

    // 针对不同版本的本地撤回文件进行统一化处理
    const stringData = readFileSync(this.latestPath, "utf-8");
    try {
      const rawData = Buffer.from(stringData, "base64").toString("utf-8");
      const jsonParse = JSON.parse(rawData);
      if (jsonParse.json) {
        this.map = superjson.parse(rawData);
      } else {
        this.map = new Map(jsonParse);
        this.saveFile();
      }
    } catch {
      this.map = new Map(JSON.parse(stringData));
      this.saveFile();
    }
  }
  set(key, value) {
    if (this.messageRecallPath) {
      this.map.set(key, value);
      if (this.map.size >= this.limit) {
        log("缓存撤回消息超过阈值，开始切片");
        const sliceTime = new Date().getTime();
        const newFileName = `${sliceTime}.json`;
        const filePath = join(this.messageRecallPath, newFileName);
        writeFileSync(filePath, Buffer.from(superjson.stringify(this.map), "utf-8").toString("base64"));
        this.newFileEvent.forEach((callback) => callback(sliceTime));
        this.map = new Map();
      }
      this.saveFile();
      this.newRecallMsgEvent.forEach((callback) => callback(value));
    } else {
      console.error("该实例工作在只读模式");
    }
  }
  saveFile() {
    try {
      writeFileSync(this.latestPath, Buffer.from(superjson.stringify(this.map), "utf-8").toString("base64"));
    } catch (err) {
      console.log("保存撤回数据出错", err);
    }
  }
  onNewRecallMsg(callback) {
    if (this.messageRecallPath) {
      this.newRecallMsgEvent.add(callback);
    } else {
      console.error("该实例工作在只读模式");
    }
  }
  // 如果产生新的切片文件，将会调用该方法传入的回调
  onNewFile(callback) {
    if (this.messageRecallPath) {
      this.newFileEvent.add(callback);
    } else {
      console.error("该实例工作在只读模式");
    }
  }
  get(key) {
    return this.map.get(key);
  }
  has(key) {
    return this.map.has(key);
  }
  delete(key) {
    if (this.messageRecallPath) {
      this.map.delete(key);
    } else {
      console.error("该实例工作在只读模式");
    }
  }
}

export { MessageRecallList };
