import { options } from "./options.js";
import { getMembersAvatar } from "./nativeCall.js";
import { showToast } from "./toast.js";
import { Logs } from "./logs.js";
const log = new Logs("消息转图片");

/**
 * 生成表情
 * @param {Object} config 表情配置
 */
export async function createSticker(config) {
  let zoom = 1;
  const msgBoxMaxWidth = 340;
  const userAvatarMap = await getMembersAvatar([config.userUid]);
  const userAvatar = userAvatarMap.get(config.userUid);
  const canvasEl = document.createElement("canvas");
  const ctx = canvasEl.getContext("2d");
  const img = await new Promise((res) => {
    const image = new Image();
    image.onload = () => res(image);
    image.onerror = () => log("出错");
    image.src = "local:///" + userAvatar;
  });
  // 高清化
  if (options.qContextMenu.messageToImage.highResolution) {
    zoom = 2;
  }

  // 计算消息气泡尺寸
  ctx.save();
  ctx.font = 14 + "px " + config.fontFamily;
  const contents = config.content.split("\n");
  let width = 0;
  let height = 0;
  for (let i = 0; i < contents.length; i++) {
    const content = contents[i];
    const msgBoxSIze = ctx.measureText(content);
    const calculateWidth = msgBoxSIze.width;
    const tempWidth = calculateWidth <= msgBoxMaxWidth ? calculateWidth : msgBoxMaxWidth;
    width = tempWidth > width ? tempWidth : width;
    height += Math.ceil(calculateWidth / msgBoxMaxWidth + 0.01) * 20;
  }
  ctx.restore();

  let userNameColor = "#999999";
  let msgBoxColor = "#ffffff";
  let contextColor = "#333333";
  if (app.__vue_app__.config.globalProperties.$store.state.common_AppearanceModeSetting.isDark) {
    userNameColor = "#808080";
    msgBoxColor = "#262626";
    contextColor = "#f2f2f2";
  }

  // 测量用户id长度
  ctx.save();
  ctx.font = 12 + "px " + config.fontFamily;
  const textMetrics = ctx.measureText(config.userName);
  const userNameWidth = textMetrics.width + 42 + 4;
  ctx.restore();
  let canWidth = 4 + 32 + 10 + width + 20;
  if (userNameWidth > canWidth) {
    canWidth = userNameWidth;
  }
  // 设置画布大小
  canvasEl.width = canWidth * zoom;
  canvasEl.height = (20 + height + 16) * zoom;
  // 绘制圆形头像
  ctx.save();
  ctx.beginPath();
  ctx.arc(20 * zoom, 20 * zoom, 16 * zoom, 0, Math.PI * 2, false);
  ctx.clip(); //剪切路径
  ctx.drawImage(img, 4 * zoom, 4 * zoom, 32 * zoom, 32 * zoom);
  ctx.restore();
  // 绘制用户名
  ctx.save();
  ctx.font = 12 * zoom + "px " + config.fontFamily;
  ctx.fillStyle = userNameColor;
  ctx.fillText(config.userName, 42 * zoom, 14 * zoom);
  ctx.restore();
  // 绘制气泡框
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(42 * zoom, 20 * zoom, (width + 20) * zoom, (height + 12) * zoom, 8 * zoom);
  ctx.fillStyle = msgBoxColor;
  ctx.fill();
  ctx.restore();
  // 绘制文本
  ctx.save();
  ctx.fillStyle = contextColor;
  ctx.font = 14 * zoom + "px " + config.fontFamily;
  ctx.wrapText(config.content, 52 * zoom, 40 * zoom, width * zoom, 20 * zoom);
  ctx.restore();
  const base64 = canvasEl.toDataURL("image/png", 1);
  lite_tools.saveBase64ToFile(`${new Date().getTime()}.png`, base64);
  showToast("生成成功", "success", 3000);
}
