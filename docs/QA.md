## What is the main difference between React, React Native and Aven?

React - JS system for putting things on the screen. Provides JSX
React Native - Uses React. Styling system on web, and the code framework on iOS and Android. Gives us "View and Text" components
Aven - Uses React native and React. Full application framework for building websites and mobile apps. Includes a solution for navigation and database. Gives us cloud and navigation (uses React navigation)

## What should I use Aven?

The main reason right now Aven is the first framework that works on iOS, web and Android, and also includes a database solution. It provides a full solution, great for beginners and companies.

What are the components of Aven

- Aven Cloud - Database solution, client, server
- Aven Plane - UI library
- Aven Navigation - Full stack navigation framework

## What are my database options with Aven?

There are several approaches

**New application Aven Cloud**

**Legacy data source**

- Create a custom data source for a new Aven application
- Test and deploy your new app

**Partial Aven app (no Aven Cloud)**

- Use fetch or a graphql client to connect your Aven client apps to your existing backend

**Production Switchover**

- Keep old server running
- Prototype new app with aven cloud
- Create migration script to copy from old app to aven cloud app
- Run the migration script, on a schedule
- Switch over to new app

## How can I use these features in an existing app?

If you want to use Cloud, Plane, or Navigation, and you want to copy-paste code from this repository:

- For everything imported from '@aven/\*' this will need to be installed from npm, but currently it is not published there!
- The code in this repo imports from '@rn', and in your application, it will import from 'react-native' or 'react-native-web'

## What happens if I'm using a different version?

The main reason you just start to use Aven is because you won't have any compatibility issues. This is the supported way

You are welcome to test other versions.

## What is the main difference between react and aven navigations?

Aven navigation is built on React navigation, and it provides opinionated cross plaatform navigators.

Right now it is unfortunately forked from ReactNav 4, but we recommend using React Nav 5 for mobile apps, while using Aven Navigation for web apps.

## Community Support for Aven?

While the Aven community is still quite small, it builds up on projects with very strong community support.

Aven takes a different approach, where we provide the full menu (see "omakase"), rather than a single component or two. We can provide a better experience to companies by focusing on their full experience rather than trying to popularize a small library or components.

## How does Aven update its components?

If a new version of a dependency is released, we usually upgrade in the monorepo pretty quickly, but if we see problems in the applications, we will hold off until they are fixed. Sometimes we will upgrade, and then detect a problem, and roll back to a previous version.

The important thing: most of the time, the Aven repository will provide a working and compatible set of dependencies.

## Is Aven secure?

Aven is designed to be secure, and is built with common technologies and security patterns, but it has not stood the test of time and has not earned a robust security history.

## What happens if Aven loses support?

Eric will maintain this project for as long as he can, but if he dies, you may be responsible for mainting the Aven components such as Cloud and Plane.
