/* eslint-disable */
/**
 * 防抖
 * @param {Function} func
 * @param {number} wait 等待时间
 * @param {boolean} immediate 立即调用
 * @return {*}
 */
export function debounce(func, wait, immediate) {
  let timeout, args, context, timestamp, result

  const later = function() {
    // 据上一次触发时间间隔
    const last = +new Date() - timestamp

    // 上次被包装函数被调用时间间隔 last 小于设定时间间隔 wait
    if (last < wait && last > 0) {
      timeout = setTimeout(later, wait - last)
    } else {
      timeout = null
      // 如果设定为immediate===true，因为开始边界已经调用过了此处无需调用
      if (!immediate) {
        result = func.apply(context, args)
        if (!timeout) context = args = null
      }
    }
  }

  return function(...args) {
    context = this
    timestamp = +new Date()
    const callNow = immediate && !timeout
    // 如果延时不存在，重新设定延时
    if (!timeout) timeout = setTimeout(later, wait)
    if (callNow) {
      result = func.apply(context, args)
      context = args = null
    }

    return result
  }
}


/**
 *
 * @param {Function} method 方法
 * @param {*} wait 时间间隔
 * @param {*} leading 立即执行
 * @param {*} trailing 后置执行
 */
function throttle(method, wait, {leading = true, trailing = true} = {}) {
  let timeout, result
  let methodPrevious = 0
  // 记录上次回调触发时间（每次都更新）
  let throttledPrevious = 0
  let throttled =  function(...args) {
    let context = this
    return new Promise(resolve => {
      let now = new Date().getTime()
      // 两次触发的间隔
      let interval = now - throttledPrevious
      // 更新本次触发时间供下次使用
      throttledPrevious = now
      // 更改条件，两次间隔时间大于wait且leading为false时也重置methodPrevious，实现禁止立即执行
      if (leading === false && (!methodPrevious || interval > wait)) {
        methodPrevious = now
      }
      let remaining = wait - (now - methodPrevious)
      if (remaining <= 0 || remaining > wait) {
        if (timeout) {
          clearTimeout(timeout)
          timeout = null
        }
        methodPrevious = now
        result = method.apply(context, args)
        resolve(result)
        // 解除引用，防止内存泄漏
        if (!timeout) context = args = null
      } else if (!timeout && trailing !== false) {
        timeout = setTimeout(() => {
          methodPrevious = leading === false ? 0 : new Date().getTime()
          timeout = null
          result = method.apply(context, args)
          resolve(result)
          // 解除引用，防止内存泄漏
          if (!timeout) context = args = null
        }, remaining)
      }
    })
  }

  throttled.cancel = function() {
    clearTimeout(timeout)
    methodPrevious = 0
    timeout = null
  }

  return throttled
}


/**
 * This is just a simple version of deep copy
 * Has a lot of edge cases bug
 * If you want to use a perfect deep copy, use lodash's _.cloneDeep
 * @param {Object} source
 * @returns {Object}
 */
export function deepClone(source) {
  if (!source && typeof source !== 'object') {
    throw new Error('error arguments', 'deepClone')
  }
  const targetObj = source.constructor === Array ? [] : {}
  Object.keys(source).forEach(keys => {
    if (source[keys] && typeof source[keys] === 'object') {
      targetObj[keys] = deepClone(source[keys])
    } else {
      targetObj[keys] = source[keys]
    }
  })
  return targetObj
}

/**
 * @param {Array} arr
 * @returns {Array}
 */
export function uniqueArr(arr) {
  return Array.from(new Set(arr))
}

/**
 * @returns {string}
 */
export function createUniqueString() {
  const timestamp = +new Date() + ''
  const randomNum = parseInt((1 + Math.random()) * 65536) + ''
  return (+(randomNum + timestamp)).toString(32)
}

/**
 * Check if an element has a class
 * @param {HTMLElement} elm
 * @param {string} cls
 * @returns {boolean}
 */
export function hasClass(ele, cls) {
  return !!ele.className.match(new RegExp('(\\s|^)' + cls + '(\\s|$)'))
}

/**
 * Add class to element
 * @param {HTMLElement} elm
 * @param {string} cls
 */
export function addClass(ele, cls) {
  if (!hasClass(ele, cls)) ele.className += ' ' + cls
}

/**
 * Remove class from element
 * @param {HTMLElement} elm
 * @param {string} cls
 */
export function removeClass(ele, cls) {
  if (hasClass(ele, cls)) {
    const reg = new RegExp('(\\s|^)' + cls + '(\\s|$)')
    ele.className = ele.className.replace(reg, ' ')
  }
}
