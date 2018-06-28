const Driver = require('./Driver.js');

const driver = new Driver(
  'JOSE MARTIN CAMPOS QUISPE',
  '10460600371',
  'EASY1234',
  'EASY1234'
);

driver.toSpawn();

driver.on('data', (mssg) => {
  console.log(`STDOUT: \n ${mssg.toString()}`);
})

driver.on('error', (mssg) => {
  console.log(`STDERR: \n ${mssg.toString()}`);
})

driver.on('success', function(message) {
  console.log(message.toString());
})

driver.on('failure', function(message) {
  console.log(message.toString());
})
