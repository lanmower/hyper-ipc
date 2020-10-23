const hyperswarm = require("hyperswarm");
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
        socket.on("close", () => {
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
module.exports = function(server) {
  return new Server(server);
};
/*
export default function(server) {
  return new Server(server);
}
*/
