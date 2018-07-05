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
    pse: '20504561292',
    state: '',
    observation: '',
    logs: []
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

  Object.defineProperty(this, 'state', {
    get: () => { return _args.state },
    set: (value) => { _args.state = value }
  })

  Object.defineProperty(this, 'observation', {
    get: () => { return _args.observation },
    set: (value) => { _args.observation = value }
  })

  Object.defineProperty(this, 'logs', {
    get: () => { return _args.logs },
    set: (value) => { _args.logs = value }
  })
}

Driver.prototype.toRegister = function(callback) {
  if (String(this.identity).length != 11 || String(this.username).length != 8) {
    this.state = 'NO ACTIVO';

    this.observation = 'Los datos de acceso son incorrectos';

    this.logs.push(moment().format('YYYY-MM-DD HH:mm:ss') + ' -> ' + this.observation);

    callback(null, true);

    return;
  }

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
    this.logs.push(moment().format('YYYY-MM-DD HH:mm:ss') + ' -> ' + mssg);
  })

  auth.on('error', (mssg) => {
    let message = String(mssg).trim();

    if (message != null && message != '') {
      let information = JSON.parse(message);

      switch (Number.parseInt(information.code)) {
        case 1:
          this.state = 'NO ACTIVO';
          break;
        case 2:
          this.state = 'ACTIVO';
          break;
        default:
          this.state = Number.parseInt(information.code);
      }

      this.observation = information.message;

      this.logs.push(moment().format('YYYY-MM-DD HH:mm:ss') + ' -> ' + this.observation);

      callback(null, information);
    }
  })

  auth.on('end', (mssg) => {
    this.state = 'ACTIVO';

    this.observation = `Inicio de authorización ${this.authorization}`;

    this.logs.push(moment().format('YYYY-MM-DD HH:mm:ss') + ' -> ' + this.observation);

    callback('Registrado correctamente', null);
  })
}

module.exports = Driver;
