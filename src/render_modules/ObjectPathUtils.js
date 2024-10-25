/**
 * 根据路径获取对象中的值。
 * @param {Object} target - 要获取值的目标对象。
 * @param {string} path - 以点分隔的路径字符串。
 * @returns {*} - 路径上对应的值，如果路径不存在则返回 undefined。
 *
 *  @example
 * const obj = { a: { b: [{ c: 1 }, { c: 2 }] } };
 * const value = getValueByPath(obj, 'a.b[1].c'); // 2
 *
 * @example
 * const obj = { a: { b: [{ c: 1 }, { c: 2 }] } };
 * const value = getValueByPath(obj, 'a.b[2].c'); // undefined
 */
function getValueByPath(target, path) {
  const pathArr = path.replace(/\[(\d+)\]/g, ".$1").split(".");
  for (let i = 0; i < pathArr.length; i++) {
    if (target[pathArr[i]] !== undefined) {
      target = target[pathArr[i]];
    } else {
      return undefined;
    }
  }
  return target;
}

/**
 * 设置对象指定路径上的值。
 * @param {Object} target - 要设置值的目标对象。
 * @param {string} path - 以点分隔的路径字符串。
 * @param {*} value - 要设置的值。
 * @param {boolean} [createPath=false] - 如果为 true，则在路径不存在时创建它。
 * @param {boolean} [overridePath=false] - 如果为 true，则在路径存在但不是对象时覆盖它。
 * @returns {boolean} - 如果成功设置值，则返回 true；否则返回 false。
 *
 * @example
 * const obj = { a: { b: [{ c: 1 }, { c: 2 }] } };
 * setValueByPath(obj, 'a.b[1].c', 3); // true, obj.a.b[1].c 现在是 3
 *
 * @example
 * const obj = { a: { b: [{ c: 1 }, { c: 2 }] } };
 * setValueByPath(obj, 'a.b[2].d.e', 4, true); // true, obj.a.b[2] 被创建并设置为 { d: { e: 4 } }
 *
 * @example
 * const obj = { a: { b: 1 } };
 * setValueByPath(obj, 'a.b.c', 4, false, true); // true, obj.a.b 被覆盖为对象 { c: 4 }
 *
 * @example
 * const obj = { a: { b: 1 } };
 * setValueByPath(obj, 'a.b.c', 4); // false, 因为 obj.a.b 不是对象且没有设置 overridePath
 */
function setValueByPath(target, path, value, createPath = false, overridePath = false) {
  const keys = path.replace(/\[(\d+)\]/g, ".$1").split(".");
  for (let i = 0; i < keys.length - 1; i++) {
    if ((!target[keys[i]] && createPath) || (!(target[keys[i]] instanceof Object) && overridePath)) {
      target[keys[i]] = {};
    }
    if (!target[keys[i]]) {
      return false;
    }
    target = target[keys[i]];
  }
  target[keys[keys.length - 1]] = value;
  return true;
}

export { getValueByPath, setValueByPath };
