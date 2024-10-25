import { fetch } from "./updateProxy.js";
import { Logs } from "./logs.js";
const log = new Logs("推特数据解析");
const locationSvg =
  '<svg viewBox="0 0 24 24" fill="currentColor" class="lt-x-icon" width="19px" height="19px" aria-hidden="true" class="r-4qtqp9 r-yyyyoo r-1xvli5t r-dnmrzs r-bnwqim r-lrvibr r-m6rgpd r-1bwzh9t r-1gs4q39"><g><path d="M12 7c-1.93 0-3.5 1.57-3.5 3.5S10.07 14 12 14s3.5-1.57 3.5-3.5S13.93 7 12 7zm0 5c-.827 0-1.5-.673-1.5-1.5S11.173 9 12 9s1.5.673 1.5 1.5S12.827 12 12 12zm0-10c-4.687 0-8.5 3.813-8.5 8.5 0 5.967 7.621 11.116 7.945 11.332l.555.37.555-.37c.324-.216 7.945-5.365 7.945-11.332C20.5 5.813 16.687 2 12 2zm0 17.77c-1.665-1.241-6.5-5.196-6.5-9.27C5.5 6.916 8.416 4 12 4s6.5 2.916 6.5 6.5c0 4.073-4.835 8.028-6.5 9.27z"></path></g></svg>';
const urlSvg =
  '<svg viewBox="0 0 24 24" fill="currentColor" class="lt-x-icon" width="19px" height="19px" aria-hidden="true" class="r-4qtqp9 r-yyyyoo r-1xvli5t r-dnmrzs r-bnwqim r-lrvibr r-m6rgpd r-1bwzh9t r-1gs4q39"><g><path d="M18.36 5.64c-1.95-1.96-5.11-1.96-7.07 0L9.88 7.05 8.46 5.64l1.42-1.42c2.73-2.73 7.16-2.73 9.9 0 2.73 2.74 2.73 7.17 0 9.9l-1.42 1.42-1.41-1.42 1.41-1.41c1.96-1.96 1.96-5.12 0-7.07zm-2.12 3.53l-7.07 7.07-1.41-1.41 7.07-7.07 1.41 1.41zm-12.02.71l1.42-1.42 1.41 1.42-1.41 1.41c-1.96 1.96-1.96 5.12 0 7.07 1.95 1.96 5.11 1.96 7.07 0l1.41-1.41 1.42 1.41-1.42 1.42c-2.73 2.73-7.16 2.73-9.9 0-2.73-2.74-2.73-7.17 0-9.9z"></path></g></svg>';
const joinDateSvg =
  '<svg viewBox="0 0 24 24" fill="currentColor" class="lt-x-icon" width="19px" height="19px" aria-hidden="true" class="r-4qtqp9 r-yyyyoo r-1xvli5t r-dnmrzs r-bnwqim r-lrvibr r-m6rgpd r-1bwzh9t r-1gs4q39"><g><path d="M7 4V3h2v1h6V3h2v1h1.5C19.89 4 21 5.12 21 6.5v12c0 1.38-1.11 2.5-2.5 2.5h-13C4.12 21 3 19.88 3 18.5v-12C3 5.12 4.12 4 5.5 4H7zm0 2H5.5c-.27 0-.5.22-.5.5v12c0 .28.23.5.5.5h13c.28 0 .5-.22.5-.5v-12c0-.28-.22-.5-.5-.5H17v1h-2V6H9v1H7V6zm0 6h2v-2H7v2zm0 4h2v-2H7v2zm4-4h2v-2h-2v2zm0 4h2v-2h-2v2zm4-4h2v-2h-2v2z"></path></g></svg>';
