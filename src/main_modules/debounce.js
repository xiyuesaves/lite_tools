/**
 * 防抖函数
 * @param {Function} fn 需要防抖的函数
 * @param {Number} time 等待时间
 * @returns
 */
function debounce(fn, time) {
  let timer = null;
  return function (...args) {
    timer && clearTimeout(timer);
    timer = setTimeout(() => {
      fn.apply(this, args);
    }, time);
  };
}
export { debounce };
