import { Logs } from "./logs.js";
const log = new Logs("异步锁");

// 异步锁
export class AsyncLock {
  constructor() {
    this.locked = false;
  }
  async execute(asyncFn) {
    if (this.locked) {
      log("上一次操作还没有结束，阻止新的请求");
      return false;
    }
    this.locked = true;
    try {
      await asyncFn();
      return true;
    } catch (error) {
      log(`操作时出错: ${error.message}`);
      return false;
    } finally {
      this.locked = false;
    }
  }
}
