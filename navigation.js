const Driver = require('./Driver.js');

const driver = new Driver(
  'JOSE MARTIN CAMPOS QUISPE',
  '10460600371',
  'EASY1234',
  'EASY1234',
  '30/07/2018'
);

driver.toSpawn();

driver.on('data', (mssg) => {
  console.log(`DATA: \n ${mssg.toString()}`);
})

driver.on('error', (mssg) => {
  console.log(`ERROR: \n ${mssg.toString()}`);
})

driver.on('end', (mssg) => {
  console.log(`END: \n ${mssg.toString()}`);
})
