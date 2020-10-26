const hyperswarm = require("hyperswarm");
const crypto = require("crypto");
const getId = topic => {
  return crypto
    .createHash("sha256")
    .update(topic||new Date().getTime().toString())
    .digest();
};

function server(conftopic, name) {
  const localId = getId(new Date().getTime().toString());
  const swarm = hyperswarm();
  const topic = getId(conftopic);
  const nodes = {};
  const funcmap = {};
  swarm.on("connection", (socket, info) => {
    const send = {
      id: localId.toString(),
      event: "register",
      name
    };
    socket.write(JSON.stringify(send));
    socket.on("data", async json => {
      try {
        const data = JSON.parse(json);
        const { id } = data;
        if (data.event == "resolve") {
          console.log("resolve", nodes[id].awaits[data.callId].call(data.result));
        }
        if (data.event == "register") {
          if (info.deduplicate(localId, Buffer.from(id, "utf8"))) {
            return;
          }
          nodes[id] = { ...data, awaits: {}, socket };
        }
        if (data.event == "run") {
          const { callId, payload, funcname } = data;
          const result = await funcmap[funcname](payload);
          const send = {
            id: localId.toString(),
            event: "resolve",
            callId,
            result
          };
          socket.write(JSON.stringify(send));
        }
      } catch (e) {
        console.error(e);
      }
    });
  });
  swarm.join(topic, { lookup: true, announce: true });

  return {
    register: (funcname, func) => {
      funcmap[funcname] = func;
    },
    get(name) {
      var filtered = Object.keys(nodes)
        .map(key => nodes[key])
        .filter(node => node.name == name);
      return filtered.length ? filtered[0].id : null;
    },
    run: async (id, funcname, payload) => {
      const node = nodes[id];
      const callId = getId().toString();
      const send = {
        id: localId.toString(),
        event: "run",
        funcname,
        callId,
        payload
      };
      node.socket.write(JSON.stringify(send));
      let res = null;
      return new Promise(resolve => {
        let done = false;
        res = resolve;
        node.awaits[callId] = {
          call: resolve => {
            done = true;
            delete node.awaits[callId];
            res(resolve);
          }
        };
        setTimeout(() => {
          if (!done) {
            res = null;
            delete node.awaits[callId];
          }
        }, 60000);
      });
    }
  };
}

module.exports = server;
