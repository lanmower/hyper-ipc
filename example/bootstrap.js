const DHT = require("@hyperswarm/dht");
const node = new DHT({
    adaptive: true,
    maxAge: 12 * 60 * 1000
})