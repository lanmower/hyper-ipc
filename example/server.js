const node = require('../index.js')();
const node2 = require('../index.js')();

//serve code that can be called from anywhere
node.serve('helloworld', async (args) => {
  return 'henlo';
});
//call code remotely
node2.run('helloworld').then(console.log).catch(console.error);