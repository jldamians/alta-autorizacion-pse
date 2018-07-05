'use strict';

const moment = require('moment');

const csv = require('./csv');
const Driver = require('./Driver');

function Task(authorization=moment().format('YYYY-MM-DD')) {
  let _args = {
    drivers: [],
    processed: [],
    authorization: authorization,
    index: 0
  }

  Object.defineProperty(this, 'drivers', {
    get: () => { return _args.drivers },
    set: (value) => { _args.drivers = value }
  })

  Object.defineProperty(this, 'processed', {
    get: () => { return _args.processed },
    set: (value) => { _args.processed = value }
  })

  Object.defineProperty(this, 'authorization', {
    get: () => { return _args.authorization },
    set: (value) => { _args.authorization = value }
  })

  Object.defineProperty(this, 'index', {
    get: () => { return _args.index },
    set: (value) => { _args.index = value }
  })
}

Task.prototype.readCsv = async function(path) {
  let drivers = [],
      csvContent = [];

  csvContent = await csv.read(path);

  csvContent.forEach((uc) => {
    let driver = new Driver();

    driver.data = uc;
    driver.identity = uc.ruc;
    driver.fullname = uc.name;
    driver.username = uc.username;
    driver.password = uc.password;
    driver.authorization = this.authorization;

    drivers.push(driver);
  });

  this.drivers = drivers;
}

Task.prototype.toProcess = function(callback) {
  for (var i = 0; i < this.CONCURRENT_TASKS_NUMBER; i++) {
    _process.bind(this)(callback);
  }
}

Task.prototype.writeCsv = function() {
  csv.write(this.drivers);
}

const _process = function(callback) {
  let driver = this.drivers[this.index];

  if (!driver) {
    if (this.processed.length === 0) {
      callback();
    }

    return;
  }

  // NOTE: Agregado el conductor a la cola de control
  this.processed.push(driver.identity);

  this.index++;

  // NOTE: El callback será ejecutado cuando casperjs indique
  // lance un error o haya concluido el procesamiento
  driver.toRegister((data, error) => {
    // NOTE: Removiendo al conductor de la cola de control
    let index = this.processed.indexOf(driver.identity);

    if (index !== -1) {
      this.processed.splice(index, 1);
    }

    // NOTE: Procesando nuevo conductor
    _process.bind(this)(callback);
  });
}

Task.prototype.CONCURRENT_TASKS_NUMBER = 4;

module.exports = Task;
