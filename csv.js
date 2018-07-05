'use strict';

const Excel = require('exceljs');
const Promise = require('bluebird');

const ROWS_STRUCTURE = [
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
  'accounting',
  'state',
  'observation'
];

const COLUMNS_NAME = [
  'NOMBRES',
  'APELLIDO PATERNO',
  'APELLIDO MATERNO',
  'DIRECCION',
  'UBIGEO',
  'TELEFONO',
  'DNI',
  'RUC',
  'CORREO ELECTRONICO',
  'USUARIO SOL',
  'CLAVE SOL',
  'PLAN FACTURACION',
  'PLAN CONTABILIDAD',
  'ESTADO',
  'OBSERVACION'
];

const read = function(path) {
  const workbook = new Excel.Workbook();

  const csv = workbook.csv.readFile(path);

  return csv.then((worksheet) => {
    let csvContent = [];

    worksheet.eachRow((row, rowNumber) => {
      let csvRow = {};

      if (rowNumber > 1) {
        row.eachCell(function(cell, colNumber) {
          let property = ROWS_STRUCTURE[colNumber - 1];

          csvRow[property] = cell.value;
        });

        csvContent.push(csvRow);
      }
    });

    return csvContent;
  });
}

const write = function(data) {
  const workbook = new Excel.Workbook();

  const worksheet = workbook.addWorksheet('processed-information');

  worksheet.columns = COLUMNS_NAME.map((name, index) => {
    return {
      header: name,
      key: `column-${index}`
    }
  });

  data.forEach((uc) => {
    worksheet.addRow([
      uc.data.name,
      uc.data.paternal,
      uc.data.maternal,
      uc.data.address,
      uc.data.ubigeo,
      uc.data.phone,
      uc.data.dni,
      uc.data.ruc,
      uc.data.email,
      uc.data.username,
      uc.data.password,
      uc.data.billing,
      uc.data.accounting,
      uc.state,
      uc.observation
    ]);
  });

  workbook.csv.writeFile('C:\\Users\\josel\\Desktop\\easy-invoices-processed.csv');
}

exports.read = read;
exports.write = write;
