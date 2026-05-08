function doGet(e) {
  const vista = (e && e.parameter && e.parameter.v) ? String(e.parameter.v).trim() : '';

  if (vista === 'admin') {
    return HtmlService.createTemplateFromFile('admin').evaluate()
      .setTitle('Panel de Administración')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
      .addMetaTag('viewport', 'width=device-width, initial-scale=1');
  }

  return HtmlService.createTemplateFromFile('index').evaluate()
    .setTitle('Ingreso Personal')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}
