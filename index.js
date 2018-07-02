'use strict';

const path = require('path'),
      util = require('util'),
      events = require('events'),
      cp = require('child_process');

function Bot(params) {
  let _args = {
    params: params
  }

  Object.defineProperty(this, 'params', {
    get: () => { return _args.params },
    set: (value) => { _args.params = value }
  })
}

util.inherits(Bot, events.EventEmitter);

Bot.prototype.SUCCESS_CODE = 0;

Bot.prototype.COMMAND = 'casperjs';

Bot.prototype.ENTRYPOINT = (
  path.join(__dirname, '/external/tercerizacion.js')
);

Bot.prototype.execute = function() {
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
    this.emit('error', err.message);
  });
}

module.exports = Bot;
