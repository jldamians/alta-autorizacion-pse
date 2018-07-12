'use strict';

/* OBSERVATION: THIS IS A CASPERJS SCRIPT, NOT A NODEJS SCRIPT */

var utils = require('utils'),
    system = require('system');

var casper = require('casper').create({
	colorizerType: 'Dummy', // prevent colorize text output
	stepTimeout: 90000, // 90 seconds timeout for each step
	timeout: 240000, // 4 minutes timeout for script execution
	viewportSize: { width: 800, height: 600 },
  clientScripts: ['C:\\Users\\josel\\Documents\\workspaces\\apps\\alta-autorizacion-pse\\lib\\includes\\jquery-3.3.1.min.js'],
	onStepTimeout: function(timeout, step) {
		scriptHasError = true;

    this.emit(CAPTURE_EVENT_NAME, 'onStepTimeout');

    this.emit(WARNING_ERROR_EVENT_NAME, 'El paso (' + step + ') está tomando demasiado tiempo (> ' + (timeout / 1000) + ' segundos)');
	},
	onTimeout: function(timeout) {
		if (scriptHasError) { return; }

    this.emit(CAPTURE_EVENT_NAME, 'onProcessTimeout');

    this.emit(WARNING_ERROR_EVENT_NAME, 'La ejecución está tomando demasiado tiempo (> ' + (timeout / 1000) + ' segundos)');
	}
});

// NOTE: Información global
var scriptHasError = false,
    screenshotsCounter = 0,
    PSEInformationAlreadyRegistered = null;

var ERROR_EXIT_CODE = 1,
    // indicar que el error tiene que ser resuelto por el contribuyente
    DANGER_ERROR_CODE = 1,
    // indicar que el error es parte de la automatización, por lo cual se tendrá que volver a procesar
    WARNING_ERROR_CODE = 0,
    // indicar que el error es porque ya existe una alta de autorización
    INFO_ERROR_CODE = 2,
  	ECHO_EVENT_NAME = 'sunat.echo',
    ERROR_EVENT_NAME = 'sunat.error',
  	CAPTURE_EVENT_NAME = 'sunat.capture',
    DANGER_ERROR_EVENT_NAME = 'sunat.error.danger',
    WARNING_ERROR_EVENT_NAME = 'sunat.error.warning',
    INFO_ERROR_EVENT_NAME = 'sunat.error.info',
    WEB_ADDRESS = 'https://www.sunat.gob.pe/xssecurity/SignOnVerification.htm?logout&signonForwardAction=https%3A%2F%2Fwww.sunat.gob.pe%2Fol-at-itcanal%2Fcanal.do';

// NOTE: Parámetros envidos por medio de la linea de comandos
var IDENTITY = '10441348326',//casper.cli.get(0),
  	USERNAME = 'EASY1234',//casper.cli.get(1),
  	PASSWORD = 'EASY1234',//casper.cli.get(2),
  	PSE_IDENTITY = '20504561292',//casper.cli.get(3),
  	AUTHORIZATION_DATE = '2018-07-15'//casper.cli.get(4);

// NOTE: Evento para imprimir mensaje informativo
casper.on(ECHO_EVENT_NAME, function(message) {
  system.stdout.writeLine(message);
});

// NOTE: Evento para capturar pantalla
casper.on(CAPTURE_EVENT_NAME, function(filename) {
	screenshotsCounter = (
    screenshotsCounter + 1
  );

	this.capture('imgs/' + IDENTITY + '/' + screenshotsCounter + '.-' + filename + '.png');
});

// NOTE: Evento para imprimir mensaje de error
casper.on(ERROR_EVENT_NAME, function(code, message) {
	system.stderr.writeLine(JSON.stringify({
    code: code,
    message: message
  }));

	this.exit(ERROR_EXIT_CODE);
});

