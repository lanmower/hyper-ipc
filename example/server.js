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



//this part is just for glitch to stop loading
const express = require("express");
const app = express();
const listener = app.listen(process.env.PORT, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
 