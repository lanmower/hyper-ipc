const RPC = require("../");
 

var rpc = new RPC("bla", "server");
var worker = new RPC("bla","worker");

rpc.ready = id => {
  console.log('ready');
};
worker.register("welcome", (name) => {return "hello <br>" + name});

const welcome = async (req, res) => {
  const result = await rpc.run(rpc.get("worker"), "welcome", new Date().toString());
  res.send(result);
};
 
const express = require("express");
const app = express();
app.get("/", welcome);

const listener = app.listen(process.env.PORT, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
 