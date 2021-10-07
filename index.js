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
      socket.write(pack(args));
   })
}

module.exports = (key='')=>{
  const server = node.createServer();
  const keyPair = crypto.keyPair(crypto.data(Buffer.from(key)));
  server.listen(keyPair);
  const commands = {};
  server.on("connection", function(socket) {
    socket.on('error', function(e){throw e});
    socket.on("data", async args => {
      const data = unpack(args);
      const command = data['_command_'];
      try {
        socket.write(pack(await commands[command](data)));
      } catch(error) {
        console.log({error})
        socket.write(pack({error}));
      }
      socket.end();
    });
  });
  return {
    serve: (command, cb)=>{
      commands[command]=cb;
    },
    run:(command, args={})=>{
      args['_command_']=command;
      return runKey(keyPair.publicKey, args)
    },
    runKey:(publicKey, command, args={})=>{
      args['_command_']=command;
      return runKey(publicKey, args)
    }
  }
}
