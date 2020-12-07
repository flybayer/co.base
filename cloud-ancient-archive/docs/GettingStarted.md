# Get Started with Aven

First, make sure you have [nodejs 12 and yarn](https://github.com/AvenCloud/Aven)

1. Fork the [Aven repo on GitHub](https://github.com/AvenCloud/Aven)
2. Run `git clone $YOUR_REPO_URL`
3. cd into your repo
4. run `yarn`
5. Create a new project by running `yarn init-web`. Then it will ask you to:
   a. Provide your app folder name (eg. my-app)
   b. Provide your app TitleCase name (eg. MyApp)
   c. Provide a domain for your app- (this "domain" will not be validated, and is entirely internal to your app. It can be changed later in `app.json`)
6. Run your app with `yarn dev $APP_FOLDER_NAME` (eg `yarn dev my-app`)
7. Wait for it to start, and open the app in your browser at `http://localhost:8080`

Now, you can edit your code in `/src/$APP_FOLDER_NAME` eg `/src/my-app`. For details on the starter files, see the [Web App Structure](./WebApps.md).
