import { options } from "./options.js";
import { Logs } from "../render_modules/logs.js";
const log = new Logs("侧边栏功能按钮模块");

/**
 * 更新侧边栏功能列表
 * @param {Object} navStore 侧边栏数据
 */
export function updateSiderbarNavFuncList(navStore) {
  // 获取侧边栏顶部的功能入口
  let top = navStore.finalTabConfig.map((tabIcon) => ({
    name: tabIcon.label,
    id: tabIcon.id,
    disabled: tabIcon.status === 1 ? false : true,
  }));
  // 插入特殊的三个图标数据
  top.unshift(
    { name: "消息", disabled: options?.sidebar?.top?.find((el) => el.name === "消息")?.disabled ?? false, id: -1 },
    { name: "联系人", disabled: options?.sidebar?.top?.find((el) => el.name === "联系人")?.disabled ?? false, id: -1 },
    { name: "更多", disabled: options?.sidebar?.top?.find((el) => el.name === "更多")?.disabled ?? false, id: -1 },
  );
  // 获取侧边栏底部的功能入口
  let bottom = Array.from(document.querySelectorAll(".func-menu.sidebar__menu .func-menu__item"))
    .filter((el) => el?.__VUE__?.[0]?.attrs?.item?.id)
    .map((el) => {
      const item = {
        name: el.__VUE__[0].attrs.item.label,
        id: el.__VUE__[0].attrs.item.id,
        disabled: el.classList.contains("LT-disabled"),
      };
      return item;
    });
  log("更新侧边栏数据", top, bottom);
  lite_tools.sendSidebar({
    top,
    bottom,
  });
}
