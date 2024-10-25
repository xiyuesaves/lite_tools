/**
 * canvas自动换行实现
 * 来自：https://www.zhangxinxu.com/wordpress/2018/02/canvas-text-break-line-letter-spacing-vertical/
 * @param {String} text
 * @param {Number} x
 * @param {Number} y
 * @param {Number} maxWidth
 * @param {Number} lineHeight
 * @returns
 */
CanvasRenderingContext2D.prototype.wrapText = function (text, x, y, maxWidth, lineHeight) {
  if (typeof text != "string" || typeof x != "number" || typeof y != "number") {
    return;
  }

  const context = this;
  const canvas = context.canvas;

  if (typeof maxWidth == "undefined") {
    maxWidth = (canvas && canvas.width) || 300;
  }
  if (typeof lineHeight == "undefined") {
    lineHeight =
      (canvas && parseInt(window.getComputedStyle(canvas).lineHeight)) || parseInt(window.getComputedStyle(document.body).lineHeight);
  }

  // 字符分隔为数组
  const arrText = text.split("");
  let line = "";
  for (let n = 0; n < arrText.length; n++) {
    let testLine = line;
    if (arrText[n] !== "\n") {
      testLine += arrText[n];
    }
    let metrics = context.measureText(testLine);
    let testWidth = metrics.width;
    if ((testWidth > maxWidth && n > 0) || arrText[n] === "\n") {
      context.fillText(line, x, y);
      if (arrText[n] !== "\n") {
        line = arrText[n];
      } else {
        line = "";
      }
      y += lineHeight;
    } else {
      line = testLine;
    }
  }
  context.fillText(line, x, y);
};
