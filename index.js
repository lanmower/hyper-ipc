const DHT = require("@hyperswarm/dht");
const crypto = require('hypercore-crypto')

const node = new DHT({});

const runKey = (key, args, cb)=>{
   return new Promise(resolve=>{
      const socket = node.connect(key);
      socket.on("data", (res)=>{
        cb(null, res);
        socket.end();
        resolve(res);
      });
      socket.on('error', function(e){throw e});
      socket.write(args);
   })
}

module.exports = (key='')=>{
  return {
    serve: (command, cb)=>{
      return new Promise(resolve=>{
        const keyPair = crypto.keyPair(crypto.data(Buffer.from(key+command)));
        const server = node.createServer();
        server.on("connection", function(socket) {
          socket.on('error', function(e){throw e});
          socket.on("data", async data => {
            cb(data, (err, output)=>{
              if(err) throw err;
              socket.write(output);
              socket.end();
              resolve(output);
            });
          });
        });
        server.listen(keyPair);
      })
    },
    run:(command, args, cb)=>{
      const keyPair = crypto.keyPair(crypto.data(Buffer.from(key+command)));
      return runKey(keyPair.publicKey, args, cb)
    },
    runKey:(key, args, cb)=>{
      return runKey(key, args, cb);
    }
  }
}
