'use strict';

const path = require('path'),
      util = require('util'),
      events = require('events'),
      cp = require('child_process');

function Driver(fullname, identity, username, password) {
  let _args = {
    fullname: fullname,
    identity: identity,
    username: username,
    password: password
  }

  Object.defineProperty(this, 'fullname', {
    get: () => { return _args.fullname },
    set: (value) => { _args.fullname = value }
  })

  Object.defineProperty(this, 'identity', {
    get: () => { return _args.identity },
    set: (value) => { _args.identity = value }
  })

  Object.defineProperty(this, 'username', {
    get: () => { return _args.username },
    set: (value) => { _args.username = value }
  })

  Object.defineProperty(this, 'password', {
    get: () => { return _args.password },
    set: (value) => { _args.password = value }
  })
}

util.inherits(Driver, events.EventEmitter);

Driver.prototype.toSpawn =  function(command='casperjs') {
  const args = [
    path.join(__dirname, 'external/tercerizacion.js'),
    this.identity,
    this.username,
    this.password,
    '20504561292',
    '30/06/2018'
  ];

  const child = cp.spawn(command, args);

  child.stdout.setEncoding('utf8');

  child.stderr.setEncoding('utf8');

  child.stdout.on('data', (data) => {
    this.emit('data', data)
  });

  child.stderr.on('data', (data) => {
    this.emit('error', data);
  });

  /*child.on('close', (code) => {
    // NOTE: When stdio streams close
    if (code === 0) {
      this.emit('end', 'child terminated (success close)!');
    } else {
      this.emit('end', 'child terminated (failure close)!');
    }
  });*/

  // NOTE: When process ends
  child.on('exit', (code) => {
    if (code === this.SUCCESS_CODE) {
      this.emit('success', 'Proceso concluido (éxito)!');
    } else {
      this.emit('failure', 'Proceso concluido (facaso)!');
    }
  });

  /*child.on('error', (code) => {
    // NOTE: When error occurs
    this.emit('end', 'was error');
  });*/
}

Driver.prototype.SUCCESS_CODE = 0;

module.exports = Driver;
