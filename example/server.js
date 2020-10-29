const RPC = require("../");
//const RPC = require("hyperrpc");

//register worker, make function available
var worker = new RPC("bla","worker");
worker.register("welcome", (name) => {return "hello <br>" + name});

//register server, request some work
var rpc = new RPC("bla", "server");
rpc.ready(async id => {
  const result = await rpc.run(rpc.get("worker"), "welcome", new Date().toString());
  console.log(result);
});

  