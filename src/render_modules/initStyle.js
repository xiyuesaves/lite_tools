import { options, updateOptions } from "./options.js";
import { Logs } from "./logs.js";

const log = new Logs("全局样式");
const qqntEmojiFont = `"Color Emoji",`;

updateOptions(updateFont);
function updateFont() {
  if (!options.message.overrideFont.fullName) {
    document.body.style.fontFamily = "";
    document.body.style.fontStyle = "";
    if (options.message.overrideEmoji) {
      // 如果没有自定义字体，但是盖默认emoji，就把默认字体集中的emoji去掉来使用系统自带的emoji
      document.body.style.fontFamily = getComputedStyle(document.body).fontFamily.replace(qqntEmojiFont, "");
    }
    return;
  }
  if (options.message.overrideFont.fullName.includes(",")) {
    document.body.style.fontFamily = "";
    options.message.overrideFont.fullName.split(",").forEach((fontName, index) => {
      document.body.style.fontFamily += `${index === 0 ? "" : ","}"${fontName.trim()}"`;
    });
  } else {
    document.body.style.fontFamily = `"${options.message.overrideFont.fullName}"`;
  }
  if (options.message.overrideFont.family) {
    document.body.style.fontFamily += `, "${options.message.overrideFont.family}"`;
  }
  document.body.style.fontStyle = options.message.overrideFont.style;
  if (!options.message.overrideEmoji && document.body.style.fontFamily) {
    // 如果设置了自定义字体，但是不覆盖默认emoji，就添加默认emoji字体
    document.body.style.fontFamily = qqntEmojiFont + document.body.style.fontFamily;
  }
}

async function updateAccentColor(...args) {
  log("更新主题色", ...args);
  let colorStyle = document.querySelector("#liteTools-accent-tokens");
  if (!colorStyle) {
    colorStyle = document.createElement("style");
    colorStyle.id = "liteTools-accent-tokens"; // 和默认token id风格保持一致
    document.body.appendChild(colorStyle);
  }

  if (options.appearance.useSystemAccentColor) {
    const systemAccentColor = await lite_tools.getSystemAccentColor();
    const accentColor = systemAccentColor;
    const important = options.appearance.prioritizeColor ? " !important" : "";

    if (!accentColor) {
      colorStyle.innerHTML = "";
      return;
    }


    // require enabled console debug
    if (options.debug.console) {
      // It's ok to keep this for debugging
      const [linkColor, hoverColor, pressedColor] = generateColors(accentColor);
      console.log(
        `获取到系统色\n%c${accentColor}\n%c${linkColor}\n%c${hoverColor}\n%c${pressedColor}`,
        `background-color:${accentColor};`,
        `background-color:${linkColor};`,
        `background-color:${hoverColor};`,
        `background-color:${pressedColor};`,
      );
    }

    colorStyle.innerHTML = `
    html :is(.q-theme-tokens, .q-theme-tokens-light, .q-theme-tokens-dark) {
      /* 系统颜色变量 */
      --system_accent_color: ${accentColor};

      /* 链接颜色 */
      &.q-theme-tokens-dark {
        --system_link_color: hsl(from var(--system_accent_color) calc(h + 6) max(calc(s - 20), 5) max(calc(l + 15), 40) / 1); /* 链接不应用透明度 */
      }
      &.q-theme-tokens-light {
        --system_link_color: hsl(from var(--system_accent_color) calc(h + 6) max(calc(s - 5), 5) min(calc(l - 5), 75) / 1);
      }

      /* hsl offsets are calculated from the QQNT brand color token */
      --system_hover_color: hsl(from var(--system_accent_color) h max(calc(s - 20), 5) calc(l + 5) / alpha);
      --system_pressed_color: hsl(from var(--system_accent_color) h s calc(l - 5) / alpha);

      /* 与主题色相同的变量 */
      --brand_standard: var(--system_accent_color)${important};
      --overlay_active_brand: var(--system_accent_color)${important};
      --brand_text: var(--system_accent_color)${important};

      /* 气泡颜色 */
      --host_bubble_bg_css_value: var(--system_accent_color)${important}; /* 颜色主题 */
      --host_bubble_bg_css_value_main: var(--system_accent_color)${important}; /* 默认主题 */

      /* 与链接颜色相同的变量 */
      --text_link: var(--system_link_color)${important};
      --text-link: var(--system_link_color)${important}; /* 咋还有横线版本的？ */
      --lt-link-url-color: var(--system_link_color)${important};

      /* hover & active */
      --nt_brand_standard_2_overlay_hover_brand_2_mix: var(--system_hover_color)${important};
      --nt_brand_standard_2_overlay_pressed_brand_2_mix: var(--system_pressed_color)${important};

      /* recent contact */
      --nt_brand_light_2_20_2_alpha: hsl(from var(--system_accent_color) h s l / 0.2)${important};
      --nt_brand_light_2_40_2_alpha: hsl(from var(--system_accent_color) h s l / 0.4)${important};
      --nt_brand_standard_2_20_2_alpha: hsl(from var(--system_accent_color) h s l / 0.2)${important};
      --nt_brand_standard_2_40_2_alpha: hsl(from var(--system_accent_color) h s l / 0.4)${important};
    }`;
  } else {
    colorStyle.innerHTML = "";
  }
}

