import { Logs } from "./logs.js";
const log = new Logs("QQ通信模块");
const webContentId = lite_tools.getWebContentId() || 2;

log("获取到当前窗口Id", webContentId);

/**
 *
 * @param {Array} message 消息链
 * @returns
 */
async function convertMessage(message) {
  switch (message.type) {
    case "text":
      return {
        elementType: 1,
        elementId: "",
        textElement: {
          content: message.content,
          atType: 0,
          atUid: "",
          atTinyId: "",
          atNtUid: "",
        },
      };
    case "image": {
      const path = message.path;
      const type = await lite_tools.nativeCall("ns-FsApi", "getFileType", [path], webContentId, true, false);
      const md5 = await lite_tools.nativeCall("ns-FsApi", "getFileMd5", [path], webContentId, true, false);
      const fileName = `${md5}.${type.ext}`;
      const filePath = await lite_tools.nativeCall(
        "ns-ntApi",
        "nodeIKernelMsgService/getRichMediaFilePathForGuild",
        [
          {
            path_info: {
              downloadType: 1,
              elementSubType: message.picSubType,
              elementType: 2,
              fileName: fileName,
              file_uuid: "",
              md5HexStr: md5,
              needCreate: true,
              thumbSize: 0,
            },
          },
        ],
        webContentId,
        true,
        false,
      );
      const fileExist = await lite_tools.nativeCall("ns-FsApi", "isFileExist", [filePath], webContentId, true, false);
      log("文件是否存在", fileExist, message);
      if (!fileExist) {
        await lite_tools.nativeCall("ns-FsApi", "copyFile", [{ fromPath: path, toPath: filePath }], webContentId, true, false);
      }
      const imageSize = await lite_tools.nativeCall("ns-FsApi", "getImageSizeFromPath", [path], webContentId, true, false);
      const fileSize = await lite_tools.nativeCall("ns-FsApi", "getFileSize", [path], webContentId, true, false);
      const picElement = {
        md5HexStr: md5,
        fileSize: fileSize,
        picWidth: imageSize.width,
        picHeight: imageSize.height,
        fileName: fileName,
        sourcePath: filePath,
        original: true,
        picType: message.picSubType ? 1002 : 1001,
        picSubType: message.picSubType,
        fileUuid: "",
        fileSubId: "",
        thumbFileSize: 0,
        summary: "",
      };
      const messageChannel = {
        elementType: 2,
        elementId: "",
        picElement,
      };
      if (message.picSubType) {
        messageChannel.extBufForUI = "";
      }
      return messageChannel;
    }
    default:
      return null;
  }
}

/**
 *
 * @param {Peer} peer peer对象
 * @param {Array} messages 消息链
 */
async function sendMessage(peer, messages) {
  log("发送消息", peer, messages);
  lite_tools.nativeCall(
    "ns-ntApi",
    "nodeIKernelMsgService/sendMsg",
    [
      {
        msgId: "0",
        peer: peer,
        msgElements: await Promise.all(messages.map((message) => convertMessage(message))),
        msgAttributeInfos: new Map(),
      },
      null,
    ],
    webContentId,
    false,
    false,
  );
}

/**
 *
 * @param {Peer} peer peer对象
 * @param {msgElements[]} message 原始消息数组
 */
function sendRawMessage(peer, messages) {
  log("发送Raw消息", peer, messages);
  lite_tools.nativeCall(
    "ns-ntApi",
    "nodeIKernelMsgService/sendMsg",
    [
      {
        msgId: "0",
        peer: peer,
        msgElements: messages,
        msgAttributeInfos: new Map(),
      },
      null,
    ],
    webContentId,
    false,
    false,
  );
}

/**
 *
 * @param {Peer} srcpeer 转发消息Peer
 * @param {Peer} dstpeer 目标Peer
 * @param {Array} msgIds 消息Id数组
 */
function forwardMessage(srcpeer, dstpeer, msgIds) {
  log("转发消息", srcpeer, dstpeer, msgIds);
  lite_tools.nativeCall(
    "ns-ntApi",
    "nodeIKernelMsgService/forwardMsgWithComment",
    [
      {
        msgIds,
        msgAttributeInfos: new Map(),
        srcContact: srcpeer,
        dstContacts: [dstpeer],
        commentElements: [],
      },
      null,
    ],
    webContentId,
    false,
    false,
  );
}

/**
 * 获取用户信息
 * @param {String} uid 用户Uid
 * @returns Object
 */
function getUserInfo(uid) {
  return lite_tools.nativeCall(
    "ns-ntApi",
    "nodeIKernelProfileService/getUserDetailInfo",
    [{ uid: uid }, undefined],
    webContentId,
    ["nodeIKernelProfileListener/onProfileDetailInfoChanged", "nodeIKernelProfileListener/onProfileSimpleChanged"],
    false,
  );
}

/**
 * 通过uid获取用户头像
 * @param {String[]} uids 用户uid
 */
