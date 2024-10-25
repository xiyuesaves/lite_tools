/**
 * 防抖函数
 * @param {Function} fn 需要防抖函数
 * @param {Number} time 需要等待时间
 * @returns 延迟函数
 */
export function debounce(fn, time) {
  let timer = null;
  return function (...args) {
    timer && clearTimeout(timer);
    timer = setTimeout(() => {
      fn.apply(this, args);
    }, time);
  };
}
