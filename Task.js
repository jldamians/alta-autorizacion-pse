'use strict';

const csv = require('./csv');
const Driver = require('./Driver');

function Task(authorization) {
  let _args = {
    drivers: [],
    csvContent: [],
    authorization: authorization,
    index: 0
  }

  Object.defineProperty(this, 'drivers', {
    get: () => { return _args.drivers },
    set: (value) => { _args.drivers = value }
  })

  Object.defineProperty(this, 'csvContent', {
    get: () => { return _args.csvContent },
    set: (value) => { _args.csvContent = value }
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

Task.prototype.getCsvInformation = async function(path) {
  let drivers = [],
      csvContent = [];

  csvContent = await csv.getContent(path);

  csvContent.forEach((uc) => {
    let driver = new Driver();

    driver.identity = uc.ruc;
    driver.fullname = uc.name;
    driver.username = uc.username;
    driver.password = uc.password;
    driver.authorization = this.authorization;

    drivers.push(driver);
  });

  this.drivers = drivers;
  this.csvContent = csvContent;
}

Task.prototype.toProcess = function() {
  for (var i = 0; i < this.CONCURRENT_TASKS_NUMBER; i++) {
    _process.call(this);
  }
}

const _process = function() {
  let currentDriver = this.drivers[this.index];

  if (!currentDriver) {
    return;
  }

  this.index = this.index + 1;

  currentDriver.toRegister((data, error) => {
    _process.call(this);
  });
}

Task.prototype.CONCURRENT_TASKS_NUMBER = 5;

module.exports = Task;
