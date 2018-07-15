'use strict';

/* OBSERVATION: THIS IS A CASPERJS SCRIPT, NOT A NODEJS SCRIPT */

var utils = require('utils'),
    system = require('system');

var xpath = require('casper').selectXPath;

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
var IDENTITY = '10074370191',//casper.cli.get(0),
  	USERNAME = 'EASY1234',//casper.cli.get(1),
  	PASSWORD = 'EASY1234',//casper.cli.get(2),
  	PERIODO_TRIBUTARIO = '06/2018',//casper.cli.get(3),
    VENTAS_GRAVADAS_NETAS = String(0),//casper.cli.get(4),
    COMPRAS_GRAVADAS_NETAS = String(0),//casper.cli.get(5),
    INGRESOS_NETOS = String(0),//casper.cli.get(6),
    IMPORTE_PAGAR = String(0);//casper.cli.get(7);

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

var doOnlyOnce = true,
    requestedResource = null;

casper.on('resource.requested', function(resource) {
  if (
    resource.method === 'POST' &&
    resource.url == 'https://www.sunat.gob.pe/ol-ti-itconstancia/constancia.do' &&
    doOnlyOnce
  ) {

    doOnlyOnce = false;

    requestedResource = resource;
  }
});

/*var phantomData    = null;
var phantomRequest = null;

this.on('resource.requested', function(requestData, request) {
    for (var h in requestData.headers) {
        if (requestData.headers[h].name === 'Content-Type') {
            if (requestData.headers[h].value === 'application/x-www-form-urlencoded') {
                phantomData         = requestData;
                phantomRequest      = request;
            }
        }
    }
});

// Here, I recognize when the request has FAILED because PhantomJS does
// not support straight downloading.

casper.on('resource.received', function(resource) {
    for (var h in resource.headers) {
        if (resource.headers[h].name === 'content-disposition') {
            if (resource.stage === 'end') {
                if (phantomData) {
                    // to do: get name from resource.headers[h].value
                    casper.download(
                        resource.url,
                        "output.pdf",
                        phantomData.method,
                        phantomData.postData
                    );
                } else {
                    // Something went wrong.
                }
                // Possibly, remove listeners?
            }
        }
    }
});*/

casper.on('resource.received', function(resource) {
  if (resource.url === "https://www.sunat.gob.pe/ol-ti-itconstancia/constancia.do" && resource.stage === "end") {
    casper.echo("\n");
    casper.echo("request.end => " + JSON.stringify(requestedResource));
    casper.echo("\n");
    casper.echo("response.end => " + JSON.stringify(resource));
    /*this.download(
      "https://www.sunat.gob.pe/cl-at-framework-unloadfile/descargaArchivoAlias?data0_sis_id=1000&data0_num_id=" + requestedResource.postData.data_1,
      IDENTITY + '-constancia.pdf',
      "GET"
    );*/
  } else if (resource.url === "https://www.sunat.gob.pe/ol-ti-itconstancia/constancia.do" && resource.stage === "start") {
    casper.echo("\n");
    casper.echo("request.start => " + JSON.stringify(requestedResource));
    casper.echo("\n");
    casper.echo("response.start => " + JSON.stringify(resource));
  }
});

casper.options.onResourceRequested = function(C, requestData, request) {
    utils.dump(requestData.headers);
};
casper.options.onResourceReceived = function(C, response) {
    utils.dump(response.headers);
};

/*casper.on('error', function(msg) {
    this.emit(CAPTURE_EVENT_NAME, 'CASPERJS-ERROR');

    this.die(msg);
});*/

/*casper.on("page.error", function(msg, trace) {
  this.echo("Error:    " + msg, "ERROR");
  this.echo("file:     " + trace[0].file, "WARNING");
  this.echo("line:     " + trace[0].line, "WARNING");
  this.echo("function: " + trace[0]["function"], "WARNING");

  this.emit(CAPTURE_EVENT_NAME, 'CASPERJS-PAGE-ERROR');
  //errors.push(msg);
});*/

/*casper.on('complete.error', function(err) {
  this.emit(CAPTURE_EVENT_NAME, 'CASPERJS-COMPLETE-ERROR');

  this.die("Complete callback has failed: " + err);
});*/

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

/*casper.setFilter('page.alert', function(message) {
  this.echo("page.alert: " + message);

  return true;
});*/

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

