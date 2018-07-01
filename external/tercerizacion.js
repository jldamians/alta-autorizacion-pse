'use strict';

/* OBSERVATION: THIS IS A CASPERJS SCRIPT, NOT A NODEJS SCRIPT */

var utils = require('utils'),
    system = require('system');

var scriptHasError = false,
    screenshotsCounter = 0,
    PSEInformationAlreadyRegistered = null;

var casper = require('casper').create({
	colorizerType: 'Dummy', // prevent colorize text output
	stepTimeout: 40000, // 40 seconds timeout for each step
	timeout: 120000, // 2 minutes timeout for script execution
	viewportSize: { width: 800, height: 600 },
	onStepTimeout: function(timeout, step) {
		scriptHasError = true;

    this.emit(ERROR_EVENT_NAME, 'El paso (' + step + ') está tomando demasiado tiempo (> ' + (timeout / 1000) + ' segundos)');
	},
	onTimeout: function(timeout) {
		if (scriptHasError) { return; }

    this.emit(ERROR_EVENT_NAME, 'La ejecución está tomando demasiado tiempo (> ' + (timeout / 1000) + ' segundos)');
	}
});

// NOTE: Información global
var ERROR_EXIT_CODE = 1,
  	ECHO_EVENT_NAME = 'sunat.echo',
  	ERROR_EVENT_NAME = 'sunat.error',
  	CAPTURE_EVENT_NAME = 'sunat.capture',
    WEB_ADDRESS = 'https://e-menu.sunat.gob.pe/cl-ti-itmenu/MenuInternet.htm';

// NOTE: Parámetros envidos por medio de la linea de comandos
var IDENTITY = casper.cli.get(0),
  	USERNAME = casper.cli.get(1),
  	PASSWORD = casper.cli.get(2),
  	PSE_IDENTITY = casper.cli.get(3),
  	AUTHORIZATION_DATE = casper.cli.get(4);

// NOTE: Evento para imprimir mensaje informativo
casper.on(ECHO_EVENT_NAME, function(message) {
  system.stdout.writeLine(message); //this.echo(message);
});

// NOTE: Evento para capturar pantalla
casper.on(CAPTURE_EVENT_NAME, function(filename) {
	screenshotsCounter = (
    screenshotsCounter + 1
  );

	this.capture('imgs/' + IDENTITY + '/' + screenshotsCounter + '.-' + filename + '.png');
});

// NOTE: Evento para imprimir mensaje de error
casper.on(ERROR_EVENT_NAME, function(message) {
	system.stderr.writeLine(message);

	this.exit(ERROR_EXIT_CODE);
});

