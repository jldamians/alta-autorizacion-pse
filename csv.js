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
  'accounting'
];


const getContent = function(path) {
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

exports.getContent = getContent;
