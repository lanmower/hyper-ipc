const RPCServer = require("hyperrpc").server;
//const RPCSlave = require("hyperrpc").slave;
var rpc = RPCServer("blabla");

/*var worker = RPCSlave({
  topic: "test",
  name: "example"
});*/

//worker.register("welcome", (name) => {return "hello <br>" + name});
rpc.ready = id => {
  console.log('ready')
};

const welcome = async (req, res) => {
  console.log('runnin rpc');
  const result = await rpc.run(rpc.get("example"), "welcome", new Date().toString());
  res.send(result);
};

const express = require("express");
const app = express();
app.get("/welcome", welcome);

const listener = app.listen(process.env.PORT, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
