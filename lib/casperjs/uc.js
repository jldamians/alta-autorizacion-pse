'use strict';

/* OBSERVATION: THIS IS A CASPERJS SCRIPT, NOT A NODEJS SCRIPT */

var utils = require('utils'),
    system = require('system'),
    casper = require('casper');

// NOTE: Información global
var scriptHasError = false,
    screenshotsCounter = 0;

var browser = casper.create({
  colorizerType: "Dummy", // prevent colorize text output
  stepTimeout: 90000, // 90 seconds timeout for each step
  timeout: 240000, // 4 minutes timeout for script execution
  viewportSize: { width: 800, height: 600 },
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
var IDENTITY = '10428498611',//browser.cli.get(0),
    USERNAME = 'EASY1234',//browser.cli.get(1),
    PASSWORD = 'EASY1234',//browser.cli.get(2),
    PERIODO_TRIBUTARIO = '06/2018',//browser.cli.get(3),
    VENTAS_GRAVADAS_NETAS = String(0),//browser.cli.get(4),
    COMPRAS_GRAVADAS_NETAS = String(0),//browser.cli.get(5),
    INGRESOS_NETOS = String(0),//browser.cli.get(6),
    IMPORTE_PAGAR = String(0);//browser.cli.get(7);

// NOTE: Evento para imprimir mensaje informativo
browser.on(ECHO_EVENT_NAME, function(message) {
  system.stdout.writeLine(message);
});

// NOTE: Evento para capturar pantalla
browser.on(CAPTURE_EVENT_NAME, function(filename) {
  screenshotsCounter = (
    screenshotsCounter + 1
  );

  this.capture('imgs/' + IDENTITY + '/' + screenshotsCounter + '.-' + filename + '.png');
});

/*
  var doOnlyOnce = true,
      requestedResource = null;

  browser.on('resource.requested', function(resource) {
    if (
      resource.method === 'POST' &&
      resource.url == 'https://www.sunat.gob.pe/ol-ti-itconstancia/constancia.do' &&
      doOnlyOnce
    ) {

      doOnlyOnce = false;

      requestedResource = resource;
    }
  });

  browser.on('resource.received', function(resource) {
    if (resource.url === "https://www.sunat.gob.pe/ol-ti-itconstancia/constancia.do" && resource.stage === "end") {
      browser.echo("\n");
      browser.echo("request.end => " + JSON.stringify(requestedResource));
      browser.echo("\n");
      browser.echo("response.end => " + JSON.stringify(resource));
      this.download(
        "https://www.sunat.gob.pe/cl-at-framework-unloadfile/descargaArchivoAlias?data0_sis_id=1000&data0_num_id=" + requestedResource.postData.data_1,
        IDENTITY + '-constancia.pdf',
        "GET"
      );
    } else if (resource.url === "https://www.sunat.gob.pe/ol-ti-itconstancia/constancia.do" && resource.stage === "start") {
      browser.echo("\n");
      browser.echo("request.start => " + JSON.stringify(requestedResource));
      browser.echo("\n");
      browser.echo("response.start => " + JSON.stringify(resource));
    }
  });
*/

// NOTE: Evento para imprimir mensaje de error
browser.on(ERROR_EVENT_NAME, function(code, message) {
  system.stderr.writeLine(JSON.stringify({
    code: code,
    message: message
  }));

  this.exit(ERROR_EXIT_CODE);
});

browser.on(DANGER_ERROR_EVENT_NAME, function(message) {
  this.emit(ERROR_EVENT_NAME, DANGER_ERROR_CODE, message);
});

browser.on(WARNING_ERROR_EVENT_NAME, function(message) {
  this.emit(ERROR_EVENT_NAME, WARNING_ERROR_CODE, message);
});

browser.on(INFO_ERROR_EVENT_NAME, function(message) {
  this.emit(ERROR_EVENT_NAME, INFO_ERROR_CODE, message);
});

browser.setFilter('page.confirm', function(message) {
  //this.echo("page.confirm: " + message);
  return true;
});

browser.on('remote.alert', function(message) {
  /*var exists = "Existe una declaración presentada para el mismo periodo, esta declaración  será considerada rectificatoria.";

  if (message === exists) {

    this.emit(CAPTURE_EVENT_NAME, 'EXISTE-DECLARACION-JURADA');
    this.exit();
  }*/

  this.echo(message);

  this.emit(CAPTURE_EVENT_NAME, 'EXISTE-DECLARACION-JURADA');

  this.exit();

  // TODO: cualquier mensaje debe ser mostrado y terminar el proceso
});

// NOTE: Acceder a la página de "Trámites y Consultas" de la SUNAT
browser.start(WEB_ADDRESS, function() {
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
browser.waitFor(function() {
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
    document.getElementById("txtRuc").value = identity;
    document.getElementById("txtUsuario").value = username;
    document.getElementById("txtContrasena").value = password;

    // NOTE: Click en el botón "Iniciar Sesión"
    document.getElementById("btnAceptar").click();
  }, IDENTITY, USERNAME, PASSWORD);
}, function() {
  this.emit(CAPTURE_EVENT_NAME, 'FormularioAutenticacionPorRucIncorrecto');

  this.emit(WARNING_ERROR_EVENT_NAME, 'Formulario de autenticación no disponible');
}, 10000);

var existsInformativeMessages = null;

browser.then(function() {
  // NOTE: Verificamos si el área de trabajo ha sido dibujada en el DOM,
  // ya que de existir este "iframe", asumimos que el logeo a sido correcto
  return browser.waitForSelector("iframe#ifrVCE", function() {
    this.emit(ECHO_EVENT_NAME, 'Autenticación correcta');
  }, function() {
    // NOTE: Si no existe la sección de modales informativos,
    // asumimos que los datos de acceso son incorrectos. Esto
    // porque al haber algún error de logeo, nos redirecciona.
    this.emit(CAPTURE_EVENT_NAME, 'AutenticacionIncorrecta');

    this.emit(DANGER_ERROR_EVENT_NAME, 'Autenticación incorrecta');
  }, 20000);
}).then(function() {
  // NOTE: El iframe con posición "1" representa al iframe con id "ifrVCE",
  // este frame siempre existira, independien de que existan o no mensajes informativos
  return browser.withFrame(1, function() {
    this.waitForSelector('body.tundra', function() {
      existsInformativeMessages = true;

      this.emit(ECHO_EVENT_NAME, 'Existen avisos informativos');
    }, function() {
      existsInformativeMessages = false;
    }, 10000);
  });
}).then(function() {
  var selectorDialogCloseButton = "div#mydialogVCE div.dijitDialogTitleBar span.dijitDialogCloseIcon";

  if (existsInformativeMessages) {
    this.click(selectorDialogCloseButton);
  }
});

// NOTE: Click en el menú "Declara Fácil IGV Renta Mensual - 621", para acceder
// al formulario "Formulario Virtual Nº 621 Simplificado IGV - Renta Mensual"
browser.waitForSelector("#fdecla0621", function() {
  this.click("#fdecla0621 a");
}, function() {
  this.emit(CAPTURE_EVENT_NAME, 'MenuRentaMensualNoDisponible');

  this.emit(WARNING_ERROR_EVENT_NAME, 'Menú renta mensual no disponible');
}, 10000);

// NOTE: Esperar a que se construya en el DOM el elemento
// "pane0621", que corresponde al área de trabajo
browser.waitForSelector("div#pane0621", function() {
  this.sendKeys("#per_doc", PERIODO_TRIBUTARIO, {keepFocus: true});

  this.sendKeys("#per_doc", this.page.event.key.Tab, {keepFocus: false});
}, function() {
  // TODO: script para indicar que no ha cargado el área de trabajo
  this.emit(CAPTURE_EVENT_NAME, 'filed-img');
}, 10000);

// NOTE: Pestaña "Datos Generales"
browser.waitFor(function() {
  var regimen = this.getElementInfo('#ind_rec_0'),
      movimiento =  this.getElementInfo('#ind_no_mov_0'),
      declaracion = this.getElementInfo('#ind_reg_rta_1');

  // NOTE: Verificamos que los radios de la pestaña,
  // estén habilitandos para su selección
  var disabled = (
    declaracion.attributes["aria-disabled"] == "false" &&
    movimiento.attributes["aria-disabled"] == "false" &&
    regimen.attributes["aria-disabled"] == "false"
  );

  return disabled;
}, function() {
  // NOTE: ¿La presente declaración rectifica o sustituye  a otra? ... No
  this.click("#ind_rec_0");

  // NOTE: Indicador de no movimiento ... No
  this.click("#ind_no_mov_0");

  // NOTE: Régimen de Rente ... Especial
  this.click("#ind_reg_rta_1");

  // NOTE: Botón "Siguiente", para pasar a la pestaña "IGV"
  this.click("#tabContainer_tablist > div:nth-child(2)");
}, function() {
  this.emit(CAPTURE_EVENT_NAME, 'pestania-general-controles-inactivos');

  this.emit(WARNING_ERROR_EVENT_NAME, 'Pestaña General: controles inactivos');
}, 10000);

// NOTE: Pestaña "IGV".
browser.then(function() {
  // NOTE: [100] Ventas Gravadas Netas
  this.sendKeys("#mto_vta_gra", VENTAS_GRAVADAS_NETAS, { keepFocus: true });

  // NOTE: [107] Compras Gravadas Netas
  this.sendKeys("#mto_com_gra", COMPRAS_GRAVADAS_NETAS, { keepFocus: true });

  // NOTE: Botón "Siguiente", para pasar a la pestaña "Renta"
  this.click("#tabContainer_tablist > div:nth-child(3)");
});

// NOTE: Pestaña "Renta".
browser.then(function() {
  // NOTE: [301] Ingresos Netos
  this.sendKeys("#mto_ing_net", INGRESOS_NETOS, { keepFocus: true });

  // NOTE: [301] Ingresos Netos: Presionamos "tab",
  // para que se calculen los tributos (Importe a Pagar)
  this.sendKeys("#mto_ing_net", this.page.event.key.Tab, { keepFocus: false });

  // NOTE: [307] Importe a Pagar: Borramos el importe anterior
  // (calculado anteriormente), y consignamos un nuevo valor en "0",
  // puesto que el pago deberá realizarse aparte
  if (IMPORTE_PAGAR > 0.495) {
    this.sendKeys("#mto_pag_rta", "0", { reset: true, keepFocus: true });
  }

  // NOTE: Botón "Agregar a Bandeja", para pasar a la pestaña "Renta"
  this.click("button#btn_add");
});

// NOTE: Verificamos que la declaración haya sido
// agregada a la bandeja, para realizar la presentación
browser.waitForSelector('div#grdLstItems_row_0', function() {
  // NOTE: Botón "Presentar/Pagar/NPS", para presentar la declaración jurada
  this.click("button#btn_pay");
}, function() {
  this.emit(CAPTURE_EVENT_NAME, 'ErrorAgregarRentaMensualBandeja');

  this.emit(DANGER_ERROR_EVENT_NAME, 'Errores al agregar renta mensual a bandeja');
}, 30000);

// NOTE: Verificamos que la sección "Constancia de Declaración y Pago",
// haya cargado correctamente
browser.waitForSelector("div#recordContent div#record", function() {
  /*// NOTE: Botón "Guardar", para guardar la constancia de presentación
  this.click("button#canal_form_SaveButton_0");*/

  // TODO: script para salvar una imagen de la declaración jurada
}, function() {
  this.emit(CAPTURE_EVENT_NAME, 'ConstanciaDeclaracionIncorrecta');

  this.echo('CONSTANCIA DE DECLARACIÓN INCORRECTA');
}, 60000);

browser.run(function() {
  this.exit();
});

// REF1: https://blog.lolnope.us/casperjs-and-arbitersports/
// REF2: https://searchcode.com/codesearch/view/92607326/
