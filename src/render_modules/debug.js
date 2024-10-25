import superjson from "superjson";

// 导出到window对象便于调试
window.superjson = superjson;

let loop = true;

const port = location.port;
console.log("通信端口", port);
(async () => {
  while (loop) {
    try {
      let log = superjson.parse(await (await fetch(`http://localhost:${port}/`)).text());
      // 稍微限制下请求速度
      await new Promise((resolve) => setTimeout(resolve, 50));

      if (log && log.length) {
        for (let i = 0; i < log.length; i++) {
          const singLog = log[i];
          // 过滤无效log
          if (singLog?.[4]?.[1]?.[0] === "info" || singLog?.[2]?.eventName === "ns-LoggerApi-2") {
            continue;
          }
          // 根据日志类型使用颜色区分
          switch (singLog[0]) {
            case "[send]":
              singLog[0] = `%c[send]`;
              singLog.splice(1, 0, "background:#87e8de;color:#000000D9;padding:2px 4px;border-radius: 4px;width:56px;");
              break;
            case "[get]":
              singLog[0] = `%c[get]`;
              singLog.splice(1, 0, "background:#b7eb8f;color:#000000D9;padding:2px 4px;border-radius: 4px;width:56px;");
              break;
            default:
              singLog[0] = `%c${singLog[0]}`;
              singLog.splice(1, 0, "background:#ffd666;color:#000000D9;padding:2px 4px;border-radius: 4px;");
          }
          console.log(...singLog);
        }
      }
    } catch (err) {
      if (err.message === "Failed to fetch") {
        loop = false;
        console.log("=========已断开连接=========");
      } else {
        console.log("解码出错", err.message);
      }
    }
  }
})();
