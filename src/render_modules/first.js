let set = new Set();

/**
 * 首次执行检测，只有第一次执行时返回true
 */
const first = (() => {
  return (tag) => {
    return !set.has(tag) && !!set.add(tag);
  };
})();

/**
 * 重置某个检测键
 * @param {String} key 需要删除的键
 */
function refresh(key) {
  set.delete(key)
}
export { first, refresh };
