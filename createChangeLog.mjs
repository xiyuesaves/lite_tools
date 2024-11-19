import { readFileSync, writeFileSync } from "fs";
const packageJSON = JSON.parse(readFileSync("./package.json", "utf-8"));
const releaseBody = readFileSync("./release.md", "utf-8");
const relesasText =
  `## v${packageJSON.version} - ${new Date().toLocaleString("zh-cn", { hour12: false, timeZone: "Asia/Shanghai" })}\n\n` + releaseBody;
const releaseList = [];

async function getAllRelease(list = [], page = 1) {
  writeFileSync("./changeLog.md", "由于日志过多，请到github查看");
  return;
  const res = await fetch(`https://api.github.com/repos/xiyuesaves/LiteLoaderQQNT-lite_tools/releases?per_page=100&page=${page}`);
  const json = await res.json();
  if (typeof json.length === "number") {
    list = list.concat(json);
    console.log(list.length, json.length);
    if (json.length === 100) {
      await getAllRelease(list, ++page);
    } else {
      list.forEach((item) => {
        releaseList.push(
          `## ${item.tag_name} - ${new Date(item.created_at).toLocaleString("zh-cn", { hour12: false, timeZone: "Asia/Shanghai" })}\n\n${
            item.body
          }`,
        );
      });
      if (`v${packageJSON.version}` !== list[0].tag_name) {
        console.log("插入当前版本");
        releaseList.unshift(relesasText);
      } else {
        console.log("当前版本已存在");
      }
      writeFileSync("./changeLog.md", releaseList.join("\n\n"));
    }
  } else {
    throw json;
  }
}

export { getAllRelease };
