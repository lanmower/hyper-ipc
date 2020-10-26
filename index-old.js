const hyperswarm = require("hyperswarm");
const crypto = require("crypto");
const carrier = require("carrier");

function uuidv4() {
  return crypto.randomBytes(16).toString("hex");
}

const result = async (self, data, socket, id) => {
  const { uuid } = data.payload;
  if (self.rpcs[id].expect[uuid]) {
    self.rpcs[id].expect[uuid].cb(data);
  }
}; 

const exec = async (self, data, socket) => {
  const funcName = data.funcName;
  if (!isFunction(self.funcMap[funcName])) {
    socket.write(
      JSON.stringify({
        event: "result",
        id: this.id,
        payload: data,
        success: false,
        result: { error: "Non registered function " + funcName }
      }) + "\r\n"
    );
  }

  var result = await self.funcMap[funcName].apply(null, data.payload);
  const res = JSON.stringify({
    event: "result",
    payload: data,
    id: this.id,
    success: true,
    result
  });
  socket.write(res + "\r\n");
};

class RPC {
  constructor(conf) {
    this.id = uuidv4();
    const self = this;
    this.connected = 0;
    this.swarm = hyperswarm();
    const topic = crypto
      .createHash("sha256")
      .update(conf.topic)
      .digest();
    this.name = conf.name;

    this.swarm.join(topic, {
      lookup: true, // find & connect to peers
      announce: true // optional- announce self as a connection target
    });
    this.rpcs = {};
    this._handleEvents();
    this.funcMap = {};
    setInterval(() => {
      if (new Date().getTime() - self.connected > 21000) {
        self.swarm.join(topic, {
          lookup: true, // find & connect to peers
          announce: true // optional- announce self as a connection target
        });
      }
    }, 10000);
  }

  get(name) {
    var filtered = Object.keys(this.rpcs)
      .map(key => this.rpcs[key])
      .filter(slave => slave.payload.name == name);
    return filtered.length ? filtered[0].payload.id : null;
  }

  getRpcs() {
    return this.rpcs;
  }

  register(funcName, func) {
    this.funcMap[funcName] = func;
  }

  run(id, funcName, ...params) {
    return new Promise((resolve, reject) => {
      if (!this.rpcs[id] || !this.rpcs[id].socket) {
        return reject("Invalid slave id " + id);
      } else {
        var socket = this.rpcs[id].socket;
        const uuid = uuidv4();
        socket.write(
          JSON.stringify({
            event: "rpc_exec",
            funcName,
            uuid,
            payload: params
          }) + "\r\n"
        );
        let done = false;
        this.rpcs[id].expect[uuid] = {
          time: new Date().getTime(),
          cb: res => {
            done = true;
            if (res.success) {
              resolve(res.result);
            } else {
              reject(res.error);
            }
          }
        };
        setTimeout(() => {
          if (!done) reject("Timeout runnig RPC");
        }, 60000);
      }
    });
  }

  _handleEvents() {
    var self = this;
    this.swarm.on("connection", (socket, details) => {
      let id;

      var read_carrier = carrier.carry(socket);
      const interval = setInterval(() => {
        socket.write(JSON.stringify({ event: "ping" }) + "\r\n");
      }, 10000);
      var read_carrier = carrier.carry(socket);
      socket.on("close", () => {
        clearInterval(interval);
        console.log("closed", id);
        if (this.rpcs[id]) {
          this.rpcs[id] = null;
          delete this.rpcs[id];
        }
        self.connected = 0;
      });
      read_carrier.on("line", async data => {
        this.connected = new Date().getTime();
        var json = null;
        try {
          data = JSON.parse(data.toString());
          switch(data.event) {
            case "rpc_exec":
              return await exec(self, data, socket);
            case "meta":
              id=data.payload.id;
              const { type, uuid } = data.payload;
              if (type == "slave") {
                const slave = {
                  socket: socket,
                  expect: {},
                  ...data
                };
                if (self.ready && !self.rpcs[id]) {
                  self.rpcs[id] = slave;
                  self.ready(id, slave);
                }
              }
              break;
            case "result":
              return await result(self, data, socket, id);
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

function isFunction(obj) {
  return obj && {}.toString.call(obj) === "[object Function]";
}

module.exports = RPC;
