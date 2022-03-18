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
const node = require('hyper-ipc')('secrettopic');
const node2 = require('hyper-ipc')('secrettopic');

//serve code that can be called from anywhere
node.serve('helloworld', async (args) => {
  return 'henlo';
});
//call code remotely
node2.run('helloworld').then(console.log).catch(console.error);
```

Communication is noise encrypted.
