## What is the main difference between React, React Native and Aven?

**React** - JS library for UI components. Provides JSX
**React Native** - Uses React. Styling system on web, and the code framework on iOS and Android. Provides `<View>` and `<Text>` components
**Aven** - Uses React native and React. Full application framework for building websites and mobile apps. Includes a solution for navigation and database. Gives us cloud and navigation (built upon **React navigation**)

## Why would I use Aven?

Aven is the first framework for web, Android and iOS that includes a database solution. The full-solution approach is ideal for beginners, and for companies who need a full stack.

## What are the components of Aven

- Aven Cloud - Database solution, client, server
- Aven Plane - UI library
- Aven Navigation - Full stack navigation framework

## What are my database options with Aven?

There are several approaches

**Greenfield Aven Cloud**

Use Aven Cloud for a new application, on top of PostgreSQL

**Legacy data source**

- Create a custom data source for a new Aven application, backed by your existing backend
- Test and deploy your new app

**Partial Aven app (no Aven Cloud)**

- Use fetch or a graphql client to connect Aven client apps to your existing backend

**Production Switchover**

- Keep old server running
- Prototype new app with Aven Cloud
- Create migration script to copy from old app to Aven Cloud app
- Run the migration script, on a schedule
- Switch over to new app

## How can I use these features in an existing app?

If you want to use Cloud, Plane, or Navigation, and you want to copy-paste code from this repository:

- For everything imported from '@aven/\*' this will need to be installed from npm, but currently it is not published there! (This is why we reccomend forking this repo)
- The code in this repo imports from '@rn', and in your application, it will import from 'react-native' or 'react-native-web'

## What happens if I'm using different versions?

This respository aims to provide a working and mostly up-to-date set of dependencies for you.

If you want to manage versions yourself, you can take guidance from the package.json of this repo, in the commit of the code you need grab.

You are welcome to test other versions and report problems that you find.

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

Aven is built with common security patterns and it is possible to build secure applications with the framework, but the project is still young and has not been fully audited for security.

## What happens if Aven loses support?

Eric will maintain this project for as long as he can, but if he dies, you may be responsible for maintaining the Aven components such as Cloud and Plane, along with other Aven users.
