'use strict';

/* OBSERVATION: THIS IS A CASPERJS SCRIPT, NOT A NODEJS SCRIPT */
var system = require('system'),
    utils = require('utils');

var scriptHasError;

var casper = require('casper').create({
	colorizerType: 'Dummy', // prevent colorize text output
	stepTimeout: 180000, // 1 minute timeout for each step
	timeout: 480000, // 8 minutes timeout for script execution
	viewportSize: { width: 800, height: 600 },
	onStepTimeout: function(timeout, stepNum) {
		scriptHasError = true;

		logError([
			'The step (' + stepNum + ') was taking too long (> ' + timeout + 'ms)..',
			'the script was stopped!'
		].join(' '));

		this.exit(1);
	},
	onTimeout: function(timeout) {
		if (scriptHasError) {
			return;
		}

		logError([
			'The script execution was taking too long (> ' + timeout + 'ms)..',
			'the script was stopped!'
		].join(' '));

		this.exit(1);
	}
});

function logError(msg) {
  system.stderr.writeLine(msg);
}

var screenshotsCounter = 0;

var WEB_ADDRESS = 'https://e-menu.sunat.gob.pe/cl-ti-itmenu/MenuInternet.htm';

var ENV = 'development',
	ERROR_EXIT_CODE = 1,
	ECHO_EVENT_NAME = 'sunat.echo',
	ERROR_EVENT_NAME = 'sunat.error',
	CAPTURE_EVENT_NAME = 'sunat.capture';

var IDENTITY = casper.cli.get(0),
	USERNAME = casper.cli.get(1),
	PASSWORD = casper.cli.get(2),
	PSE_IDENTITY = casper.cli.get(3),
	AUTHORIZATION_DATE = casper.cli.get(4);

casper.on(ECHO_EVENT_NAME, function(message) {
	if (ENV === 'development') {
		this.echo(message);
	}
});

casper.on(CAPTURE_EVENT_NAME, function(filename) {
	screenshotsCounter = screenshotsCounter + 1;

	this.capture('imgs/' + IDENTITY + '-' + screenshotsCounter + '-' + filename + '.png');
});

casper.on(ERROR_EVENT_NAME, function(message) {
	system.stderr.writeLine(message);

	//this.emit(ECHO_EVENT_NAME, message);

	this.exit(ERROR_EXIT_CODE);
});

// NOTE: Acceder a la página de "Trámites y Consultas" de la SUNAT
casper.start(WEB_ADDRESS, function() {
	// NOTE: Verificar y seleccionar opción "Ingresar por RUC"
	if (this.exists('#btnPorRuc')) {
		this.click('#btnPorRuc');
	} else {
		this.emit(ERROR_EVENT_NAME, 'El botón "btnPorRuc" para "Ingresar por RUC" no existe');
	}
});

// NOTE: Esperar hasta que el formulario de login haya cargado
casper.waitFor(function() {
	// NOTE: Esperar que los inputs de logeo sean visibles
	return (
		this.visible('#txtRuc') && 
		this.visible('#txtUsuario') && 
		this.visible('#txtContrasena')
	);
}, function() {
	// NOTE: Completar los datos de acceso y logearse
	this.evaluate(function(identity, username, password) {
		// NOTE: completar los campos del formulario
		document.getElementById('txtRuc').value = identity;
		document.getElementById('txtUsuario').value = username;
		document.getElementById('txtContrasena').value = password;

		// NOTE: Click en el botón "Iniciar Sesión"
		document.getElementById('btnAceptar').click();
	}, IDENTITY, USERNAME, PASSWORD);
}, function() {
	this.emit(CAPTURE_EVENT_NAME, 'FormularioLogeoNoCargado');

	this.emit(ERROR_EVENT_NAME, 'El formulario de logeo no ha cargado correctamente');
}, 10000);

