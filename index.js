const DHT = require("@hyperswarm/dht");
const crypto = require('hypercore-crypto')

const node = new DHT({});
module.exports = (key='')=>{
  return {
    serve: (command, cb)=>{
      const keyPair = crypto.keyPair(crypto.data(Buffer.from(key+command)));
      const server = node.createServer();
      server.on("connection", function(socket) {
        socket.on("data", async data => {
          cb(data, (err, output)=>{
            if(err) throw err;
            socket.write(output);
            socket.end();
          });
        });
      });
      server.listen(keyPair);
    },
    run:(command, args, cb)=>{
      const keyPair = crypto.keyPair(crypto.data(Buffer.from(key+command)));
      node.connect(keyPair.publicKey);
      const socket = node.connect(keyPair.publicKey); 
      socket.on("data", (res)=>{
        cb(null, res);
        socket.end();
      });
      socket.write(args);
    }
  }
}


process.on('uncaughtException', (err) => {
  console.error('There was an uncaught error', err)
  //process.exit(1) //mandatory (as per the Node docs)
})
