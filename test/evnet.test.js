describe('evnet', function () {

  function rndPort() {
    return 9300 + Math.round(Math.random() * 1000)
  }

  function delayEmit(evnet, eventName, data) {
    setTimeout(function () {
      evnet.emit(eventName, data)
    }, 10)
  }

  describe('start()', function () {

    it('should start a server', function () {

      var evnet = require('..')
        , port = rndPort()
        , server = evnet.start('0.0.0.0', port)
      server.close()

    })

    it('should start a server on default port if none is given', function () {

      var evnet = require('..')
        , server = evnet.start('0.0.0.0')

      server.ports.should.eql([9873])
      server.close()

    })

    describe('close()', function () {

      it('should emit a close event', function (done) {
        var evnet = require('..')
          , port = rndPort()
          , server = evnet.start('0.0.0.0', port)

        server.on('close', done)
        server.close()
      })

    })
  })

  it('should connect given one port', function () {

    var evnet = require('..')
      , port = rndPort()
      , server = evnet.start('0.0.0.0', port)

    evnet('0.0.0.0', port).ports.should.eql([port])
    server.close()

  })

  it('should connect on default port if none is given', function () {

    var evnet = require('..')
      , server = evnet.start('0.0.0.0')
      , e = evnet('0.0.0.0')
    e.ports.should.eql([9873])
    server.close()
    e.close()
  })

  it('should connect only once server has started', function (done) {

    var evnet = require('..')
      , e = evnet('0.0.0.0')
      , server = evnet.start('0.0.0.0')


    e.on('hello', function(data) {
      data.should.equal('world')
      server.close()
      done()
    })
    e.emit('hello', 'world')
  })

  it('should emit diagnostic messages from server', function () {

    var evnet = require('..')
      , port = rndPort()
      , server = evnet.start('0.0.0.0', port, port + 15)
      , e = evnet('0.0.0.0')

    server.on('message', function (eventName, data) {
      eventName.should.equal('hello')
      data.should.equal('world')
    })

    e.emit('hello', 'world')

    server.close()

  })

  describe('emit()', function () {

    it('should hear an emitted event', function (done) {

      var evnet = require('..')
        , port = rndPort()
        , server = evnet.start('0.0.0.0', port)
        , e = evnet('0.0.0.0', port)

      e.on('HELLO', function (data) {
        data.should.equal('world')
        server.close()
        done()
      })

      delayEmit(e, 'HELLO', 'world')
    })

    it('should hear an multiple emitted event', function (done) {
      var evnet = require('..')
        , port = rndPort()
        , server = evnet.start('0.0.0.0', port)
        , e = evnet('0.0.0.0', port)
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

    it('should allow undefined to be emitted', function (done) {
      var evnet = require('..')
        , port = rndPort()
        , server = evnet.start('0.0.0.0', port)
        , e = evnet('0.0.0.0', port)

      e.on('foo', function (data) {
        true.should.eql(typeof data === 'undefined')
        server.close()
        done()
      })

      e.emit('foo')

    })

    it('should allow null to be emitted', function (done) {
      var evnet = require('..')
        , port = rndPort()
        , server = evnet.start('0.0.0.0', port)
        , e = evnet('0.0.0.0', port)

      e.on('foo', function (data) {
        true.should.eql(data === null)
        server.close()
        done()
      })

      e.emit('foo', null)

    })

    it('should allow empty string\'\' to be emitted', function (done) {
      var evnet = require('..')
        , port = rndPort()
        , server = evnet.start('0.0.0.0', port)
        , e = evnet('0.0.0.0', port)

      e.on('foo', function (data) {
        true.should.eql(data === '')
        server.close()
        done()
      })

      e.emit('foo', '')

    })


    it('should be able to pass JavaScript objects', function (done) {
      var evnet = require('..')
        , port = rndPort()
        , server = evnet.start('0.0.0.0', port)
        , e = evnet('0.0.0.0', port)

      e.on('HELLO', function (data) {
        data.should.eql({ foo: 'bar' })
        server.close()
        done()
      })

      delayEmit(e, 'HELLO', { foo: 'bar' })

    })

    it('should throw error if JavaScript object has a circular reference', function () {
      var evnet = require('..')
        , port = rndPort()
        , server = evnet.start('0.0.0.0', port)
        , e = evnet('0.0.0.0', port)

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
      var evnet = require('..')
        , port = rndPort()
        , server = evnet.start('0.0.0.0', port)
        , e = evnet('0.0.0.0', port)

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

  describe('once()', function () {
    it('should only recieve events once', function (done) {
      var evnet = require('..')
        , port = rndPort()
        , server = evnet.start('0.0.0.0', port)
        , e = evnet('0.0.0.0', port)
        , numberTimesEmitted = 0

      server.on('close', function () {
        numberTimesEmitted.should.equal(1)
        done()
      })

      function onMessage () {
        numberTimesEmitted += 1
      }

      e.once('HELLO', onMessage)

      // Emit 2 events
      e.emit('HELLO')
      e.emit('HELLO')

      setTimeout(function () {
        server.close()
      }, 10)
    })
  })

  describe('close()', function () {
    it('should stop unestablished connections lingering', function () {
      var evnet = require('..')
        , port = rndPort()
        , e = evnet('0.0.0.0', port)
      e.close()
    })
  })
})
