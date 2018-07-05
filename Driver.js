'use strict';

const moment = require('moment');

const Authorization = require('./lib');

function Driver(fullname, identity, username, password, authorization, data) {
  let _args = {
    data: data,
    fullname: fullname,
    identity: identity,
    username: username,
    password: password,
    authorization: authorization,
    pse: '20504561292'
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

  Object.defineProperty(this, 'authorization', {
    get: () => { return _args.authorization },
    set: (value) => { _args.authorization = value }
  })

  Object.defineProperty(this, 'pse', {
    get: () => { return _args.pse },
    set: (value) => { _args.pse = value }
  })

  Object.defineProperty(this, 'data', {
    get: () => { return _args.data },
    set: (value) => { _args.data = value }
  })
}

Driver.prototype.toRegister = function(callback) {
  const authorization = (
    moment(this.authorization).format('DD/MM/YYYY')
  );

  const params = [
    this.identity,
    this.username,
    this.password,
    this.pse,
    authorization
  ];

  const auth = new Authorization(params);

  auth.execute();

  auth.on('data', (mssg) => {
    console.log(`DATA [${this.fullname}]: \n ${mssg.toString()}`);
  })

  auth.on('error', (mssg) => {
    console.log(`ERROR [${this.fullname}]: \n ${mssg.toString()}`);

    callback(null, 'failed');
  })

  auth.on('end', (mssg) => {
    console.log(`END [${this.fullname}]: \n ${mssg.toString()}`);

    callback('success', null);
  })
}

module.exports = Driver;
