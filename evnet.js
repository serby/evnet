var zeromq = require('zeromq')
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
  self.ports = setPorts(repPort, pubPort)

  var repSocket = zeromq.socket('pull')
  var pubSocket = zeromq.socket('pub')

  repSocket.bindSync('tcp://' + ip + ':' + self.ports[0])
  pubSocket.bindSync('tcp://' + ip + ':' + self.ports[1])

  repSocket.on('message', function (packet) {
    pubSocket.send(packet)
    var stringData = packet.toString()
      , seperator = stringData.indexOf('\0')
      , data = stringData.substring(seperator + 1)
      , formatted
    formatted = data ? JSON.parse(data) : data
    self.emit('message', stringData.substring(0, seperator), formatted)
  })

  function close() {
    self.emit('close')
    repSocket.close()
    pubSocket.close()
  }

  self.close = close

  return self
}
evnet.start = start

// Connect to the evnet server {ip} so you can listen for events
function evnet(ip, reqPort, subPort) {

  var self = {
      ports: setPorts(reqPort, subPort)
    }
    // Connection to the event bus server
    , reqSocket = zeromq.socket('push')
    // The connected subs
    , subSockets = []
    , listeners = {}

  reqSocket.connect('tcp://' + ip + ':' + self.ports[0])

  // Sends an event to the server to broadcast
  function emit(eventName, data) {
    if (typeof data === 'undefined') {
      reqSocket.send(eventName + '\0')
    } else {
      var message = JSON.stringify(data)
      reqSocket.send(eventName + '\0' + message)
    }
  }

  // Listen to events broadcast from the server
  function on(eventName, fn) {
    if (listeners[eventName]) {
      listeners[eventName].fns.push(fn)
      return listeners[eventName].socket
    }

    // Create a sub for each eventName
    var subSocket = zeromq.socket('sub')
    listeners[eventName] = { socket: subSocket, fns: [ fn ] }
    //  Track so we can close
    subSockets.push(subSocket)
    subSocket.connect('tcp://' + ip + ':' + self.ports[1])
    subSocket.subscribe(eventName)
    subSocket.on('message', function(data) {
      var message = data.slice(eventName.length + 1).toString()
      if (message.length > 0) {
        message = JSON.parse(message)
      } else {
        message = undefined
      }
      listeners[eventName].fns.forEach(function (fn) {
        fn(message)
      })
    })

    return subSocket
  }

  // Listen to events once
  function once(eventName, fn) {
    var called = false
      , subSocket

    function onceFn() {
      if (called === true) {
        try {
          subSocket.close()
        } catch (e) {
        }
        return
      }
      called = true
      fn.apply(null, arguments)
    }

    subSocket = on(eventName, onceFn)
  }

  // Close up any open connections
  function close() {
    reqSocket.close()
    subSockets.forEach(function(subSocket) {
      try {
        subSocket.close()
      } catch (e) {}
    })
  }

  self.close = close
  self.emit = emit
  self.on = on
  self.once = once

  return self
}
