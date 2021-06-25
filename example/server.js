const node = require('../index.js')();
const node2 = require('../index.js')();

node.serve('helloworld', async (query, callback) => {
  console.log('hello world');
  callback(null, 'done');
});

async function run() { 
  node2.run('helloworld', console.log)
}
