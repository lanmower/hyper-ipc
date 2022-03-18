const DHT = require("@hyperswarm/dht");
const crypto = require('hypercore-crypto')
const { unpack, pack } = require('msgpackr');
const node = new DHT();

const runKey = async (key, args) => {
  return new Promise((pass, fail) => {
    console.log('calling', key.toString('hex'));
    const socket = node.connect(key);
    socket.on('open', function () {
      console.log('socket opened')
    })
    socket.on("data", (res) => {
      socket.end();
      const out = unpack(res);
      if(out && out.error) {
        fail(out.error);
        throw out;
      }
      pass(out);
    });
    socket.on('error', error => fail({ error }));
    socket.write(pack(args));
  })
}

module.exports = (key = '') => {
  return {
    serve: (command, cb) => {
      const keyPair = crypto.keyPair(crypto.data(Buffer.from(key + command)));
      console.log('serving', command, keyPair.publicKey.toString('hex'));
      const server = node.createServer({});
      server.on("connection", function (socket) {
        console.log('connection', keyPair.publicKey.toString('hex'));
        socket.on('error', function (e) { throw e });
        socket.on("data", async data => {
          try {
            socket.write(pack(await cb(unpack(data))));
          } catch (error) {
            console.trace(error);
            socket.write(pack({ error }));
          }
          socket.end();
        });
      });
      server.listen(keyPair);
      console.log('running listen...')
    },
    run: (command, args) => {
      console.log('run', command);
      const keyPair = crypto.keyPair(crypto.data(Buffer.from(key + command)));
      return runKey(keyPair.publicKey, args)
    },
    runKey
  }
}

async function exitHandler(options, exitCode) {
  if (options.cleanup) console.log('DHT Cleanup');
  if (exitCode || exitCode === 0) console.log(exitCode);
  try {
    await node.destroy([options])
  } catch (e) {

  }
  if (options.exit) process.exit(1);
}

process.on('exit', exitHandler.bind(null, { cleanup: true }));
process.on('SIGINT', exitHandler.bind(null, { exit: true }));
process.on('SIGUSR1', exitHandler.bind(null, { exit: true }));
process.on('SIGUSR2', exitHandler.bind(null, { exit: true }));
process.on('uncaughtException', exitHandler.bind(null, { exit: true }));
