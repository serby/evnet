describe('evnet', function () {

  function rndPort() {
    return 9300 + Math.round(Math.random() * 1000)
  }

  function delayEmit(evnet, eventName, data) {
    setTimeout(function () {
      evnet.emit(eventName, data)
    }, 10)
  }

  describe('emit()', function () {

    it('should hear an emitted event', function (done) {

      var evnet = require('../evnet')
        , port = rndPort()
        , server = evnet.startServer('0.0.0.0', port, port + 1)
        , e = evnet('0.0.0.0', port, port + 1)

      e.on('HELLO', function (data) {
        data.should.equal('world')
        server.close()
        done()
      })

      delayEmit(e, 'HELLO', 'world')
    })

    it('should hear an multiple emitted event', function (done) {
      var evnet = require('../evnet')
        , port = rndPort()
        , server = evnet.startServer('0.0.0.0', port, port + 1)
        , e = evnet('0.0.0.0', port, port + 1)
      var recieved = []
      e.on('HELLO', function (data) {
        recieved.push(data)
        if (recieved.length === 2) {
          recieved.should.include('world').include('foo')
          server.close()
          done()
        }
      })

      delayEmit(e, 'HELLO', 'world')
      delayEmit(e, 'HELLO', 'foo')

    })


    it('should be able to pass JavaScript objects', function (done) {
      var evnet = require('../evnet')
        , port = rndPort()
        , server = evnet.startServer('0.0.0.0', port, port + 1)
        , e = evnet('0.0.0.0', port, port + 1)

      e.on('HELLO', function (data) {
        data.should.eql({ foo: 'bar' })
        server.close()
        done()
      })

      delayEmit(e, 'HELLO', { foo: 'bar' })

    })

    it('should throw error if JavaScript object has a circular reference', function () {
      var evnet = require('../evnet')
        , port = rndPort()
        , server = evnet.startServer('0.0.0.0', port, port + 1)
        , e = evnet('0.0.0.0', port, port + 1)

      var a = { foo: 1 }
        , b = { a: a }

      a.b = b;

      (function () {
        e.emit('HELLO', a)
      }).should.throwError('Converting circular structure to JSON', function () {
        server.close()
      })

    })
  })
  describe('on()', function () {
    it('should all receive emitted events', function (done) {
      var evnet = require('../evnet')
        , port = rndPort()
        , server = evnet.startServer('0.0.0.0', port, port + 1)
        , e = evnet('0.0.0.0', port, port + 1)

      var recieved = []

      function onMessage (data) {

        recieved.push(data)
        if (recieved.length === 2) {
          recieved.should.eql(['world', 'world'])
          server.close()
          done()
        }
      }

      e.on('HELLO', onMessage)
      e.on('HELLO', onMessage)

      delayEmit(e, 'HELLO', 'world')
    })
  })
})