## node 核心

### node 事件循环

   ┌───────────────────────────┐
┌─>│           timers          │ setTimeout setInterval 对应的回调函数
│  └─────────────┬─────────────┘
│  ┌─────────────┴─────────────┐
│  │     pending callbacks     │ 本次没有执行完，下次执行的回调，无法控制
│  └─────────────┬─────────────┘
│  ┌─────────────┴─────────────┐
│  │       idle, prepare       │ 系统内部用的回调队列
│  └─────────────┬─────────────┘      ┌───────────────┐ 事件触发线程，在这里轮询一段时间，会在这里阻塞
│  ┌─────────────┴─────────────┐      │   incoming:   │ 1. 执行异步 i/o 回调
│  │           poll            │<─────┤  connections, │ 2. 监控时间到了，回到 timer 中
│  └─────────────┬─────────────┘      │   data, etc.  │ 
│  ┌─────────────┴─────────────┐      └───────────────┘
│  │           check           │ setImmediate 回调
│  └─────────────┬─────────────┘
│  ┌─────────────┴─────────────┐
└──┤      close callbacks      │ 关闭时的回调 socket.on('close', () => {})
   └───────────────────────────┘

默认事件循环依旧是先执行主线代码（产生的宏任务，和浏览器一样放到不同的队列里）

主线执行完毕后，会扫描 timers 中是否有回调，如果有回调则会拿出第一个来执行（宏任务执行一个后清空所有微任务，然后再执行宏任务），清空一个阶段后执行下一个；

如果没有定时器则进入到 poll 中，此时会执行 i/o 操作的回调，如果有则取出一个来执行；

（如果 poll 清空了）此时会检测是否有 Immediate 的回调，如果有则执行，没有则等待

等待定时器到达时间后，再重回 timers 阶段，或者有 i/o 

微任务其实和浏览器一样 promise.then

process.nextTick （也是一个异步api）在执行代码完毕后会优先于 promise.then 执行

### node 模块加载的顺序

通过相对路径或绝对路径引用的情况:

1. 加载相对的路径会根据文件名匹配后缀
2. 文件名和文件夹同名了，高版本会先查找文件再查找文件夹
3. 在高版本中, 会先查找 package.json 对应的 main 字段, 如果没有会查找文件夹中的 index.js

第三方模块(需要安装):

1. 查找 node_modules 目录
2. 查找 package.json 中的 dependencies 字段
3. 查找 package.json 中的 devDependencies 字段

### node 中 npm 的使用

#### 写一个全局包
1. package.json 中添加 bin 字段, 用来指示执行命令时运行哪个文件
2. 运行头: 在文件中指定运行该文件的环境 `#! /user/bin/env node`
3. 执行 `npm link` 把全局包链接到全局变量中

## Buffer

二进制缓存区. 对文件的读写.

可以和字符串相互转换.

在 node 中的展现形式是 16 进制.

为什么用 16 进制? - 为了短

- 0.1 + 0.2 != 0.3 ?

  浮点数在计算机中存储的是二进制. 小数转换成二进制是 *2 取整数

  0.1 转换为二进制后是无限循环的

### base64 编码

编码方式. 将二进制转换成 6位二进制 即 64位 进行编码.

缺陷: 编码后会比之前的内容大 1/3, 不适合大内容

### Buffer 的三种声明方式

js 是弱语言类型, 不能直接声明数组的大小.

字符采用的是 ascii 编码, 一个字符就是一个字节. 汉字采用 utf-8 编码, 一个汉字是 3 个字节.

```js
let buf1 = Buffer.from('李'); // 根据字符串声明, 固定大小
let buf2 = Buffer.alloc(10); // 可以指定大小

let buf3 = Buffer.allocUnsafe(10); // 不会清空内存, 适合写入

const bigBuffer = Buffer.alloc(buf1.length + buf2.length);

buf1.copy(bigBuffer, 0);
buf2.copy(bigBuffer, 3, 0, 3);
// 相当于
const bigBuffer2 = Buffer.concat([buf1, buf2], /*length*/6);
```

常用的 Buffer 方法:

- slice()
- length
- from()
- alloc()
- concat([])
- isBuffer()

## fs

### 发布订阅 event 模块

on emit off once

### 流

文件的读写 流的实现:

```js
const buffer = Buffer.alloc(3);
// 文件系统标识位 r 读 w 写 a 追加
// r+ 能读能写, 已读为准, 如果文件不存在, 报错
// w+ 能读能写, 如果文件不存在, 创建文件, 如果文件存在, 清空文件内容
// a+ 能读能写, 如果文件不存在, 创建文件, 如果文件存在, 追加内容
// i/o 操作: 读 1.txt 文件
fs.open(path.resolve(__dirname, "1.txt"), "r", function (err, fd) {
  // fd 文件标识符
  // 写入到 buffer 的第0个位置 写入buffer.length个 并且读取文件的位置从第0个
  fs.read(fd, buffer, 0, buffer.length, 0, function (err, bytesRead) {
    // bytesRead 真实读取到的个数
    console.log(bytesRead, buffer.toString());

		// 向 2.txt 文件写入
    fs.open(path.resolve(__dirname, "2.txt"), "w", function (err, fd) {
      fs.write(fd, buffer, 0, bytesRead, 0, function (err, writeItem) {});
    });
  });
});
```

文件的关闭: fs.close()

### 文件流

fs 事件: open, data, end, close, err

只用文件操作才有 open\close 事件

### 可读流的实现

1. 内部创建了一个可读流
2. 内部会对用户的属性进行格式化
3. Readable.apply(this, options) Reflect.apply
4. 我们自己实现一个可读流必须要自己继承 Readable 类
5. maybeReadMore => Readable.read 方法 => 内部会调用子类的 _read 方法
6. 用户会将读取到的结果调用父类的 push 传入, 内部会自动触发 emit 事件

```js
const { Readable } = require("stream");

class MyReadStream extends Readable {
  constructor(props) {
    super(props);
    this.i = 0;
  }

  // 父类会在初始化时自动调用子类的 _read 方法
  _read() {
    // 这里的实现可以是 fs 也可以是自己的
    if (this.i === 10) {
      // 结束 自动触发 end 事件
      this.push(null);
    } else {
      this.push(this.i++ + '');
    }
  }
}

let mrs = new MyReadStream();
mrs.on("data", function (data) {
    console.log(data);
});

mrs.on('end', function() {
    console.log('end');
});
```

### 可写流的应用
```js
fs.createReadStream(path.resolve(__dirname, '1.txt'), {
	flags: "r",
	highWaterMark: 3,
	start: 0,
	end: 8
});

const ws = fs.createWriteStream(path.resolve(__dirname, '2.txt'), {
  flags: "w",
	highWaterMark: 16 * 1024, // 表示要不要继续写入
	start: 0,
});

ws.write('ok', function () {
	console.log('异步');
});

ws.write('ok', function () {
	console.log('异步2');
});

ws.end('ok'); // wirte + close

// 解决异步并发的方法是排队
// 按照顺序写入, 同一时间内只有一个线程在写入
```

### 实现可写流和 Pipe 方法

可写流的实现:

```js
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
```





































