var zeromq = require('zmq')
  , EventEmitter = require('events').EventEmitter

module.exports = function evnet(connectionUri, cb) {
  var pubSocket = zeromq.socket('pub')
  var self = new EventEmitter()

  pubSocket.bind(connectionUri, function(error) {

    if (error) {
      if (error.message === 'Invalid argument') {
        error = new Error('Invalid connection URI \'' + connectionUri + '\'')
      }
      return cb(error)
    }

    self.emit('connect', connectionUri)

    function emit(eventName, data) {
      var message = JSON.stringify(data)
      pubSocket.send(eventName + message)
    }

    function on(eventName, fn) {
      var subSocket = zeromq.socket('sub')
      subSocket.connect(connectionUri)
      subSocket.subscribe(eventName)
      subSocket.on('message', function(data) {
        fn(JSON.parse(data.slice(eventName.length).toString()))
      })
    }

    function close() {
      pubSocket.close()
    }

    self.on = on

    if (typeof cb === 'function') {
      cb(null,
      { on: on
      , emit: emit
      , close: close })
    }
  })
  return self
}