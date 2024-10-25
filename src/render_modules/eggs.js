import { weightIcon } from "./svg.js";
import { debounce } from "./debounce.js";
import { showToast } from "./toast.js";

function isToday() {
  const today = new Date();
  const month = today.getMonth() + 1;
  const day = today.getDate();
  return month === 4 && day === 1;
}

if (isToday()) {
  showRealName();
}

function showRealName() {
  document.querySelectorAll(".nav-item.liteloader,.nav-bar.liteloader .nav-item").forEach((node) => {
    if (node.textContent === "轻量工具箱") {
      node.querySelector(".name").innerHTML = "超重工具箱";
      const iconEl = node.querySelector(".q-icon");
      iconEl.innerHTML = weightIcon;
      iconEl.classList.add("eggs-icon");
      let toast = null;
      iconEl.addEventListener("click", () => {
        if (!activePhysics) {
          iconEl.addEventListener(
            "transitionend",
            () => {
              startPhysics();
              toast = showToast("超重啦！(再次点击图标关闭)", "default", Number.MAX_SAFE_INTEGER / 1000);
            },
            { once: true },
          );
          iconEl.classList.add("eggs-action");
        } else {
          stopPhysics();
          iconEl.classList.remove("eggs-action");
          toast?.close();
        }
      });
    }
  });
}

document.querySelectorAll(".nav-item.liteloader,.nav-bar.liteloader .nav-item").forEach((node) => {
  if (node.textContent === "轻量工具箱") {
    node.setAttribute("title", "这个标题之下似乎隐藏着什么...");
    node.querySelector(".name").classList.add("lt-eggs-title");
    node.addEventListener(
      "animationend",
      () => {
        showToast("被你发现啦 XD", "success", 3000);
        node.querySelector(".name").classList.remove("lt-eggs-title");
        node.removeAttribute("title");
        showRealName();
      },
      { once: true },
    );
  }
});

let isActive = false;
let count = 0;
let msgIndex = -1;
let eggsToast = null;
const contents = [
  ["不要点啦！", "default", 3000],
  ["乱点会坏掉的！", "default", 3000],
  ["真的会坏掉的！", "default", 3000],
  ["[光敏性癫痫警告]接下来要展示的内容可能引起部分人群的不适，请小心！", "error", 3000],
];
export async function switchButtons() {
  if (document.querySelector(".lite-tools-settings").classList.contains("eggs")) {
    eggsToast?.close();
    document.querySelector(".lite-tools-settings").classList.remove("eggs");
  }
  if (isActive) {
    timeout();
    if (msgIndex !== contents.length - 1) {
      msgIndex++;
      const toast = contents[msgIndex];
      showToast(...toast);
    } else {
      isActive = false;
      msgIndex = -1;
      document.querySelector(".lite-tools-settings").classList.add("eggs");
      eggsToast = showToast("坏掉啦！(切换任意开关关闭)", "default", Number.MAX_SAFE_INTEGER / 1000);
    }
  } else {
    isActive = activeEggs();
  }
}

function activeEggs() {
  count++;
  if (count > 10) {
    return true;
  }
  frequency();
  return false;
}

const frequency = debounce(() => {
  count = 0;
}, 1000);

const timeout = debounce(() => {
  if (isActive) {
    showToast("这才像话嘛~", "success", 3000);
    isActive = false;
    msgIndex = -1;
  }
}, 5000);

const availHeight = window.screen.availHeight;
const vector = { x: 0, y: 0 };
const offset = 40;
const maxVector = 20;
let dragMouseDown = false;
let activePhysics = false;
let tempdrag = null;
let mouseleave = false;
let lastTime = 0;

function physics(time) {
  if (!lastTime) {
    lastTime = time;
  }
  const delta = time - lastTime;
  lastTime = time;
  if (!activePhysics) {
    return;
  }
  requestAnimationFrame(physics);
  if (dragMouseDown) {
    return;
  }
  const screenTop = window.screenTop;
  const outerHeight = window.outerHeight;
  const windowBottom = availHeight - (screenTop + outerHeight);
  const vectors = (offset / 1000) * delta;
  if (windowBottom <= 0) {
    vector.y = vector.y * -0.6;
    if (Math.abs(vector.y) < vectors) {
      vector.y = 0;
      return;
    }
  }
  if (vector.y < maxVector) {
    vector.y += vectors;
  }
  window.moveBy(vector.x, vector.y);
}

const mdn = (e) => {
  if (e.target === tempdrag) {
    dragMouseDown = true;
    mouseleave = false;
  }
};
const mup = () => {
  dragMouseDown = false;
};
const mmo = (e) => {
  if (dragMouseDown && !mouseleave) {
    window.moveBy(e.movementX, e.movementY);
  }
};
function replaceMoveBar() {
  const drag = document.querySelector(".draggable-view__container");
  const height = drag.offsetHeight;
  drag.classList.remove("window-draggable-area");
  tempdrag = document.createElement("div");
  tempdrag.style.height = height + "px";
  tempdrag.style.width = "100%";
  tempdrag.style.position = "absolute";
  tempdrag.style.zIndex = "9999";
  tempdrag.style.top = "0";
  tempdrag.style.left = "0";
  drag.insertAdjacentElement("beforebegin", tempdrag);
  document.addEventListener("mousedown", mdn);
  document.addEventListener("mouseup", mup);
  // document.addEventListener("mouseleave", mle);
  document.addEventListener("mousemove", mmo);
}

function reductionMoveBar() {
  document.querySelector(".draggable-view__container").classList.add("window-draggable-area");
  tempdrag.remove();
  document.removeEventListener("mousedown", mdn);
  document.removeEventListener("mouseup", mup);
  // document.removeEventListener("mouseleave", mle);
  document.removeEventListener("mousemove", mmo);
}

function startPhysics() {
  activePhysics = true;
  lastTime = 0;
  requestAnimationFrame(physics);
  replaceMoveBar();
}
function stopPhysics() {
  activePhysics = false;
  reductionMoveBar();
}
