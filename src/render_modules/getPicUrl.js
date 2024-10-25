import { options } from "./options.js";
export async function getPicUrl(picData, chatType) {
  let picURL = "";
  if (picData.originImageUrl.startsWith("/download?")) {
    if (picData.originImageUrl.includes("&rkey=")) {
      return `${options.global.IMAGE_HTTP_HOST_NT}${picData.originImageUrl}`;
    } else {
      const rkey = await lite_tools.getRkey(chatType);
      picURL = `${options.global.IMAGE_HTTP_HOST_NT}${picData.originImageUrl}${rkey}`;
    }
  } else {
    picURL = `${options.global.IMAGE_HTTP_HOST}${picData.originImageUrl}`;
  }
  return picURL;
}
