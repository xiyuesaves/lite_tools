import http from "http";
import https from "https";
import zlib from "zlib";
import { config } from "./config.js";
import { Logs } from "./logs.js";
const log = new Logs("getWeb");
/**
 * 一个链接最多下载100Kb的数据
 * @type {Number}
 */
const MAX_CHUNK_SIZE = 1024 * 100;

export function get(url, redirects = 0) {
  if (redirects > 20) {
    return Promise.resolve({
      success: false,
      error: "Too many redirects",
    });
  }
  // log("请求地址", url);
  const urlData = new URL(url);
  const defaultHeaders = {
    "User-Agent": config.global.UA,
    accept: "text/html, application/xhtml+xml, application/xml;q=0.9, */*;q=0.8",
    "accept-language": "zh-CN,zh;q=0.8,en-US;q=0.5,en;q=0.3",
    "accept-encoding": "gzip, identity",
    "cache-control": "no-cache",
    connection: "keep-alive",
  };
  if (config.proxy.enabled && config.proxy.url) {
    const proxy = new URL(config.proxy.url);
    return new Promise((resolve) => {
      const req = http.get(
        {
          host: proxy.hostname,
          port: proxy.port,
          path: urlData.href,
          headers: {
            ...defaultHeaders,
            Host: urlData.host,
          },
        },
        (res) => {
          handle(res, resolve);
        },
      );
      req.on("error", (err) => {
        log("请求出错", err);
        resolve({
          success: false,
          error: `请求出错 ${err.message}`,
        });
      });
    });
  } else {
    return new Promise((resolve) => {
      const request = urlData.protocol === "https:" ? https.get : http.get;
      const req = request(
        {
          hostname: urlData.hostname,
          path: urlData.pathname,
          headers: defaultHeaders,
        },
        (res) => {
          handle(res, resolve);
        },
      );
      req.on("error", (err) => {
        log("请求出错", err);
        resolve({
          success: false,
          error: `请求出错 ${err.message}`,
        });
      });
    });
  }

  function handle(res, resolve) {
    const contentType = res.headers["content-type"];
    log("返回请求头", res.req.path, res.statusCode, res.headers);
    // 处理重定向
    if ([301, 302].includes(res.statusCode)) {
      res.destroy();
      if (res.headers.location.startsWith("http")) {
        resolve(get(res.headers.location, ++redirects));
      } else {
        const href = new URL(res.headers.location, res.req.path).href;
        resolve(get(href, ++redirects));
      }
    } else if (res.statusCode === 200) {
      if (contentType?.startsWith("text/html")) {
        let chunks = [];
        // 请求数据是否有压缩
        if (res.headers["content-encoding"] === "gzip") {
          const unzipStream = zlib.createGunzip();
          res.pipe(unzipStream);
          unzipStream.on("data", (chunk) => {
            chunks.push(chunk);
            if (Buffer.concat(chunks).length >= MAX_CHUNK_SIZE) {
              res.destroy();
              res.unpipe(unzipStream);
              log("结束请求");
              endData();
            }
          });
          unzipStream.on("end", () => {
            res.destroy();
            endData();
          });
          unzipStream.on("error", (err) => {
            log(`解压出错: ${err.message}`);
            res.destroy();
            resolve({
              success: false,
              error: "unzip error",
            });
          });
        } else {
          res.on("data", (chunk) => {
            chunks.push(chunk);
            if (Buffer.concat(chunks).length >= MAX_CHUNK_SIZE) {
              res.destroy();
              log("结束请求");
              endData();
            }
          });
          res.on("end", () => {
            res.destroy();
            endData();
          });
        }
        res.on("error", (err) => {
          log(`接收数据出错: ${err}`);
          res.destroy();
          resolve({
            success: false,
            error: "respond error",
          });
        });
        function endData() {
          const buffer = Buffer.concat(chunks);
          const defaultDecoder = new TextDecoder("utf-8");
          const defaultHtml = defaultDecoder.decode(buffer);
          const charset = getCharset(contentType, defaultHtml);
          const decode = new TextDecoder(charset);
          const html = decode.decode(buffer);
          // log("返回数据", html);
          resolve({
            success: true,
            data: html,
          });
        }
      } else {
        res.destroy();
        resolve({
          success: false,
          error: "target not html",
        });
      }
    } else {
      res.destroy();
      resolve({
        success: false,
        error: "statusCode error",
      });
    }
  }
}

function getCharset(contentType, htmlStr) {
  if (contentType) {
    const charset = contentType.match(/charset=(.+)/);
    if (charset) {
      return charset[1];
    }
  }
  if (htmlStr) {
    const charset = htmlStr.match(/<meta\s+[^>]*charset=["']?([^"'\s>]+)|<meta\s+http-equiv=["']?Content-Type["']?\s+content=["'][^"']*charset=([^"']+)/i)
    if (charset) {
      return charset[1];
    }
  }
  return "utf-8";
}
