'use strict';

const Task = require('./Task');

const register = async function() {
  let objTask = new Task('2018-07-10');

  await objTask.readCsv('C:\\Users\\josel\\Desktop\\easy-invoices.csv');

  objTask.toProcess(() => {
    objTask.writeCsv();
    // TODO: generar nuevo archivo csv
  });
}

register();
