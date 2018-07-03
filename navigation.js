const Excel = require('exceljs');

const Driver = require('./Driver.js');

const driver1 = new Driver(
  'PABLO YURY LOPEZ GAMARRA',
  '10473397353',
  'EASY2018',
  'EASY2018',
  '2018-07-10'
);

driver1.toRegister();

const driver2 = new Driver(
  'ALEXIS JOSE MENDOZA MENDEZ',
  '15603305148',
  'EASY1234',
  'EASY1234',
  '2018-07-10'
);

driver2.toRegister();

const driver3 = new Driver(
  'JOSE LUIS DAMIAN SAAVEDRA',
  '10460033280',
  'BLEXHUGA',
  'jlds161089',
  '2018-07-10'
);

driver3.toRegister();

/*driver.toSpawn();

driver.on('data', (mssg) => {
  console.log(`DATA: \n ${mssg.toString()}`);
})

driver.on('error', (mssg) => {
  console.log(`ERROR: \n ${mssg.toString()}`);
})

driver.on('end', (mssg) => {
  console.log(`END: \n ${mssg.toString()}`);
})*/

/*
const workbook = new Excel.Workbook();

const filename = 'C:\\Users\\josel\\Desktop\\easy-invoices.csv';

const csv = workbook.csv.readFile(filename);

const ROWS_STRUCTURE = [
  '.',
  'name',
  'paternal',
  'maternal',
  'address',
  'ubigeo',
  'phone',
  'dni',
  'ruc',
  'email',
  'username',
  'password',
  'billing',
  'accounting'
];

csv.then(function(worksheet) {
  var information = [];

  worksheet.eachRow(function(row, rowNumber) {
    var current = {};

    if (rowNumber >= 2 && rowNumber <= 18) {
      row.eachCell(function(cell, colNumber) {
        var property = ROWS_STRUCTURE[colNumber];

        current[property] = cell.value;
      });

      information.push(new Driver(
        current.name,
        current.ruc,
        current.username,
        current.password,
        '2018-07-15'
      ));
    }
  });

  information.forEach(function(driver) {
    driver.toSpawn();

    driver.on('data', (mssg) => {
      console.log(`DATA (${driver.identity}): \n ${mssg.toString()}`);
    })

    driver.on('error', (mssg) => {
      console.log(`ERROR (${driver.identity}): \n ${mssg.toString()}`);
    })

    driver.on('end', (mssg) => {
      console.log(`END (${driver.identity}): \n ${mssg.toString()}`);
    })
  });
});
*/
