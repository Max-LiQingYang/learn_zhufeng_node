const fs = require("fs");
const path = require("path");

// const buffer = Buffer.alloc(3);
// // 文件系统标识位 r 读 w 写 a 追加
// // r+ 能读能写, 已读为准, 如果文件不存在, 报错
// // w+ 能读能写, 如果文件不存在, 创建文件, 如果文件存在, 清空文件内容
// // a+ 能读能写, 如果文件不存在, 创建文件, 如果文件存在, 追加内容
// // i/o 操作: 读 1.txt 文件
// fs.open(path.resolve(__dirname, "1.txt"), "r", function (err, fd) {
//   // fd 文件标识符
//   // 写入到 buffer 的第0个位置 写入buffer.length个 并且读取文件的位置从第0个
//   fs.read(fd, buffer, 0, buffer.length, 0, function (err, bytesRead) {
//     // bytesRead 真实读取到的个数
//     console.log(bytesRead, buffer.toString());

// 		// 向 2.txt 文件写入
//     fs.open(path.resolve(__dirname, "2.txt"), "w", function (err, fd) {
//       fs.write(fd, buffer, 0, bytesRead, 0, function (err, writeItem) {});
//     });
//   });
// });

// const event = require('events');

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


