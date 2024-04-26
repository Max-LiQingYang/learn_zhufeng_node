const fs = require('fs');
const path = require('path');

const rs = fs.createReadStream(path.resolve(__dirname, '1.txt'), {
    highWaterMark: 4,
});

const ws = fs.createWriteStream(path.resolve(__dirname, '2.txt'), {
    highWaterMark: 1,
});

// 读一点写一点
rs.on("data", function (data) {
    let flag = ws.write(data); // 返回当前是否要继续读取
    if (!flag) {
        rs.pause();
    }
});

rs.on('end', function() {
    ws.end();
});

// 所有数据都写入到文件后执行该事件(满足预期 hightWaterMark 才会触发)
ws.on("drain", function () {
    rs.resume();
});