function getMembersAvatar(uids) {
  return lite_tools.nativeCall(
    "ns-ntApi",
    "nodeIKernelAvatarService/getMembersAvatarPath",
    [{ clarity: 0, uids }],
    webContentId,
    true,
    false,
  );
}

/**
 * 通过群号获取群组头像
 * @param {String[]} groupCodes 群组id
 */
function getGroupsAvatar(groupCodes) {
  return lite_tools.nativeCall(
    "ns-ntApi",
    "nodeIKernelAvatarService/getGroupsAvatarPath",
    [{ clarity: 0, groupCodes }],
    webContentId,
    true,
    false,
  );
}

/**
 * 跳转到指定群组的指定消息id处
 * @param {Object} sceneData 场景数据
 * @returns
 */
function goMainWindowScene(sceneData) {
  return lite_tools.nativeCall(
    "ns-WindowApi",
    "goMainWindowScene",
    [
      {
        scene: sceneData.scene,
        sceneParams: {
          peerUid: sceneData.peerUid,
          chatType: sceneData.chatType,
          type: sceneData.type,
          params: {
            msgId: sceneData.msgId,
          },
        },
      },
    ],
    webContentId,
    false,
    false,
  );
}

/**
 *
 * @param {String} uid 获取群组信息
 * @returns Object
 */
function getGroupInfo(uid) {
  return lite_tools.nativeCall(
    "ns-ntApi",
    "nodeIKernelGroupService/getGroupDetailInfo",
    [{ groupCode: uid, source: 4 }, undefined],
    webContentId,
    "nodeIKernelGroupListener/onGroupDetailInfoChange",
    false,
  );
}

/**
 * 获取群组列表
 * @param {Boolean} forced 是否强制刷新列表
 */
function getGroupsList(forced = false) {
  return lite_tools.nativeCall(
    "ns-ntApi",
    "nodeIKernelGroupService/getGroupList",
    [{ forceFetch: forced }],
    webContentId,
    "nodeIKernelGroupListener/onGroupListUpdate",
    false,
  );
}
/**
 * 搜索好友/群
 * @param {String} keyword 搜索内容
 */
function openExternalWindow(keyword = "") {
  lite_tools.nativeCall(
    "ns-WindowApi",
    "openExternalWindow",
    [
      "SearchWindow",
      {
        keyword,
        type: "networkAll",
        windowType: 1,
        source: 3,
      },
    ],
    webContentId,
    false,
    false,
  );
}

/**
 * 打开频道窗口
 */
function openGuidMainWindow() {
  lite_tools.nativeCall(
    "ns-WindowApi",
    "openExternalWindow",
    [
      "GuildMainWindow",
      {
        guildId: "2",
        id: 3,
        title: "频道",
        windowName: "GuildMainWindow",
      },
    ],
    webContentId,
    false,
    false,
  );
}

/**
 * 激活聊天窗口，并返回最新预览消息
 */
function activeChatAndReturnPreview(peer) {
  return lite_tools.nativeCall(
    "ns-ntApi",
    "nodeIKernelMsgService/getAioFirstViewLatestMsgsAndAddActiveChat",
    [
      {
        peer,
        cnt: 10,
      },
      null,
    ],
    webContentId,
    false,
    false,
  );
}

/**
 * 激活聊天窗口，并返回历史消息
 */
function activeChatAndReturnHistory(peer) {
  return lite_tools.nativeCall(
    "ns-ntApi",
    "nodeIKernelMsgService/getMsgsIncludeSelfAndAddActiveChat",
    [
      {
        peer,
        msgId: "0",
        cnt: 10,
        queryOrder: false,
      },
    ],
    webContentId,
    false,
    false,
  );
}

/**
 * 获取记录的账号 - 登录界面选择账号列表
 */
function getLoginList() {
  return lite_tools.nativeCall("ns-ntApi", "nodeIKernelLoginService/getLoginList", [], webContentId, true, false);
}

/**
 * 获取当前登录账号信息
 */
function getAuthData() {
  return lite_tools.nativeCall("ns-GlobalDataApi", "fetchAuthData", [], webContentId, true, false);
}

/**
 * 移除账号登录信息
 * @param {String} uin 账号uin
 * @returns 
 */
function resetLoginInfo(uin) {
  return lite_tools.nativeCall(
    "ns-ntApi",
    "nodeIKernelLoginService/resetLoginInfo",
    [
      {
        uin: uin,
      },
      null,
    ],
    webContentId,
    true,
    false,
  );
}

export {
  sendMessage,
  sendRawMessage,
  forwardMessage,
  goMainWindowScene,
  openGuidMainWindow,
  getUserInfo,
  getMembersAvatar,
  getGroupsAvatar,
  getGroupInfo,
  getGroupsList,
  getAuthData,
  openExternalWindow,
  activeChatAndReturnPreview,
  activeChatAndReturnHistory,
  getLoginList,
  resetLoginInfo,
};
