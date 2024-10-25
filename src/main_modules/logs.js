import { shell } from "electron";
import { createServer as createHttpServer } from "http";
import { createServer as creatNetServer } from "net";
import { readFileSync, createWriteStream, existsSync, mkdirSync } from "fs";
import { join } from "path";
import { format } from "util";
import superjson from "superjson";
import { config, loadConfigPath, onUpdateConfig } from "./config.js";

let cacheLogs = [];
let toFileCache = [];
let logFile = null;

class Logs {
  constructor(logName) {
    this.logName = logName;
    return this.log.bind(this);
  }
  log(...args) {
    if (config?.debug.mainConsole) {
      console.log(`[${this.logName}]`, ...args);
      cacheLogs.push([`[${this.logName}]`, ...args]);
      writeToFile([`${new Date().toLocaleString()} |`, `[${this.logName}]`, ...args]);
    } else if (config?.debug.mainConsole === undefined) {
      cacheLogs.push([`[${this.logName}]`, ...args]);
      toFileCache.push([`${new Date().toLocaleString()} |`, `[${this.logName}]`, ...args]);
    }
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
      const html = readFileSync(`${LiteLoader.plugins.lite_tools.path.plugin}/src/html/debug.html`, "utf-8");
      res.end(html);
    } else if (req.url === "/debug.js" && req.method === "GET") {
      res.writeHead(200, { "Content-Type": "application/javascript; charset=utf-8", "Access-Control-Allow-Origin": "*" });
      const js = readFileSync(`${LiteLoader.plugins.lite_tools.path.plugin}/dist/debug.js`, "utf-8");
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

onUpdateConfig(() => {
  if (config.debug.showWeb) {
    webLog.start();
  } else {
    webLog.stop();
  }

  if (!config.debug.mainConsole) {
    cacheLogs = [];
  }

  if (config.debug.mainConsoleToFile) {
    if (!logFile) {
      const logFolder = join(loadConfigPath, "logs");
      const logFilePath = join(logFolder, `${formatDate()}.log`);
      if (!existsSync(logFolder)) {
        mkdirSync(logFolder, { recursive: true });
      }
      logFile = createWriteStream(logFilePath, { flags: "a" });
      if (!config.debug.showChannedCommunication) {
        toFileCache = toFileCache.filter((log) => !["[get]", "[send]"].includes(log[1]));
        cacheLogs = cacheLogs.filter((log) => !["[get]", "[send]"].includes(log[1]));
      }
      toFileCache.forEach((log) => {
        logFile.write(format(...log) + "\n");
      });
    }
    toFileCache = [];
  } else {
    toFileCache = [];
    logFile = null;
  }
});

function sendLog(args) {
  if (config?.debug?.showChannedCommunication) {
    cacheLogs.push(["[send]", ...args]);
    writeToFile([`${new Date().toLocaleString()} |`, `[send]`, ...args]);
  } else if (config?.debug?.showChannedCommunication === undefined) {
    cacheLogs.push(["[send]", ...args]);
    toFileCache.push([`${new Date().toLocaleString()} |`, "[send]", ...args]);
  }
}

function ipcLog(args) {
  if (config?.debug?.showChannedCommunication) {
    cacheLogs.push(["[get]", ...args]);
    writeToFile([`${new Date().toLocaleString()} |`, `[get]`, ...args]);
  } else if (config?.debug?.showChannedCommunication === undefined) {
    cacheLogs.push(["[get]", ...args]);
    toFileCache.push([`${new Date().toLocaleString()} |`, "[get]", ...args]);
  }
}

function writeToFile(args) {
  if (config.debug.mainConsoleToFile && logFile) {
    logFile.write(format(...args) + "\n");
  }
}

function formatDate(date) {
  if (!date) {
    date = new Date();
  }
  function pad(number) {
    return number < 10 ? "0" + number : number;
  }
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  return `${year}-${month}-${day}`;
}

export { Logs, webLog, sendLog, ipcLog };
