const EventEmitter = require("events");
const fs = require("fs");
const path = require("path");

class writeStream extends EventEmitter {
  constructor(path, options) {
    super();
    this.path = path;
    this.options = options;
    this.mode = options.mode || 0o666;
    this.flags = options.flags || "w";
    this.start = options.start || 0;
    this.highWaterMark = options.highWaterMark || 16 * 1024;

    this.open(); // 打开可写流

    this.cache = []; // 缓存数据
    this.len = 0; // 缓存区大小
    this.needDrain = false;
    this.writing = false;
    this.offset = this.start;
  }

  destory(err) {
    if (err) return this.emit("error", err);
  }

  open() {
    fs.open(this.path, this.flags, this.mode, (err, fd) => {
      this.fd = fd;
      this.emit("open", fd);
    });
  }

  clear() {
    const cacheObj = this.cache.shift();
    if (cacheObj) {
      const { chunk, encoding, clearBuffer } = cacheObj;
      this._write(chunk, encoding, clearBuffer);
    } else {
      // 缓存区为空
      this.writing = false;
      if (this.needDrain) {
        // 写入完毕后看一下是否要执行 drain 事件
        this.needDrain = false;
        this.emit("drain");
      }
    }
  }

  write(chunk, encoding = this.encoding, callback = () => {}) {
    // 链接数据库, 操作数据库, 都是通过发布订阅实现真正的逻辑
    // fs.write
    chunk = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);

    this.len += chunk.length;
    // 如果缓存区的大小大于等于highWaterMark, 需要触发drain事件
    this.needDrain = this.len >= this.highWaterMark;

    const clearBuffer = () => {
      callback();
      this.clear(); // 清空缓存区
    };

    if (this.writing) {
      this.cache.push({
        chunk,
        encoding,
        clearBuffer,
      });
    } else {
      // 不是正在写入
      this.writing = true;
      this._write(chunk, encoding, clearBuffer);
    }

    return !this.needDrain;
  }

  _write(chunk, encoding, callback) {
    // console.log("fd 可能拿不到", fd);
    if (typeof this.fd !== "number") {
      return this.once("open", () => this._write(chunk, encoding, callback));
    }

    fs.write(this.fd, chunk, 0, chunk.length, this.offset, (err, written) => {
      this.len -= chunk.length;
      this.offset += chunk.length;
      callback();
    });
  }
}

const ws = new writeStream(path.resolve(__dirname, "3.txt"), {
  flags: "w",
  highWaterMark: 4, // 表示要不要继续写入
  start: 0,
});

const a = ws.write("ok1", function () {
  console.log("异步");
});
console.log(a);

const b = ws.write("ok2", function () {
  console.log("异步");
});
console.log(b);

const c = ws.write("ok3", function () {
  console.log("异步");
});
console.log(c);

module.exports = writeStream;
