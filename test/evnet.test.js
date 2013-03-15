describe('evnet', function () {

  function rndPort() {
    return 9300 + Math.round(Math.random() * 1000)
  }

  function delayEmit(evnet, eventName, data) {
    setTimeout(function () {
      evnet.emit(eventName, data)
    }, 8)
  }

  it('should error on bad connection', function (done) {
    var evnet = require('../evnet')

    evnet('BAD', function (error) {
      error.message.should.equal('Invalid connection URI \'BAD\'')
      done()
    })

  })

  it('should not allow privileged ports ', function (done) {
    var evnet = require('../evnet')

    evnet('tcp://0.0.0.0:80', function (error) {
      error.message.should.equal('Permission denied')
      done()
    })

  })

  it('should emit \'connect\' event', function (done) {
    var evnet = require('../evnet')

    evnet('tcp://0.0.0.0:' + rndPort()).on('connect', function () {
      done()
    })

  })

  describe('emit()', function () {

    it('should hear an emitted event', function (done) {
      var evnet = require('../evnet')

      evnet('tcp://0.0.0.0:' + rndPort(), function (error, e) {

        e.on('HELLO', function (data) {
          data.should.equal('world')
          e.close()
          done()
        })

        delayEmit(e, 'HELLO', 'world')
      })
    })

    it('should hear an multiple emitted event', function (done) {
      var evnet = require('../evnet')

      evnet('tcp://0.0.0.0:' + rndPort(), function (error, e) {
        var recieved = []
        e.on('HELLO', function (data) {

          recieved.push(data)
          if (recieved.length === 2) {
            recieved.should.include('world').include('foo')
            e.close()
            done()
          }
        })

        delayEmit(e, 'HELLO', 'world')
        delayEmit(e, 'HELLO', 'foo')
      })
    })


    it('should be able to pass JavaScript objects', function (done) {
      var evnet = require('../evnet')

      evnet('tcp://0.0.0.0:' + rndPort(), function (error, e) {

        e.on('HELLO', function (data) {
          data.should.eql({ foo: 'bar' })
          e.close()
          done()
        })


        delayEmit(e, 'HELLO', { foo: 'bar' })

      })
    })

    it('should throw error if JavaScript object has a circular reference', function () {
      var evnet = require('../evnet')

      evnet('tcp://0.0.0.0:' + rndPort(), function (error, e) {

        var a = { foo: 1 }
          , b = { a: a }

        a.b = b;

        (function () {
          e.emit('HELLO', a)
        }).should.throwError('Converting circular structure to JSON')

      })
    })
  })
  describe('on()', function () {
    it('should all receive emitted events', function (done) {
      var evnet = require('../evnet')

      evnet('tcp://0.0.0.0:' + rndPort(), function (error, e) {
        var recieved = []

        function onMessage (data) {

          recieved.push(data)
          if (recieved.length === 2) {
            recieved.should.eql(['world', 'world'])
            e.close()
            done()
          }
        }

        e.on('HELLO', onMessage)
        e.on('HELLO', onMessage)

        delayEmit(e, 'HELLO', 'world')
      })
    })
  })
})