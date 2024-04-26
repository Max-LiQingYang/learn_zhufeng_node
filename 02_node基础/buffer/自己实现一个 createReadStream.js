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
})
