'use strict';

const util = require('util');
const events = require('events');

const Driver = function(fullname, identity, username, password) {
  let _args = {
    fullname: fullname,
    identity: identity,
    username: username,
    password: password
  };

  Object.defineProperty(this, 'fullname', {
    get: () => { return _args.fullname },
    set: (value) => { _args.fullname = value }
  });

  Object.defineProperty(this, 'identity', {
    get: () => { return _args.identity },
    set: (value) => { _args.identity = value }
  });

  Object.defineProperty(this, 'username', {
    get: () => { return _args.username },
    set: (value) => { _args.username = value }
  });

  Object.defineProperty(this, 'password', {
    get: () => { return _args.password },
    set: (value) => { _args.password = value }
  });
}

util.inherits(Driver, events.EventEmitter);

module.exports = Driver;