casper.on(DANGER_ERROR_EVENT_NAME, function(message) {
  this.emit(ERROR_EVENT_NAME, DANGER_ERROR_CODE, message);
});

casper.on(WARNING_ERROR_EVENT_NAME, function(message) {
  this.emit(ERROR_EVENT_NAME, WARNING_ERROR_CODE, message);
});

casper.on(INFO_ERROR_EVENT_NAME, function(message) {
  this.emit(ERROR_EVENT_NAME, INFO_ERROR_CODE, message);
});

casper.setFilter('page.confirm', function(message) {
  this.echo("page.confirm: " + message);

  return true;
});

casper.setFilter('page.alert', function(message) {
  this.echo("page.alert: " + message);

  return true;
});

// NOTE: Acceder a la página de "Trámites y Consultas" de la SUNAT
casper.start(WEB_ADDRESS, function() {
  this.emit(ECHO_EVENT_NAME, 'Portal SOL cargado');

	// NOTE: Verificar y seleccionar opción "Ingresar por RUC"
	if (this.exists('#btnPorRuc')) {
		this.click('#btnPorRuc');
	} else {
    this.emit(CAPTURE_EVENT_NAME, 'BotonIngresoPorRucNoExiste');

    this.emit(WARNING_ERROR_EVENT_NAME, 'El botón para realizar la autenticación al portal SOL por RUC no existe (#btnPorRuc)');
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
    $("#txtRuc").val(identity);
    $("#txtUsuario").val(username);
    $("#txtContrasena").val(password);

		// NOTE: Click en el botón "Iniciar Sesión"
    $("#btnAceptar").click();
	}, IDENTITY, USERNAME, PASSWORD);
}, function() {
	this.emit(CAPTURE_EVENT_NAME, 'FormularioAutenticacionPorRucIncorrecto');

	this.emit(WARNING_ERROR_EVENT_NAME, 'Formulario de autenticación no disponible');
}, 10000);

// NOTE: Verificamos si existe la sección de modales informativos
casper.waitForSelector('iframe#ifrVCE', function() {
	// NOTE: Si existe la sección de modales informativos,
	// asumimos que el logeo se ha realizado correctamente

  this.emit(ECHO_EVENT_NAME, 'Autenticación correcta');

  this.emit(CAPTURE_EVENT_NAME, 'AutenticacionCorrecta');

	casper.withFrame('ifrVCE', function() {
		// NOTE: Si el body del frame "ifrVCE" tiene asignada la clase "tundra",
		// se entiende que existen modales informativos abiertos
		this.waitForSelector('body.tundra', function() {
			// NOTE: Existen modales abiertos que deberán ser cerrados.
			this.emit(CAPTURE_EVENT_NAME, 'MensajesInformativosPortalSOL');

      this.emit(ECHO_EVENT_NAME, 'Existen mensajes informativos');

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
			// NOTE: No existen mensajes informativos
		}, 10000);
	});
}, function() {
	// NOTE: Si no existe la sección de modales informativos,
	// asumimos que los datos de acceso son incorrectos. Esto
	// porque al haber algún error de logeo, nos redirecciona.
	this.emit(CAPTURE_EVENT_NAME, 'AutenticacionIncorrecta');

	this.emit(DANGER_ERROR_EVENT_NAME, 'Autenticación incorrecta');
}, 40000);

// NOTE: Click en el menú "Declara Fácil IGV Renta Mensual - 621", para acceder
// al formulario "Formulario Virtual Nº 621 Simplificado IGV - Renta Mensual"
casper.waitForSelector("#fdecla0621", function() {
  this.click("#fdecla0621 a");
}, function() {
  this.emit(CAPTURE_EVENT_NAME, 'MenuRentaMensualNoDisponible');

  this.emit(WARNING_ERROR_EVENT_NAME, 'Menú renta mensual no disponible');
}, 10000);

