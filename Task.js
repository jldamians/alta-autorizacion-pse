'use strict';

const csv = require('./csv');
const Driver = require('./Driver');

function Task(authorization) {
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
    driver.state = uc.state || '0'
    driver.observation = uc.observation || ''

    drivers.push(driver);
  });

  this.drivers = drivers;
}

Task.prototype.toProcess = function(callback) {
  for (var i = 0; i < this.CONCURRENT_TASKS_NUMBER; i++) {
    _process.bind(this)(callback);
  }
}

Task.prototype.writeCsv = function(path) {
  csv.write(this.drivers, path);
}

const _process = function(callback) {
  let driver = this.drivers[this.index];

  this.index++;

  if (!driver) {
    if (this.processed.length === 0) {
      callback();
    }

    return;
  }

  if (driver.state != null && driver.state != '' && driver.state != '0') {
    _process.bind(this)(callback);

    return;
  }

  // NOTE: Agregado el conductor a la cola de control
  this.processed.push(driver.identity);

  // NOTE: El callback será ejecutado cuando casperjs indique
  // lance un error o haya concluido el procesamiento
  driver.toRegister((data, error) => {
    console.log(`[${driver.identity}] ${driver.fullname}:\n\n${driver.logs.join('')}\n`);

    // NOTE: Removiendo al conductor de la cola de control
    let index = this.processed.indexOf(driver.identity);

    if (index !== -1) {
      this.processed.splice(index, 1);
    }

    _process.bind(this)(callback);
  });
}

Task.prototype.CONCURRENT_TASKS_NUMBER = 6;

module.exports = Task;
