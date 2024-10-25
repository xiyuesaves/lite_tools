/**
 * markdown转换为html
 * @param {String} markdown markdown字符串
 * @returns
 */
function simpleMarkdownToHTML(markdown) {
  const strs = markdown.split("\n");
  let ulStack = 0;
  let inBlockquote = 0;

  return strs
    .map((md) => {
      // Headers
      md = md.replace(/^# (.*$)/gim, "<h1>$1</h1>");
      md = md.replace(/^## (.*$)/gim, "<h2>$1</h2>");
      md = md.replace(/^### (.*$)/gim, "<h3>$1</h3>");
      md = md.replace(/^#### (.*$)/gim, "<h4>$1</h4>");

      // Inline code
      md = md.replace(/`(.*?)`/g, "<code>$1</code>");

      // Bold and Italic
      md = md.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
      md = md.replace(/\*(.*?)\*/g, "<em>$1</em>");

      // Strikethrough
      md = md.replace(/~~(.*?)~~/g, "<del>$1</del>");

      // Images
      md = md.replace(/!\[(.*?)\]\((.*?)\)/g, '<img src="$2" alt="$1">');

      // Links
      md = md.replace(/\[(.*?)\]\((.*?)\)/g, '<a data-href="$2">$1</a>');

      // GitHub Issue Links
      md = md.replace(/#(\d+)/g, '<a data-href="https://github.com/xiyuesaves/LiteLoaderQQNT-lite_tools/issues/$1">#$1</a>');
      
      md = md.replace(/@(\S+)/g, '<a data-href="https://github.com/$1">@$1</a>');

      md = md.replace(/^\s*-\s(.*)$/gim, "<li>$1</li>");

      if (md.includes("<li>") && ulStack) {
        md = `<ul>\n${md}`;
        ulStack++;
      }

      if (!md.includes("</li>") && !ulStack) {
        md = `</ul>\n${md}`;
        ulStack--;
      }

      // 引用
      if (/^\s*>/.test(md)) {
        const str = md.replace(/^\s*> ?/, "").replace(/\\/, "");
        if (!inBlockquote) {
          md = `<div class="markdown-alert ${getAlertType(str)}">\n${isTitle(str)}`;
          inBlockquote++;
        } else {
          md = "<br>" + str;
        }
      } else if (inBlockquote) {
        md = `</div>\n${md}`;
        inBlockquote--;
      }

      return md;
    })
    .join("");
}

function getAlertType(str) {
  const alertTypeMap = {
    "[!NOTE]": "markdown-alert-note",
    "[!IMPORTANT]": "markdown-alert-important",
    "[!WARNING]": "markdown-alert-warning",
    "[!TIP]": "markdown-alert-tip",
    "[!CAUTION]": "markdown-alert-caution",
  };

  return alertTypeMap[str.trim()] || "";
}

function isTitle(str) {
  const titleMap = {
    "[!NOTE]": "Note",
    "[!IMPORTANT]": "Important",
    "[!WARNING]": "Warning",
    "[!TIP]": "Tip",
    "[!CAUTION]": "Caution",
  };

  const trimmedStr = str.trim();
  const title = titleMap[trimmedStr];

  if (title) {
    return `<p class="markdown-alert-title">${title}</p>`;
  }

  return str;
}

export { simpleMarkdownToHTML };
