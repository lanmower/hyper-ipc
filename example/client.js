const node2 = require('../index.js')();
setInterval(function () {
  console.log('RUN')
  node2.run('hello.world').then(console.log).catch(console.error);
}, 5000)
