import { shell } from "electron";
import { createServer as createHttpServer } from "node:http";
import { createServer as creatNetServer } from "node:net";
import { readFileSync } from "node:fs";
import superjson from "superjson";
import manifest from "../../manifest.json";
import { config, configEvent } from "./config.js";

// 配置文件加载前缓存日志信息
let cacheLogs = [];

class Logs {
  constructor(logName) {
    this.logName = logName;
    return this.log.bind(this);
  }
  log(...args) {
    if (config?.debug.mainConsole) {
      console.log(`[${this.logName}]`, ...args);
    }
    cacheLogs.push([`[${this.logName}]`, ...args]);
  }
}

class WebLog {
  constructor() {
    this.server = createHttpServer(this.httpHandel.bind(this));
  }
  httpHandel(req, res) {
    // 处理日志请求
    if (req.url === "/" && req.method === "GET") {
      // 读取日志文件内容
      res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8", "Access-Control-Allow-Origin": "*" });
      const log = superjson.stringify(cacheLogs);
      cacheLogs = [];
      res.end(log);
    } else if (req.url === "/debug" && req.method === "GET") {
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8", "Access-Control-Allow-Origin": "*" });
      const html = readFileSync(`${LiteLoader.plugins[manifest.slug].path.plugin}/src/html/debug.html`, "utf-8");
      res.end(html);
    } else if (req.url === "/debug.js" && req.method === "GET") {
      res.writeHead(200, { "Content-Type": "application/javascript; charset=utf-8", "Access-Control-Allow-Origin": "*" });
      const js = readFileSync(`${LiteLoader.plugins[manifest.slug].path.plugin}/dist/debug.js`, "utf-8");
      res.end(js);
    } else {
      // 处理其他请求
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8", "Access-Control-Allow-Origin": "*" });
      res.end("Not Found");
    }
  }
  start() {
    if (!this.server.listening) {
      const port = (() => {
        const server = creatNetServer();
        server.listen(0);
        const { port } = server.address();
        server.close();
        return port;
      })();
      this.server.listen(port, () => {
        shell.openExternal(`http://localhost:${port}/debug`);
      });
    }
  }
  stop() {
    if (this.server.listening) {
      this.server.closeAllConnections();
      this.server.closeIdleConnections();
      this.server.close();
    }
  }
}
const webLog = new WebLog();

configEvent.on("update", (newConfig) => {
  if (newConfig.debug.showWeb) {
    webLog.start();
  } else {
    webLog.stop();
    cacheLogs = [];
  }
});

function sendLog(args) {
  if (!config || config?.debug.showChannedCommunication) {
    cacheLogs.push(["[send]", ...args]);
  }
}

function ipcLog(args) {
  if (!config || config?.debug.showChannedCommunication) {
    cacheLogs.push(["[get]", ...args]);
  }
}

// function pad(number) {
//   return number < 10 ? "0" + number : number;
// }

// function formatDate(date = new Date()) {
//   const year = date.getFullYear();
//   const month = pad(date.getMonth() + 1);
//   const day = pad(date.getDate());
//   return `${year}-${month}-${day}`;
// }

export { Logs, sendLog, ipcLog };
