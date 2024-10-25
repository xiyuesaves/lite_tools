// 该模块修改自：https://www.codeproject.com/Articles/813480/HTTP-Partial-Content-In-Node-js
// 初始化需要的对象
import { createServer as createHttpServer } from "http";
import { createServer as createNetServer } from "net";
import fs from "fs";
import { extname } from "path";
import { Logs } from "./logs.js";
const log = new Logs("视频背景服务模块");

/**
 * 视频背景http服务类
 */
class RangesServer {
  constructor() {
    this.videoPath = "";
    this.port = 0;
    this.server = createHttpServer(this.httpListener.bind(this));
    this.mimeNames = {
      ".mp4": "video/mp4",
      ".webm": "video/webm",
    };
  }
  setFilePath(path) {
    this.filePath = path;
  }
  startServer() {
    return new Promise((res, rej) => {
      if (this.filePath) {
        if (this.server.listening) {
          res(this.server.address().port);
        } else {
          this.port = (() => {
            const server = createNetServer();
            server.listen(0);
            const { port } = server.address();
            server.close();
            return port;
          })();
          this.server.on("listening", () => {
            log("http服务已启动");
            res(this.server.address().port);
          });
          this.server.listen(this.port);
        }
      } else {
        rej("没有提供文件地址");
      }
    });
  }
  stopServer() {
    if (this.server.listening) {
      log("http服务已停止");
      this.server.close();
    }
  }
  httpListener(request, response) {
    // 仅响应 GET 请求
    if (request.method != "GET") {
      log("请求视频数据");
      this.sendResponse(response, 405, { Allow: "GET" }, null);
      return;
    }

    // 判断文件是否存在
    if (!fs.existsSync(this.filePath)) {
      this.sendResponse(response, 404, null, null);
      return;
    }

    const responseHeaders = {};
    const stat = fs.statSync(this.filePath);
    const rangeRequest = this.readRangeHeader(request.headers["range"], stat.size);
    // 如果 Header 存在 Range，使用正则表达式对其进行解析。
    if (rangeRequest === null) {
      responseHeaders["Content-Type"] = this.getMimeNameFromExt(extname(this.filePath));
      responseHeaders["Content-Length"] = stat.size; // 文件大小
      responseHeaders["Accept-Ranges"] = "bytes";

      // 如果没有，将直接返回文件。
      this.sendResponse(response, 200, responseHeaders, fs.createReadStream(this.filePath));
      return;
    }

    const start = rangeRequest.Start;
    const end = rangeRequest.End;

    // 如果请求超出文件大小
    if (start >= stat.size || end >= stat.size) {
      // 指出可接受的范围。
      responseHeaders["Content-Range"] = "bytes */" + stat.size;
      // 返回416请求的范围不满足 。
      this.sendResponse(response, 416, responseHeaders, null);
      return;
    }

    // 指示当前范围。
    responseHeaders["Content-Range"] = "bytes " + start + "-" + end + "/" + stat.size;
    responseHeaders["Content-Length"] = start == end ? 0 : end - start + 1;
    responseHeaders["Content-Type"] = this.getMimeNameFromExt(extname(this.filePath));
    responseHeaders["Accept-Ranges"] = "bytes";
    responseHeaders["Cache-Control"] = "no-cache";

    // 返回206请求的切片内容。
    this.sendResponse(response, 206, responseHeaders, fs.createReadStream(this.filePath, { start: start, end: end }));
  }
  sendResponse(response, responseStatus, responseHeaders, readable) {
    response.writeHead(responseStatus, responseHeaders);
    if (readable === null) {
      response.end();
    } else {
      readable.on("open", function () {
        readable.pipe(response);
      });
    }
    return;
  }
  readRangeHeader(range, totalLength) {
    /*
     * 使用正则表达式拆分的方法示例。
     *
     * Input: bytes=100-200
     * Output: [null, 100, 200, null]
     *
     * Input: bytes=-200
     * Output: [null, null, 200, null]
     */
    if (range == null || range.length == 0) {
      return null;
    }
    const array = range.split(/bytes=([0-9]*)-([0-9]*)/);
    const start = parseInt(array[1]);
    const end = parseInt(array[2]);
    const result = {
      Start: isNaN(start) ? 0 : start,
      End: isNaN(end) ? totalLength - 1 : end,
    };

    if (!isNaN(start) && isNaN(end)) {
      result.Start = start;
      result.End = totalLength - 1;
    }

    if (isNaN(start) && !isNaN(end)) {
      result.Start = totalLength - end;
      result.End = totalLength - 1;
    }
    return result;
  }

  getMimeNameFromExt(ext) {
    let result = this.mimeNames[ext.toLowerCase()];
    if (result === null) {
      result = "application/octet-stream";
    }
    return result;
  }
}

export { RangesServer };