const defaultFieldToggles = { withArticleRichContentState: false, withArticlePlainText: false, withGrokAnalyze: false };
const defaultFeatures = {
  creator_subscriptions_tweet_preview_api_enabled: true,
  communities_web_enable_tweet_community_results_fetch: true,
  c9s_tweet_anatomy_moderator_badge_enabled: true,
  articles_preview_enabled: true,
  tweetypie_unmention_optimization_enabled: true,
  responsive_web_edit_tweet_api_enabled: true,
  graphql_is_translatable_rweb_tweet_is_translatable_enabled: true,
  view_counts_everywhere_api_enabled: true,
  longform_notetweets_consumption_enabled: true,
  responsive_web_twitter_article_tweet_consumption_enabled: true,
  tweet_awards_web_tipping_enabled: false,
  creator_subscriptions_quote_tweet_preview_enabled: false,
  freedom_of_speech_not_reach_fetch_enabled: true,
  standardized_nudges_misinfo: true,
  tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled: true,
  rweb_video_timestamps_enabled: true,
  longform_notetweets_rich_text_read_enabled: true,
  longform_notetweets_inline_media_enabled: true,
  rweb_tipjar_consumption_enabled: true,
  responsive_web_graphql_exclude_directive_enabled: true,
  verified_phone_label_enabled: false,
  responsive_web_graphql_skip_user_profile_image_extensions_enabled: false,
  responsive_web_graphql_timeline_navigation_enabled: true,
  responsive_web_enhance_cards_enabled: false,
};
const twitterPostPattern = /^https?:\/\/(www\.)?(x\.com|twitter\.com)\/[A-Za-z0-9_]+\/status\/\d+(\?.*)?$/;
// 定义匹配推特用户主页的正则表达式
const twitterProfilePattern = /^https?:\/\/(www\.)?(x\.com|twitter\.com)\/([A-Za-z0-9_]{1,15})$/;

// 获取guest_token
async function getGuestToken() {
  const res = await fetch("https://api.x.com/1.1/guest/activate.json", {
    method: "POST",
    headers: {
      authorization: "Bearer AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA",
    },
  });
  const guestJson = await res.json();
  return guestJson.guest_token;
}

// 推特请求接口
async function twitterApi(queryId, operationName, variables, features = defaultFeatures, fieldToggles = defaultFieldToggles) {
  const guestToken = await getGuestToken();
  const res = await fetch(
    `https://api.x.com/graphql/${queryId}/${operationName}?variables=${encodeURIComponent(
      JSON.stringify({
        ...variables,
      }),
    )}&features=${encodeURIComponent(JSON.stringify(features))}&fieldToggles=${encodeURIComponent(JSON.stringify(fieldToggles))}`,
    {
      headers: {
        accept: "*/*",
        "accept-language": "zh-CN,zh;q=0.9",
        authorization: "Bearer AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA",
        "content-type": "application/json",
        priority: "u=1, i",
        "sec-ch-ua": '"Not/A)Brand";v="8", "Chromium";v="126", "Google Chrome";v="126"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"Windows"',
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-site",
        "x-guest-token": guestToken,
        "x-twitter-active-user": "yes",
        "x-twitter-client-language": "zh-cn",
        Referer: "https://x.com/",
        "Referrer-Policy": "strict-origin-when-cross-origin",
      },
      body: null,
      method: "GET",
    },
  );
  return await res.json();
}

/**
 * 获取推文详情
 * @param {String} tweetId 推文id
 */
async function getTweetDetail(tweetId) {
  const variables = {
    withCommunity: false,
    includePromotedContent: false,
    withVoice: false,
    tweetId,
  };
  return await twitterApi("Xl5pC_lBk_gcO2ItU39DQw", "TweetResultByRestId", variables);
}

/**
 * 使用用户名获取用户信息
 * @param {String} screenName 用户名
 */
async function getUserInfoByScreenName(screen_name) {
  const variables = {
    screen_name,
    withSafetyModeUserFields: true,
    withSuperFollowsUserFields: true,
  };
  return await twitterApi("7mjxD3-C6BxitPMVQ6w0-Q", "UserByScreenName", variables);
}

/**
 * 使用用户id获取用户信息
 * @param {String} userId 用户id
 */
async function getUserInfoByUserId(userId) {
  const variables = {
    userId,
    withSafetyModeUserFields: true,
    withSuperFollowsUserFields: true,
  };
  return await twitterApi("I5nvpI91ljifos1Y3Lltyg", "UserByRestId", variables);
}

/**
 * 获取推文id
 * @param {string} tweetId - 推文url
 */
function getTweetIdByUrl(url) {
  const pattern = /status\/(\d+)/;
  const match = url.match(pattern);
  if (match) {
    const tweetId = match[1];
    return tweetId;
  } else {
    return 0;
  }
}

/**
 * 检查给定的 URL 是否是推特帖子链接
 * @param {string} url - 要检查的 URL
 * @returns {boolean} - 如果是有效的推特帖子链接返回 true，否则返回 false
 */