/**
 * 根据主题色生成三个配色
 * @param {String} baseColor 主题色
 * @returns {String[]} 三个配色
 */
function generateColors(baseColor) {
  // currently only for debugging
  const color1 = `hsl(from ${baseColor} calc(h + 6) max(calc(s - 20), 10) max(calc(l + 15), 30) / 1)`; // link
  const color2 = `hsl(from ${baseColor} h max(calc(s - 20), 10) calc(l + 5) / alpha)`; // hover
  const color3 = `hsl(from ${baseColor} h s calc(l - 5) / alpha)`; // pressed
  return [color1, color2, color3];
}

/**
 * 初始化自定义右键菜单颜色样式
 */
function initCustomContextMenuColor() {
  let customContextMenuColorStyleElement = document.querySelector("#customContextMenuColorStyle");
  if (!customContextMenuColorStyleElement) {
    log("初始化自定义右键菜单颜色样式");
    customContextMenuColorStyleElement = document.createElement("style");
    customContextMenuColorStyleElement.id = "customContextMenuColorStyle";
    document.body.append(customContextMenuColorStyleElement);
  }
  customContextMenuColorStyleElement.innerHTML = `:root{
  --lt-q-light-context-copy-color: ${options.qContextMenu.customHighlightReplies.light.copy};
--lt-q-light-context-forward-color: ${options.qContextMenu.customHighlightReplies.light.forward};
--lt-q-light-context-collect-color: ${options.qContextMenu.customHighlightReplies.light.collect};
--lt-q-light-context-multiple-color: ${options.qContextMenu.customHighlightReplies.light.multiple};
--lt-q-light-context-quote-color: ${options.qContextMenu.customHighlightReplies.light.quote};
--lt-q-light-context-essence-color: ${options.qContextMenu.customHighlightReplies.light.essence};
--lt-q-light-context-revoke-color: ${options.qContextMenu.customHighlightReplies.light.revoke};
--lt-q-light-context-delete-color: ${options.qContextMenu.customHighlightReplies.light.delete};
--lt-q-dark-context-copy-color: ${options.qContextMenu.customHighlightReplies.dark.copy};
--lt-q-dark-context-forward-color: ${options.qContextMenu.customHighlightReplies.dark.forward};
--lt-q-dark-context-collect-color: ${options.qContextMenu.customHighlightReplies.dark.collect};
--lt-q-dark-context-multiple-color: ${options.qContextMenu.customHighlightReplies.dark.multiple};
--lt-q-dark-context-quote-color: ${options.qContextMenu.customHighlightReplies.dark.quote};
--lt-q-dark-context-essence-color: ${options.qContextMenu.customHighlightReplies.dark.essence};
--lt-q-dark-context-revoke-color: ${options.qContextMenu.customHighlightReplies.dark.revoke};
--lt-q-dark-context-delete-color: ${options.qContextMenu.customHighlightReplies.dark.delete};
}`;
}

updateOptions(updateAccentColor);
updateOptions(initCustomContextMenuColor);
/**
 * 注入全局样式
 */
function initStyle() {
  // 加载通用样式
  const globalStyle = document.createElement("link");
  globalStyle.id = "liteToolsGlobalStyle";
  globalStyle.setAttribute("href", `local:///${LiteLoader.plugins.lite_tools.path.plugin}/src/css/global.css?r=${new Date().getTime()}`);
  globalStyle.setAttribute("rel", "stylesheet");
  document.body.append(globalStyle);

  // 插入自定义样式style容器
  const backgroundStyle = document.createElement("link");
  backgroundStyle.id = "liteToolsBackgroundStyle";
  if (options.background.enabled) {
    backgroundStyle.setAttribute(
      "href",
      `local:///${LiteLoader.plugins.lite_tools.path.plugin}/src/css/style.css?r=${new Date().getTime()}`,
    );
  }
  backgroundStyle.setAttribute("rel", "stylesheet");
  document.body.appendChild(backgroundStyle);

  // 调试用-styleCss刷新
  lite_tools.updateStyle(() => {
    log("更新styleCss");
    if (options.background.enabled) {
      backgroundStyle.setAttribute(
        "href",
        `local:///${LiteLoader.plugins.lite_tools.path.plugin}/src/css/style.css?r=${new Date().getTime()}`,
      );
    }
  });

  // 调试用-globalCss刷新
  lite_tools.updateGlobalStyle(() => {
    log("更新globalCss");
    globalStyle.setAttribute("href", `local:///${LiteLoader.plugins.lite_tools.path.plugin}/src/css/global.css?r=${new Date().getTime()}`);
  });

  updateFont();
  initCustomContextMenuColor();
  updateAccentColor();
  lite_tools.onSystemAccentColorChanged(updateAccentColor);
  log("模块已加载");
}
initStyle();