// NOTE: Verificamos si existe la sección de modales informativos
casper.waitForSelector('iframe#ifrVCE', function() {
	// NOTE: Si existe la sección de modales informativos,
	// asumimos que el logeo se ha realizado correctamente
	
	//this.echo('url -> ' + this.getCurrentUrl());

	casper.withFrame('ifrVCE', function() {
		// NOTE: Si el body del frame "ifrVCE" tiene asignada la clase "tundra",
		// se entiende que existen modales informativos abiertos
		this.waitForSelector('body.tundra', function() {
			// NOTE: Existen modales abiertos que deberán ser cerrados.
			this.emit(CAPTURE_EVENT_NAME, 'ModalesInformativosLogeo');

			this.echo('Existen modales informativos.');

			// NOTE: Verificamos si existe el modal de información "Importante"
			// para proceder a cerrarlo en caso esté abierto
			if (this.exists('span.closeText')) {
				this.click('span.closeText');
			}

			// NOTE: Verificamos si existe el modal para "Confirmar su cuenta de correo electrónico"
			// para proceder a cerrarlo en caso esté abierto
			if (this.exists('#finalizarBtn_label')) {
				this.click('#finalizarBtn_label');
			}
		}, function() {
			// NOTE: Si no existen modales abiertos dejaremos seguir el proceso
			
			this.emit(CAPTURE_EVENT_NAME, 'SinModalesInformativosLogeo');

			this.echo('No existen modales informativos.');
		}, 10000);
	});	
}, function() {
	// NOTE: Si no existe la sección de modales informativos,
	// asuminos que los datos de acceso son incorrectos. Esto
	// porque al haber algún error de logeo, nos redirecciona.
	
	//this.echo('url -> ' + this.getCurrentUrl());

	this.echo('Error al logear usuario.');

	this.emit(CAPTURE_EVENT_NAME, 'ErrorLogeo');

	this.emit(ERROR_EVENT_NAME, 'Error al intentar logear al usuario');
}, 10000);

// NOTE: Click en el menú "Altas/Bajas de PSE"
casper.thenEvaluate(function() {
	document.getElementById('nivel4_11_9_6_1_1').click();
});

