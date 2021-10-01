const node = require('../index.js')();
const node2 = require('../index.js')();

(async()=>{
  console.log(await node.serve('helloworld', ()=>{return 'hello world'}));
  console.log(await node2.run('helloworld'));
})()
