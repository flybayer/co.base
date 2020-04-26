export default function mountElectronApp(mainWindow, appConfig, opts = {}) {
  const html = `
<!DOCTYPE html>
<html style="height:100%;">
  <head>
    <meta charset="UTF-8" />
    <!-- https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP -->
    <meta
      http-equiv="Content-Security-Policy"
      content="default-src 'self' http://localhost:8081; script-src 'self' http://localhost:8081; style-src 'self' 'unsafe-inline' http://localhost:8081 'unsafe-inline'"
    />
    <meta
      http-equiv="X-Content-Security-Policy"
      content="default-src 'self' http://localhost:8081; script-src 'self' http://localhost:8081; style-src 'self' 'unsafe-inline' http://localhost:8081 'unsafe-inline'"
    />
    <title>Hello Electron!</title>
    <link rel="stylesheet" href="./reset.css" />
  </head>
  <body style="height:100%;">
    <div id="root" style="height:100%; display: flex;"></div>
    <script src="http://localhost:8081/src/${appConfig.name}/${
    appConfig.clientEntry
  }.bundle?platform=web"></script>
  </body>
</html>
`;
  mainWindow.loadURL('data:text/html;charset=utf-8,' + encodeURI(html));
}
