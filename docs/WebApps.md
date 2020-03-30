# Web App Structure

The boilerplate web app has 4 files. If your app was named "Pilot", they would be:

- `PilotServer.js` - Your server
- `PilotClient.js` - Your server
- `PilotApp.js` - Your main app, which will be rendered on the client and the server
- `app.json` provides configuration to the framework
  - specifies the domain for Aven Cloud
  - specifies the entry point files for client and server

## Commands

`yarn dev $APP_NAME` - build and run the server once. Also run the packager in development mode so the browser can refresh and see new changes.

`yarn build $APP_NAME` - build the app for production

`yarn start $APP_NAME` - run the app in production mode
