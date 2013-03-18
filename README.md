# evnet

ZeroMQ based event dispatcher

[![build status](https://secure.travis-ci.org/serby/evnet.png)](http://travis-ci.org/serby/evnet)

## Installation

### ZeroMQ Installation

#### Mac OsX

      brew install zmq

#### Debian derivatives; Ubuntu etc

      sudo apt-get install libzmq1
      sudo apt-get install libzmq-dev

## NPM Install

      npm install evnet

## Usage

### Start a server

```js
var evnet = require('../evnet')
evnet.start('0.0.0.0')
```

### Listen

```js
var evnet = require('../evnet')
  , e = evnet('0.0.0.0')

e.on('HELLO', function (data) {
  console.log('I got this:', data)
})

```

### Emit

```js
var evnet = require('../evnet')
  , e = evnet('0.0.0.0')

e.emit('HELLO', [{ foo: 'World' }])
```

## Credits
[Paul Serby](https://github.com/serby/) follow me on twitter [@serby](http://twitter.com/serby)

## Licence
Licensed under the [New BSD License](http://opensource.org/licenses/bsd-license.php)