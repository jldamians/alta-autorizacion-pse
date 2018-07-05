'use strict';

const path = require('path'),
      util = require('util'),
      events = require('events'),
      cp = require('child_process');

function Authorization(params) {
  let _args = {
    params: params
  }

  Object.defineProperty(this, 'params', {
    get: () => { return _args.params },
    set: (value) => { _args.params = value }
  })
}

util.inherits(Authorization, events.EventEmitter);

Authorization.prototype.SUCCESS_CODE = 0;

Authorization.prototype.COMMAND = 'casperjs';

Authorization.prototype.ENTRYPOINT = (
  path.join(__dirname, '/casperjs/tercerizacion.js')
);

Authorization.prototype.execute = function() {
  const args = [this.ENTRYPOINT].concat(this.params);

  const child = cp.spawn(this.COMMAND, args);

  child.stdout.setEncoding('utf8');

  child.stderr.setEncoding('utf8');

  child.stdout.on('data', (data) => {
    this.emit('data', data)
  });

  child.stderr.on('data', (error) => {
    this.emit('error', error);
  });

  // NOTE: When process ends
  child.on('exit', (code) => {
    if (code === this.SUCCESS_CODE) {
      this.emit('end');
    }
  });

  // NOTE: When error occurs
  child.on('error', (err) => {
    let errorInformation = JSON.stringify({
      code: 0,
      message: err.message
    });

    this.emit('error', errorInformation);
  });
}

module.exports = Authorization;
