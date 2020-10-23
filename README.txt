A simple server-slave rpc framework powered by socket.io.

### Installation

```
npm install --save hyperrpc
```
Then import the modules to your projects
```
// using an ES6 transpiler, like babel
import { RPCServer } from 'hyperrpc'
import { RPCSlave } from 'hyperrpc'

// not using an ES6 transpiler
var RPCServer = require('hyperrpc').RPCServer
var RPCSlave = require('hyperrpc').RPCSlave
```

### Usage by exampley

RPC SERVER
```
const { RPCServer } = require("../src");

var rpc = RPCServer("test");

const welcome = async (req, res) => {
  const result = await rpc.run(rpc.get("example"), "welcome", new Date().toString());
  res.send(result);
};

const express = require("express");
const app = express();
app.get("/welcome", welcome);

const listener = app.listen(process.env.PORT, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
```

WORKER
```
const { RPCSlave } = require("../src");
var worker = RPCSlave({
  topic: "test",
  name: "example"
});
worker.register("welcome", (name) => {return "hello <br>" + name});

```