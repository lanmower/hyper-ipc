const hyperswarm = require( "hyperswarm");
const crypto = require("crypto");
const carrier = require('carrier');

function uuidv4() {
  return crypto.randomBytes(16).toString("hex");
}
class Server {
  constructor(conftopic) {
    this.swarm = hyperswarm();
    const topic = crypto
      .createHash("sha256")
      .update(conftopic)
      .digest();

    this.swarm.join(topic, {
      lookup: true, // find & connect to peers
      announce: true // optional- announce self as a connection target
    });
    this.slaves = {};
    this._handleEvents();
  }

  get(name) {
    var filtered = Object.keys(this.slaves)
      .map(key => this.slaves[key])
      .filter(slave => slave.payload.name == name);
    return filtered.length ? filtered[0].payload.id : null;
  }

  getSlaves() {
    return this.slaves;
  }

  run(id, funcName, ...params) {
    return new Promise((resolve, reject) => {
      if (!this.slaves[id] || !this.slaves[id].socket) {
        return reject("Invalid slave id " + id);
      } else {
        var socket = this.slaves[id].socket;
        const uuid = uuidv4();
        socket.write(
          JSON.stringify({ event: "rpc_exec", funcName, uuid, payload: params })+"\r\n"
        );
        this.slaves[id].expect[uuid] = {
          time: new Date().getTime(),
          cb: res => {
            if (res.success) {
              resolve(res.result);
            } else {
              reject(res.error);
            }
          }
        };
      }
    });
  }

  _handleEvents() {
    var self = this;
    this.swarm.on("connection", (socket, details) => {
      var id;
      
      var my_carrier = carrier.carry(socket);
      setInterval(()=>{
        socket.write(
          JSON.stringify({ event: "ping" })+"\r\n"
        );
      },10000)

        socket.on("close", () => {
          console.log('closed', id);
          if (this.slaves[id]) {
            this.slaves[id] = null;
            delete this.slaves[id];
          }
        });
      my_carrier.on("line", async data => {
        var json = null;
        try { 
          data = JSON.parse(data.toString());

          if (data.event == "meta") {
            if (data.payload.type == "slave") {
              id = data.payload.id;
              const slave = {
                socket: socket,
                expect: {},
                ...data
              };
              if (self.ready && !self.slaves[data.payload.id]) {
                self.slaves[data.payload.id] = slave;
                self.ready(data.payload.id, slave);
              }
            }
          }
          if (data.event == "result") {
            if (this.slaves[data.id].expect[data.payload.uuid]) {
              this.slaves[data.id].expect[data.payload.uuid].cb(data);
            }
          }
        } catch (e) {
          console.error(e);
        }
      });
    });
  }
}

module.exports.server = function(server) {
  return new Server(server);
}

function isFunction(obj) {
  return obj && {}.toString.call(obj) === "[object Function]";
}

class Slave {
  constructor(conf) {
    const topic = crypto
      .createHash("sha256")
      .update(conf.topic)
      .digest();
    this.swarm = hyperswarm();

    this.id = uuidv4();
    this.name = conf.name;
    const self = this;
    setInterval(()=>{
      if(!self.connected) {
        self.swarm.join(topic, {
          lookup: true, // find & connect to peers
          announce: true // optional- announce self as a connection target
        });
      }
    },10000)

    this._handleEvents();

    this.funcMap = {};
  }

  register(funcName, func) {
    this.funcMap[funcName] = func;
  }

  _handleEvents() {
    const swarm = this.swarm;
    var self = this;
    swarm.on("connection", (socket, details) => {
      var my_carrier = carrier.carry(socket);
      socket.on("close", () => {
        console.log('closed', self.id);
        self.connected = false;
      }); 
      my_carrier.on("line", async data => {
        var json = null;
        try { 
          this.connected = new Date().getTime();
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

module.exports.slave = function(server) {
  return new Slave(server);
}
