const { RPCServer } = require("hyperrpc");
const { RPCSlave } = require("hyperrpc");

var rpc = RPCServer("test");

var worker = RPCSlave({
  topic: "test",
  name: "example"
});

rpc.ready = id => {};
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