// NOTE: Verificamos si el área de trabajo ha sido dibujada en el DOM
casper.waitForSelector("div#workContent", function() {
	// NOTE: Si existe la sección de modales informativos,
	// asumimos que el logeo se ha realizado correctamente

  this.emit(ECHO_EVENT_NAME, 'Autenticación correcta');

  this.emit(CAPTURE_EVENT_NAME, 'AutenticacionCorrecta');

  this.waitForSelector(xpath('//iframe[@id="ifrVCE"]'), function() {
    this.evaluate(function() {
      var iframe = window.document.getElementById("ifrVCE");

      var document = (
        iframe.contentDocument ? iframe.contentDocument : iframe.contentWindow.document
      );

      var informationWindows = document.querySelector('body.tundra');

      if (informationWindows) {
        var firstDialog = informationWindows.querySelector('span.closeText');
        var secondDialog = informationWindows.querySelector('span#finalizarBtn_label');

        if (firstDialog) {
          firstDialog.click();
        }

        if (secondDialog) {
          secondDialog.click();
        }
      }
    });
  }, function() {
    // NOTE: No existen mensajes informativos
  }, 5000);
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
  this.sendKeys("#per_doc", PERIODO_TRIBUTARIO, {keepFocus: true});

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

    return disabled ? false : true;
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
}, 20000);

// NOTE: Pestaña "IGV".
casper.then(function() {
  // NOTE: [100] Ventas Gravadas Netas
  this.sendKeys("#mto_vta_gra", VENTAS_GRAVADAS_NETAS, { keepFocus: true });

  // NOTE: [107] Compras Gravadas Netas
  this.sendKeys("#mto_com_gra", COMPRAS_GRAVADAS_NETAS, { keepFocus: true });

  this.emit(CAPTURE_EVENT_NAME, 'IGV');

  // NOTE: Botón "Siguiente", para pasar a la pestaña "Renta"
  this.click("#tabContainer_tablist > div:nth-child(3)");
  //this.click("button#pane0621_next");
});

// NOTE: Pestaña "Renta".
casper.then(function() {
  // NOTE: [301] Ingresos Netos
  this.sendKeys("#mto_ing_net", INGRESOS_NETOS, { keepFocus: true });

  // NOTE: [301] Ingresos Netos: Presionamos "tab",
  // para que se calculen los tributos (Importe a Pagar)
  this.sendKeys("#mto_ing_net", this.page.event.key.Tab, { keepFocus: false });

  // NOTE: [307] Importe a Pagar: Borramos el importe anterior
  // (calculado anteriormente), y consignamos un nuevo valor
  this.sendKeys("#mto_pag_rta", IMPORTE_PAGAR, { reset: true, keepFocus: true });

  this.emit(CAPTURE_EVENT_NAME, 'RENTA');

  // NOTE: Botón "Agregar a Bandeja", para pasar a la pestaña "Renta"
  this.click("button#btn_add");
});

// NOTE: Verificamos que la declaración haya sido
// agregada a la bandeja, para realizar la presentación
casper.waitForSelector('div#grdLstItems_row_0', function() {
  //this.emit(ECHO_EVENT_NAME, 'Renta mensual 621 en bandeja');
  this.click("button#btn_pay");
}, function() {
	this.emit(CAPTURE_EVENT_NAME, 'ErrorAgregarRentaMensualBandeja');

	this.emit(DANGER_ERROR_EVENT_NAME, 'Errores al agregar renta mensual a bandeja');
}, 30000);

// NOTE: Verificamos que la sección "Constancia de Declaración y Pago",
// haya cargado correctamente
casper.waitForSelector("div#recordContent div#record", function() {
  // NOTE: Botón "Guardar", para guardar la constancia de presentación
  this.click("button#canal_form_SaveButton_0");

  this.download(
    requestedResource.url,
    'constancia.pdf',
    requestedResource.method,  // 'POST'
    requestedResource.postData
  );
}, function() {
  this.emit(CAPTURE_EVENT_NAME, 'CONSTANCIA-NO-GUARDADA');

	this.echo('Error al guardar la constancia');
}, 60000);

casper.run(function() {
  this.emit(CAPTURE_EVENT_NAME, 'PROCESO-COMPLETADO');

	this.exit();
});


// REF1: https://blog.lolnope.us/casperjs-and-arbitersports/
// REF2: https://searchcode.com/codesearch/view/92607326/