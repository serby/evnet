const evnet = require('.')
const rndPort = () => 9300 + Math.round(Math.random() * 1000)
const assert = require('assert')
const tests = [
  {
    name: 'Send String',
    fn: count => new Promise(resolve => {
      const port = rndPort()
      const server = evnet.start('0.0.0.0', port)
      const e = evnet('0.0.0.0', port)
      let counter = 0
      e.on('foo', data => {
        counter += 1
        if (counter >= count) {
          server.close()
          e.close()
          resolve()
        }
      })
      for (let i = 0; i < count; i++) {
        e.emit('foo', 'bar')
      }
    })
  },
  {
    name: 'Send Object',
    fn: count => new Promise(resolve => {
      const port = rndPort()
      const server = evnet.start('0.0.0.0', port)
      const e = evnet('0.0.0.0', port)
      let counter = 0
      e.on('foo', data => {
        assert.deepStrictEqual(data, { a: 1, b: 2, c: 3 })
        counter += 1
        if (counter >= count) {
          server.close()
          e.close()
          resolve()
        }
      })
      for (let i = 0; i < count; i++) {
        e.emit('foo', { a: 1, b: 2, c: 3 })
      }
    })
  }
  ,
  {
    name: 'Lots of `on`',
    fn: count => new Promise(resolve => {
      const port = rndPort()
      const server = evnet.start('0.0.0.0', port)
      const e = evnet('0.0.0.0', port)
      let counter = 0
      for (let i = 0; i < count; i++) {
        e.on('foo', data => {
          assert.deepStrictEqual(data, { a: 1, b: 2, c: 3 })
          counter += 1
          if (counter >= count) {
            e.close()
            server.close()
            resolve()
          }
        })
      }
      e.emit('foo', { a: 1, b: 2, c: 3 })
    })
  }
]

const  main = async () => {
  const runs = process.env.COUNT || 10000
  for (let test of tests) {
    const startTime = Date.now()
    await test.fn(runs)
    console.log(`${Date.now() - startTime}ms ${test.name}`)
  }
}

main()