function isValidTwitterPostUrl(url) {
  // 检查 URL 是否是推特帖子链接的正则表达式
  return twitterPostPattern.test(url);
}

/**
 * 将推文数据转为链接预览数据
 * @param {Object} tweetData 推文数据
 */
function convertToWebPreview(tweetData) {
  log("推文信息", tweetData);
  if (!tweetData.data?.tweetResult?.result) {
    return {
      success: false,
      err: "获取推文失败",
    };
  }
  return {
    success: true,
    data: {
      title: tweetData.data.tweetResult.result.core.user_results.result.legacy.name,
      image:
        tweetData.data.tweetResult.result.legacy.entities?.media?.[0]?.media_url_https ??
        tweetData.data.tweetResult.result.core.user_results.result.legacy.profile_image_url_https.replace("_normal", "_200x200"),
      description:
        tweetData.data.tweetResult.result.legacy.full_text.replace(/(https?:\/\/[^\s]+)$/, "") +
        tweetData.data.tweetResult.result.legacy.entities?.urls?.map((item) => item.expanded_url).join(" "),
      url: "X (formerly Twitter)",
    },
  };
}

/**
 * 从推文链接中获取预览信息
 * @param {String} url 推文链接
 */
async function getTweetWebMeta(url) {
  const tweetData = await getTweetDetail(getTweetIdByUrl(url));
  return convertToWebPreview(tweetData);
}

/**
 * 判断一个 URL 是否是推特用户主页
 * @param {string} url - 要检查的 URL
 * @returns {boolean} - 如果是推特用户主页返回 true，否则返回 false
 */
function isTwitterProfileUrl(url) {
  return twitterProfilePattern.test(url);
}

/**
 * 从推特用户主页的 URL 中提取用户 ID
 * @param {string} url - 推特用户主页的 URL
 * @returns {string|null} - 用户 ID，如果无法提取则返回 null
 */
function extractTwitterUserId(url) {
  const match = url.match(twitterProfilePattern);
  if (match && match[3]) {
    return match[3];
  }
  return null;
}

/**
 * 从推特用户主页 URL 中提取预览信息
 * @param {String} url 用户主页链接
 * @returns {Object}
 */
async function getTwitterUserInfoWebMeta(url) {
  const screenName = extractTwitterUserId(url);
  const userInfo = await getUserInfoByScreenName(screenName);
  log("用户信息", screenName, userInfo);
  if (!userInfo.data?.user) {
    return {
      success: false,
      err: "用户不存在",
    };
  }
  let description = userInfo.data.user.result.legacy.description;
  let descriptionDetail = [];
  if (userInfo.data.user.result.legacy.location) {
    descriptionDetail.push(`${locationSvg} ${userInfo.data.user.result.legacy.location}`);
  }
  if (userInfo.data.user.result.legacy?.entities?.url?.urls?.[0]?.display_url) {
    descriptionDetail.push(`${urlSvg} <span class="lt-x-ele">${userInfo.data.user.result.legacy.entities.url.urls[0].display_url}</span>`);
  }
  if (userInfo.data.user.result.legacy.created_at) {
    descriptionDetail.push(`${joinDateSvg} ${convertTwitterDate(userInfo.data.user.result.legacy.created_at)}`);
  }
  if (descriptionDetail.length) {
    description = `${descriptionDetail.join("&nbsp&nbsp")}<br/>${description}`;
  }
  return {
    success: true,
    data: {
      title: userInfo.data.user.result.legacy.name,
      image: userInfo.data.user.result.legacy.profile_image_url_https?.replace("_normal", "_200x200"),
      description,
      url: "X (formerly Twitter)",
    },
  };
}

function convertTwitterDate(twitterDate) {
  try {
    const dateObj = new Date(twitterDate);
    const year = dateObj.getFullYear();
    const month = dateObj.getMonth() + 1; // 月份从 0 开始，所以要加 1
    const formattedDate = `${year}年${month}月`;
    return formattedDate;
  } catch {
    return "未知时间";
  }
}

export {
  getUserInfoByScreenName,
  getUserInfoByUserId,
  getTweetDetail,
  getTweetIdByUrl,
  isValidTwitterPostUrl,
  convertToWebPreview,
  getTweetWebMeta,
  isTwitterProfileUrl,
  extractTwitterUserId,
  getTwitterUserInfoWebMeta,
};
