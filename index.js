'use strict';

const moment = require('moment');

const Task = require('./Task');

const register = async function() {
  let authorization = moment().add(1, 'day').format('YYYY-MM-DD');
  let csvPath = 'C:\\Users\\josel\\Desktop\\easy-invoices.csv';

  let objTask = new Task(authorization);

  await objTask.readCsv(csvPath);

  objTask.toProcess(() => {
    objTask.writeCsv(csvPath);
  });
}

register();
