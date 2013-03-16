var zeromq = require('zmq')
  , EventEmitter = require('events').EventEmitter

module.exports = evnet

function startServer(ip, repPort, pubPort) {
  var self = new EventEmitter()
    , repSocket = zeromq.socket('pull')
    , pubSocket = zeromq.socket('pub')

  repSocket.bindSync('tcp://' + ip + ':' + repPort)
  pubSocket.bindSync('tcp://' + ip + ':' + pubPort)

  repSocket.on('message', function (data) {
    self.emit('message', data.toString())
    pubSocket.send(data)
  })

  function close() {
    repSocket.close()
    pubSocket.close()
  }
  self.close = close
  return self
}
evnet.startServer = startServer

function evnet(ip, reqPort, subPort) {
  var reqSocket = zeromq.socket('push')

  reqSocket.connect('tcp://' + ip + ':' + reqPort)

  var self = {}

  function emit(eventName, data) {
    var message = JSON.stringify(data)
    reqSocket.send(eventName + message)
  }

  function on(eventName, fn) {
    var subSocket = zeromq.socket('sub')
    subSocket.connect('tcp://' + ip + ':' + subPort)
    subSocket.subscribe(eventName)
    subSocket.on('message', function(data) {
      fn(JSON.parse(data.slice(eventName.length).toString()))
    })
  }

  self.emit = emit
  self.on = on

  return self
}