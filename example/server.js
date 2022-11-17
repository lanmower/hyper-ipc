const node = require('../index.js')();
const crypto = require('hypercore-crypto');

global.kp = crypto.keyPair();

node.serve(kp, 'hello.world', async (args) => {
  return 'henlo';
});

require('./client.js');
