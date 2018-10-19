var Primus = require('primus')
var EventEmitter = require('events').EventEmitter
var http = require('http')
var defaultPort = 9873

module.exports = evnet

function start(ip, port) {
  var self = new EventEmitter()
  var server = http.createServer()
  var primus = new Primus(server, {
    iknowhttpsisbetter: true
  })

  primus.on('connection', function (spark) {
    spark.on('data', function (data) {
      console.log('jim', data)
      primus.write(data)
    })
  })

  function close() {
    self.emit('close')
    primus.close()
  }

  self.close = close
  server.listen(port || defaultPort)
  return self
}

evnet.start = start

// Connect to the evnet server {ip} so you can listen for events
function evnet(ip, port) {
  if (port === undefined) {
    port = defaultPort
  }
  var self = new EventEmitter()
    , Socket = Primus.createSocket()
    , client = new Socket('http://' + ip + ':' + port)
    , originalEmit = self.emit.bind(self)

  client.on('error', function (e) {
    throw new Error(e)
  })

  client.on('data', function (data) {
    originalEmit(data.name, data.data)
  })

  // Sends an event to the server to broadcast
  function emit(name, data) {
    client.write({ name: name, data: data })
  }

  // Close up any open connections
  function close() {
    client.end()
  }

  self.ports = [ port ]
  self.close = close
  self.emit = emit
  self.off = self.removeEventListener

  return self
}
