/**
 * 递归赋值模块-用于合并配置文件避免错误
 * @param {Object} fileOptions 从文件加载的配置
 * @param {Object} defaultOptions 默认配置
 * @returns {Object} 两个配置合并后的实际配置文件
 */
function recursiveAssignment(fileOptions, defaultOptions) {
  if (!fileOptions || Object.prototype.toString.call(fileOptions) !== "[object Object]") {
    return defaultOptions;
  }
  let obj = {};
  for (const key in defaultOptions) {
    if (Object.hasOwnProperty.call(defaultOptions, key)) {
      // 如果是全局属性则直接覆盖配置文件
      if (key === "global") {
        obj[key] = defaultOptions[key];
        continue;
      }
      // 如果键值是对象则递归处理
      if (Object.prototype.toString.call(defaultOptions[key]) === "[object Object]") {
        obj[key] = recursiveAssignment(fileOptions[key], defaultOptions[key]);
        continue;
      }
      // 判断两者同一个键的数据类型是否一致
      if (Object.prototype.toString.call(fileOptions[key]) === Object.prototype.toString.call(defaultOptions[key])) {
        obj[key] = fileOptions[key];
      } else {
        obj[key] = defaultOptions[key];
      }
    }
  }
  return obj;
}

export { recursiveAssignment };
