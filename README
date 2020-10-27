### Installation

```
npm install --save hyperrpc
```
You can split your program into different parts, and use this library to
get one part to ask another to run code, and receive the response, 
allowing you to expose your functions remotely.

The different instances will automatically find each other and connect using
a peer-to-peer swarm library called hyperswarm.

You specify a topic (this generates an cryptographic key) for all your instances
to listen in on as well as a name for your instance, and they will advertise on
the specified "topic" key, the library stores a registry of other instances on the
same topic and allow you to access them by name.

```
var RPC = require('hyperrpc');

//RPC SERVER
var rpc = new RPC("bla", "server"); //topic and name
rpc.ready(async id => {
  const result = await rpc.run(rpc.get("worker"), "welcome", new Date().toString());
  console.log(result);
});

//RPC WORKER
var worker = new RPC("bla","worker"); //topic and name
worker.register("welcome", (name) => {return "hello <br>" + name});

```