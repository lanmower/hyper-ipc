const hyperswarm = require("hyperswarm");
const crypto = require("crypto");
const carrier = require("carrier");
function isFunction(obj) {
  return obj && {}.toString.call(obj) === "[object Function]";
}
function uuidv4() {
  return crypto.randomBytes(16).toString("hex");
}

class Slave {
  constructor(conf) {
    const topic = crypto
      .createHash("sha256")
      .update(conf.topic)
      .digest();
    this.swarm = hyperswarm();

    this.swarm.join(topic, {
      lookup: true, // find & connect to peers
      announce: true // optional- announce self as a connection target
    });
    this.id = uuidv4();
    this.name = conf.name;

    this._handleEvents();

    this.funcMap = {};
  }

  register(funcName, func) {
    this.funcMap[funcName] = func;
  }

  _handleEvents() {
    const swarm = this.swarm;
    swarm.on("connection", (socket, details) => {
      var my_carrier = carrier.carry(socket);
      my_carrier.on("line", async data => {
        var json = null;
        try {
          json = JSON.parse(data.toString());
          if (json.event == "rpc_exec") {
            const funcName = json.funcName;
            if (!isFunction(this.funcMap[funcName])) {
              const res = JSON.stringify({
                event: "result",
                id: this.id,
                payload: json,
                success: false,
                result: { error: "Non registered function " + funcName }
              });
              socket.write(res + "\r\n");
              return res;
            }
 
            var res = this.funcMap[funcName].apply(null, json.payload);
            if (isFunction(res.then) && isFunction(res.catch)) {
              res
                .then(data => {
                  const res = JSON.stringify({
                    event: "result",
                    payload: json,
                    id: this.id,
                    success: true,
                    result: data.toString()
                  });
                  socket.write(res + "\r\n");
                })
                .catch(error => {
                  const res = JSON.stringify({
                    event: "result",
                    payload: json,
                    id: this.id,
                    success: false,
                    result: { error }
                  });
                  socket.write(res + "\r\n");
                });
            } else {
              socket.write(
                JSON.stringify({
                  event: "result",
                  payload: json,
                  id: this.id,
                  success: true,
                  result: res
                }) + "\r\n"
              );
            }
          }
        } catch (e) {
          console.error(e);
        }
      });
      socket.write(
        JSON.stringify({
          event: "meta",
          payload: { id: this.id, name: this.name, type: "slave" }
        }) + "\r\n"
      );
    });
  }
}

module.exports = function(server) {
  return new Slave(server);
};