// NOTE: Esperar a que se construya en el DOM el elemento
// "iframeApplication", que corresponde al área de trabajo
casper.waitForSelector("div#pane0621", function() {
  this.sendKeys("#per_doc", "06/2018", {keepFocus: true});

  this.sendKeys("#per_doc", this.page.event.key.Tab, {keepFocus: false});

  this.emit(CAPTURE_EVENT_NAME, 'success-img');
}, function() {
  this.emit(CAPTURE_EVENT_NAME, 'filed-img');
}, 10000);

// NOTE: Pestaña "Datos Generales"
casper.waitFor(function() {
  var enable = this.evaluate(function() {
    var rerRadio = document.getElementById("ind_reg_rta_1");

    var movementRadio = document.getElementById("ind_no_mov_0");

    var rectificationRadio = document.getElementById("ind_rec_0");

    var disabled = (
      rerRadio.disabled === true && movementRadio.disabled === true && rectificationRadio.disabled === true
    );

    return disabled === true ? false : true;
  });

  return enable;
}, function() {
  // NOTE: ¿La presente declaración rectifica o sustituye  a otra? ... No
  this.click("#ind_rec_0");

  // NOTE: Indicador de no movimiento ... No
  this.click("#ind_no_mov_0");

  // NOTE: Régimen de Rente ... Especial
  this.click("#ind_reg_rta_1");

  this.emit(CAPTURE_EVENT_NAME, 'DATOS-GENERALES');

  // NOTE: Botón "Siguiente", para pasar a la pestaña "IGV"
  this.click("#tabContainer_tablist > div:nth-child(2)");
  //this.click("button#pane0621_next");
}, function() {
  this.emit(CAPTURE_EVENT_NAME, 'pestania-general-controles-inactivos');

	this.emit(WARNING_ERROR_EVENT_NAME, 'Pestaña General: controles inactivos');
}, 10000);

// NOTE: Pestaña "IGV".
casper.then(function() {
  // NOTE: [100] Ventas Gravadas Netas
  this.sendKeys("#mto_vta_gra", "0", { keepFocus: true });

  // NOTE: [107] Compras Gravadas Netas
  this.sendKeys("#mto_com_gra", "0", { keepFocus: true });

  this.emit(CAPTURE_EVENT_NAME, 'IGV');

  // NOTE: Botón "Siguiente", para pasar a la pestaña "Renta"
  this.click("#tabContainer_tablist > div:nth-child(3)");
  //this.click("button#pane0621_next");
});

// NOTE: Pestaña "Renta".
casper.then(function() {
  // NOTE: [301] Ingresos Netos
  this.sendKeys("#mto_ing_net", "2500", { keepFocus: true });

  // NOTE: [301] Ingresos Netos: Presionamos "tab",
  // para que se calculen los tributos (Importe a Pagar)
  this.sendKeys("#mto_ing_net", this.page.event.key.Tab, { keepFocus: false });

  // NOTE: [307] Importe a Pagar: Borramos el importe anterior
  // (calculado anteriormente), y consignamos un nuevo valor
  this.sendKeys("#mto_pag_rta", "0", { reset: true, keepFocus: true });

  this.emit(CAPTURE_EVENT_NAME, 'RENTA');

  // NOTE: Botón "Agregar a Bandeja", para pasar a la pestaña "Renta"
  this.click("button#btn_add");
});

// NOTE: Verificamos que la declaración haya sido
// agregada a la bandeja, para realizar la presentación
casper.waitForSelector('div#grdLstItems_row_0', function() {
  this.emit(ECHO_EVENT_NAME, 'Renta mensual 621 en bandeja');
}, function() {
	this.emit(CAPTURE_EVENT_NAME, 'ErrorAgregarRentaMensualBandeja');

	this.emit(DANGER_ERROR_EVENT_NAME, 'Errores al agregar renta mensual a bandeja');
}, 30000);

casper.run(function() {
  this.emit(CAPTURE_EVENT_NAME, 'done-img');

	this.exit();
});
