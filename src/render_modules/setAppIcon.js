// 设置应用图标为当前聊天对象头像
import { getMembersAvatar, getGroupsAvatar } from "./nativeCall.js";
import { options } from "./options.js";
import { Logs } from "./logs.js";
const log = new Logs("设置应用图标");
const webContentId = lite_tools.getWebContentId() || 2;

// 监听聊天对象变动
import { getPeer, addEventPeerChange } from "./curAioData.js";
// 监听到peer数据后获取群组
addEventPeerChange(getWindowIcon);
const peer = getPeer();
if (peer) {
  getWindowIcon(peer);
}
async function getWindowIcon(peer) {
  if (options.setWindowIcon) {
    let res = null;
    if (peer.chatType === 1) {
      res = await getMembersAvatar([peer.peerUid]);
    } else if (peer.chatType === 2) {
      res = await getGroupsAvatar([peer.peerUid]);
    }
    if (res instanceof Map) {
      const avatar = res.get(peer.peerUid);
      if (avatar) {
        // log("获取到对应聊天头像", res, avatar, webContentId);
        lite_tools.setWindowIcon(avatar, webContentId);
      }
    } else {
      log("获取头像失败", res);
    }
  }
}
