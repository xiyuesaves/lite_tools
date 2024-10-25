/**
 * 节流函数
 * @param {Function} fn 需要节流函数
 * @param {Number} delay 需要等待时间
 * @returns 延迟函数
 */
export function throttle(fn, delay) {
  let timer;
  return function(){
    if(!timer) {
      fn.apply(this, arguments)
      timer = setTimeout(()=>{
        clearTimeout(timer)
        timer = null
      },delay)
    }
  }
}