// NOTE: Esperar a que se construya en el DOM el elemento 
// "iframeApplication", que corresponde al área de trabajo
casper.waitForSelector('iframe#iframeApplication', function() {
	this.withFrame('iframeApplication', function() {
		if (this.exists('body.tundra div.principal')) {
			// NOTE: Si existe "body.tundra div.principal" el usuario SOL puede 
			// realizar el registro de "COMUNICACION TERCERIZACIÓN CON PSE"
			this.emit(ECHO_EVENT_NAME, 'La sección "Altas/Bajas de PSE" ha cargado correctamente.');

			this.emit(CAPTURE_EVENT_NAME, 'AreaTrabajoCargadaCorrectamente');
		} else if (this.exists('body div.cuerpo')) {
			// NOTE: Si existe "body div.cuerpo" el usuario SOL no puede 
			// realizar el registro de "COMUNICACION TERCERIZACIÓN CON PSE"
			var message = this.evaluate(function() {
				return document.querySelector('body div.cuerpo p.error');
			});

			this.emit(CAPTURE_EVENT_NAME, 'AccionNoPermitida');

			this.emit(ERROR_EVENT_NAME, message.textContent);
		} else {
			// NOTE: Si no existen los elementos "body.tundra div.principal" y "body div.cuerpo",
			// significa que el área de trabajo no ha cargado correctamente
			this.emit(CAPTURE_EVENT_NAME, 'AreaTrabajoNoCarga');

			this.emit(ERROR_EVENT_NAME, 'La sección "Altas/Bajas de PSE" no ha cargado.');
		}

		// NOTE: Verificamos si existe una "COMUNICACIÓN TERCERIZACIÓN CON MENSAJE"
		casper.waitFor(function check() {
		    return this.evaluate(function(pseIdentity) {
		    	// NOTE: Consultando todas las altas existentes
		    	var elements = document.querySelectorAll('form#frmBajaCert div#dojox_grid__View_1 div.dojoxGridContent div.dojoxGridRow');

		    	// NOTE: Verificamos si en el resultado de la consulta
		    	// existe el pse que estamos intentando registrar
				for (var i = elements.length - 1; i >= 0; i--) {
					var currentElement = elements[i].querySelector('table.dojoxGridRowTable tbody tr td');

					if (currentElement.textContent === pseIdentity) {
						return true;
					}
				}

		    	return false;
		    }, PSE_IDENTITY);
		}, function then() {// step to execute when check() is ok
			this.emit(CAPTURE_EVENT_NAME, 'ExisteRegistroPSE');

			this.emit(ERROR_EVENT_NAME, 'El PSE ha sido registrado anteriormente.');
		}, function timeout() {
			this.emit(CAPTURE_EVENT_NAME, 'NoExisteRegistroPSE');

			this.emit(ECHO_EVENT_NAME, 'El PSE no ha sido registrado.');

			// NOTE: Si no existe registro de "COMUNICACIÓN TERCERIZACIÓN CON PSE",
			// hacemos Click botón "Alta Servicio", para registrar un PSE
			this.click('#btnNuevoCert');
		}, 10000);

		// NOTE: Esperando que se haga visible el dialogo
		// "Alta de autorización de PSE"
		casper.waitFor(function check() {
			return this.visible('#dlgAgregarCert');
		}, function then() {// step to execute when check() is ok
			// NOTE: Click botón "..", para buscar PSE
			this.click('#btnListarPSE2');
		}, function timeout() { // step to execute if check has failed
			this.emit(ECHO_EVENT_NAME, 'No se encontro el formulario "Alta de autorización de PSE".');
		}, 20000);

		// NOTE: Esperamos un tiempo, a que se le asigne una función al evento "onclick" 
		// del botón "btnNuevoLista", el cual permite realizar la búsqueda del pse
		casper.wait(5000);

		// NOTE: Esperando que se haga visible el dialogo con el formulario 
		// "Lista de PSE activos", para realizar la búsqueda del pse
		casper.waitFor(function check() {
			return this.visible('#dlgListaPSE');
		}, function then() {// step to execute when check() is ok
			this.evaluate(function(pseIdentity) {
				document.getElementById('txt_ruc2').value = pseIdentity;
				document.getElementById('btnNuevoLista').click();
			}, PSE_IDENTITY)
		}, function timeout() {// step to execute if check has failed
			this.emit(ECHO_EVENT_NAME, 'No se encontro el formulario "Lista de PSE activos".');
		}, 20000);

		// NOTE: Esperamos el resultado de la búsqueda ralizada,
		// para proceder a seleccionar en función al resultado
		casper.waitFor(function check() {
		    return this.evaluate(function() {
		    	var content = document.querySelector('form#frmRegistroCertLista table#tabArchLista div#gridConsulta2 div#dojox_grid__View_3');

		    	var grid = content.querySelector('.dojoxGridContent');

		    	var rows = grid.querySelectorAll('.dojoxGridRow');

		    	return rows.length === 1 ? true : false;
		    });
		}, function then() {// step to execute when check() is ok
		    this.evaluate(function(authorizationDate) {
		    	// NOTE: marcar el pse buscado
		    	var content = document.querySelector('form#frmRegistroCertLista table#tabArchLista div#gridConsulta2 div#dojox_grid__View_3');

		    	var grid = content.querySelector('.dojoxGridContent');

		    	var rows = grid.querySelectorAll('.dojoxGridRow');

		    	var element = rows[0].querySelector('.dojoxGridCell');

		    	element.click();

		    	document.getElementById('btnNuevoCert2').click();

		    	document.getElementById('txtFechaIni').value = authorizationDate;

				// TODO: script para "guardar" autorización
		    }, AUTHORIZATION_DATE);

		    this.wait(6000);
		    
		    this.emit(CAPTURE_EVENT_NAME, 'ExisteListaPse');

			this.emit(ECHO_EVENT_NAME, 'PSE seleccionado correctamente.');
		}, function timeout() {// step to execute if check has failed
			this.emit(CAPTURE_EVENT_NAME, 'NoExisteListaPse');

			this.emit(ECHO_EVENT_NAME, 'Error al realizar la búsqueda del PSE.');
		}, 20000);
	});
}, function() {
	this.emit(CAPTURE_EVENT_NAME, 'ErrorCargarAreaTrabajo');

	this.emit(ERROR_EVENT_NAME, 'Error al cargar el área de trabajo.');
}, 10000);

casper.run(function() {
	this.echo('Proceso concluido: ' + Date.now());

	this.exit();
});

