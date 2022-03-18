const node = require('../index.js')();
node.serve('hello.world', async (args) => {
  return 'henlo';
});
