var zeromq = require('zmq')
  , EventEmitter = require('events').EventEmitter

module.exports = evnet

function setPorts(repPort, pubPort) {
  if (typeof repPort === 'undefined') {
    repPort = 9873
  }

  if (repPort === pubPort) {
    throw new Error('Must provide two different ports')
  }

  if (typeof pubPort === 'undefined') {
    pubPort = repPort + 1
  }
  return [repPort, pubPort]
}

function start(ip, repPort, pubPort) {

  var self = new EventEmitter()
    , repSocket = zeromq.socket('pull')
    , pubSocket = zeromq.socket('pub')

  self.ports = setPorts(repPort, pubPort)

  repSocket.bindSync('tcp://' + ip + ':' + self.ports[0])
  pubSocket.bindSync('tcp://' + ip + ':' + self.ports[1])

  repSocket.on('message', function (data) {
    var stringData = data.toString()
      , seperator = stringData.indexOf('\0')
    self.emit('message', stringData.substring(0, seperator),
      stringData.substring(seperator))
    pubSocket.send(data)
  })

  function close() {
    repSocket.close()
    pubSocket.close()
  }

  self.close = close

  return self
}
evnet.start = start

function evnet(ip, reqPort, subPort) {
  var reqSocket = zeromq.socket('push')
    , self = {}

  self.ports = setPorts(reqPort, subPort)

  reqSocket.connect('tcp://' + ip + ':' + self.ports[0])

  function emit(eventName, data) {
    if (typeof data === 'undefined') {
      reqSocket.send(eventName + '\0')
    } else {
      var message = JSON.stringify(data)
      reqSocket.send(eventName + '\0' + message)
    }
  }

  function on(eventName, fn) {
    var subSocket = zeromq.socket('sub')
    subSocket.connect('tcp://' + ip + ':' + self.ports[1])
    subSocket.subscribe(eventName)
    subSocket.on('message', function(data) {
      var message = data.slice(eventName.length + 1).toString()
      if (message.length > 0) {
        message = JSON.parse(message)
      } else {
        message = undefined
      }

      fn(message)
    })
  }

  self.emit = emit
  self.on = on

  return self
}