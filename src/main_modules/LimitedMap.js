/**
 * 自定义limitMap，在达到指定数量后清空最后一条记录
 */
class LimitedMap {
  constructor(limit) {
    this.limit = limit;
    this.map = new Map();
  }
  set(key, value) {
    // 如果当前map存储消息超过指定大小，则删除最后一条数据
    if (this.map.size >= this.limit) {
      this.deleteOldData();
    }
    this.map.set(key, value);
  }
  get(key) {
    return this.map.get(key);
  }
  has(key) {
    return this.map.has(key);
  }
  toArray() {
    return Array.from(this.map);
  }
  deleteOldData() {
    const array = Array.from(this.map);
    const arrayLength = array.length;
    // 每次移除10%
    this.map = new Map(array.splice(0, arrayLength - arrayLength * 0.1));
  }
  delete(key) {
    this.map.delete(key);
  }
}

export { LimitedMap };
