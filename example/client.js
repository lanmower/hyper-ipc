const node2 = require('../index.js')();
setTimeout(function () {
  console.log('RUN')
  node2.run(kp.publicKey, 'hello.world').then(console.log).catch(console.error);
}, 5000)
