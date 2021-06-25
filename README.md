### Installation

```
npm install --save hyper-ipc
```
You can split your program into different parts, and use this library to
get one part to ask another to run code, and receive the response, 
allowing you to expose your functions remotely.

The different instances will automatically find each other and connect using
a peer-to-peer library called hyperswarm.

You can hand the constructor a secret key when you create it to make endpoints
harder to guess.

require('./ipc.js')('key');
```
const node = require('./ipc.js')();
const node2 = require('./ipc.js')();

node.serve('helloworld', async (query, callback) => {
  console.log('hello world');
  callback(null, 'done');
});

async function run() { 
  node2.run('helloworld', console.log)
}
```

Communication is noise encrypted.
