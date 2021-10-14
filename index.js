const DHT = require("@hyperswarm/dht");
const crypto = require('hypercore-crypto')
const { unpack, pack } = require('msgpackr');
const node = new DHT({});

const runKey = (key, args)=>{
   return new Promise((pass, fail)=>{
      const socket = node.connect(key);
      socket.on("data", (res)=>{
        socket.end();
        pass(unpack(res));
      });
      socket.on('error', error=>fail({error}));
      console.log(args);
      socket.write(pack(args));
   })
}

module.exports = (key='')=>{
  return {
    serve: (command, cb)=>{
      const keyPair = crypto.keyPair(crypto.data(Buffer.from(key+command)));
      const server = node.createServer();
      server.on("connection", function(socket) {
        socket.on('error', function(e){throw e});
        socket.on("data", async data => {
          try {
            socket.write(pack(await cb(unpack(data))));
          } catch(error) {
            console.log({error})
            socket.write(pack({error}));
          }
          socket.end();
        });
      });
      server.listen(keyPair);
    },
    run:(command, args)=>{
      const keyPair = crypto.keyPair(crypto.data(Buffer.from(key+command)));
      return runKey(keyPair.publicKey, args)
    },
    runKey
  }
}