// NOTE: Acceder a la página de "Trámites y Consultas" de la SUNAT
casper.start(WEB_ADDRESS, function() {
  this.emit(ECHO_EVENT_NAME, 'El formulario de autenticación SOL ha sido cargado correctamente');

	// NOTE: Verificar y seleccionar opción "Ingresar por RUC"
	if (this.exists('#btnPorRuc')) {
		this.click('#btnPorRuc');
	} else {
    this.emit(CAPTURE_EVENT_NAME, 'BotonIngresoPorRucNoExiste');

    this.emit(ERROR_EVENT_NAME, 'El botón para realizar la autenticación al portal SOL por RUC no existe (#btnPorRuc)');
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
	this.emit(CAPTURE_EVENT_NAME, 'FormularioAutenticacionPorRucIncorrecto');

	this.emit(ERROR_EVENT_NAME, 'El formulario de autenticación por RUC no ha cargado correctamente');
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
			this.emit(CAPTURE_EVENT_NAME, 'MensajesInformativosPortalSOL');

      this.emit(ECHO_EVENT_NAME, 'Hemos detectado mensaje(s) informativo(s)');

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

			this.emit(ECHO_EVENT_NAME, 'NO hemos detectado mensaje(s) informativo(s)');
		}, 10000);
	});
}, function() {
	// NOTE: Si no existe la sección de modales informativos,
	// asuminos que los datos de acceso son incorrectos. Esto
	// porque al haber algún error de logeo, nos redirecciona.

	//this.echo('url -> ' + this.getCurrentUrl());

	this.emit(CAPTURE_EVENT_NAME, 'ErrorAutenticacionPortalSOL');

	this.emit(ERROR_EVENT_NAME, 'Errores en la autenticación al portal SOL');
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
			this.emit(ECHO_EVENT_NAME, 'La sección de Altas de Autorización de PSE ha cargado');

			//this.emit(CAPTURE_EVENT_NAME, 'AreaTrabajoCargadaCorrectamente');
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

			this.emit(ERROR_EVENT_NAME, 'La sección de Altas de Autorización de PSE no ha cargado');
		}

		// NOTE: Verificamos si existe una "COMUNICACIÓN TERCERIZACIÓN CON MENSAJE"
		casper.waitFor(function check() {
	    var PSERegistrationInformation = this.evaluate(function(argPseIdentity) {
        var PSENameElement,
            PSEIdentityElement,
            PSEAuthorizationElement;

	    	// NOTE: Consultando todas las altas existentes
	    	var elements = document.querySelectorAll('form#frmBajaCert div#dojox_grid__View_1 div.dojoxGridContent div.dojoxGridRow');

	    	// NOTE: Verificamos si en el resultado de la consulta
	    	// existe el pse que estamos intentando registrar
  			for (var i = elements.length - 1; i >= 0; i--) {
          PSENameElement = (
            elements[i].querySelector("td[idx='2']").textContent.toString().trim()
          );

          PSEIdentityElement = (
            elements[i].querySelector("td[idx='0']").textContent.toString().trim()
          );

          PSEAuthorizationElement = (
            elements[i].querySelector("td[idx='3']").textContent.toString().trim()
          );

          // NOTE: Verificamos si el RUC del PSE que intentamos registrar,
          // es igual al RUC del PSE que se encuentra registrado
  				if (PSEIdentityElement == argPseIdentity) {
            return {
              name: PSENameElement,
              identity: PSEIdentityElement,
              authorization: PSEAuthorizationElement
            };
  				}
  			}

	    	return null;
	    }, PSE_IDENTITY);

      PSEInformationAlreadyRegistered = PSERegistrationInformation;

      return PSERegistrationInformation == null ? false : true;
		}, function then() {// step to execute when check() is ok
			this.emit(CAPTURE_EVENT_NAME, 'ExisteAltaAutorizacion');

			this.emit(ERROR_EVENT_NAME, 'Hemos identificado una Alta de Autorización de PSE (Inicio autorización ' + PSEInformationAlreadyRegistered.authorization + ')');
		}, function timeout() {
			this.emit(ECHO_EVENT_NAME, 'NO hemos identificado una Alta de Autorización de PSE');

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
      this.emit(CAPTURE_EVENT_NAME, 'FormularioRegistroAltaIncorrecto');

			this.emit(ECHO_EVENT_NAME, 'Formulario de registro de Alta de autorización de PSE no ha cargado');
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
      this.emit(CAPTURE_EVENT_NAME, 'FormularioBusquedaPSEIncorrecto');

			this.emit(ECHO_EVENT_NAME, 'Formulario de búsqueda Lista de PSE activos no ha cargado');
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

			this.emit(ECHO_EVENT_NAME, 'El PSE consultado ha sido encontrado y seleccionado');
		}, function timeout() {// step to execute if check has failed
			this.emit(CAPTURE_EVENT_NAME, 'PSEConsultadoNoEncontrado');

			this.emit(ECHO_EVENT_NAME, 'El PSE consultado no figura en los registros de la SUNAT');
		}, 20000);
	});
}, function() {
	this.emit(CAPTURE_EVENT_NAME, 'ErrorCargarAreaTrabajo');

	this.emit(ERROR_EVENT_NAME, 'Error al cargar el área de trabajo.');
}, 10000);

casper.run(function() {
	this.exit();
});
