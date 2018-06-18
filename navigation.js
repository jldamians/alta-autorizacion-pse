var path = require('path');

// Require spawn from the child process module
var spawn = require('child_process').spawn;

var IDENTITY = '10460600371',
	USERNAME = 'EASY1234',
	PASSWORD = 'EASY1234';

var PSE_IDENTITY = '20504561292',
	AUTHORIZATION_DATE = '30/06/2018';

var CASPER_SCRIPT = path.join(__dirname, 'external/tercerizacion.js');

var args = [
	CASPER_SCRIPT,
	IDENTITY,
	USERNAME,
	PASSWORD,
	PSE_IDENTITY,
	AUTHORIZATION_DATE
];

// Run node with the child.js file as an argument
var child = spawn('casperjs', args);

process.stderr.setMaxListeners(0);

child.stdout.setEncoding('utf8');

child.stderr.setEncoding('utf8');

child.stdout.on('data', (data) => {
  console.log(`child stdout:\n${data}`);
});

child.stderr.on('data', (data) => {
  console.error(`child stderr:\n${data}`);
});

child.on('close', function(code) {
	console.log('Proceso cerrado (%s).', code);
});