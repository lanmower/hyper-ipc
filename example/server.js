const RPCServer = require("../").server;
const RPCSlave = require("../").slave;
 

var worker = RPCSlave({
  topic: "bla",
  name: "example"
});

var rpc = RPCServer("bla");

rpc.ready = id => {
  console.log('ready');
};
worker.register("welcome", (name) => {return "hello <br>" + name});

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
 