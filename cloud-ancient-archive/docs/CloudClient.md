# Cloud Clients

Here we describe the main tools for accessing data from your application.

## Authenticated and non-authenticated clients

createCloud produces a client for a given session (auth object, which can be null). createClient allows you to log in, and it will automatically maintain the cloud on your behalf.

## Cloud API

In your app, you can access this object with `useCloud()`. It has everything you need to read and write data in your app.

There are a few concepts within the cloud API, with their own API pages:

- [`Cloud`](./CloudAPI.md) - the object that gives you access to a domain of data
- `DocSet`](./CloudAPI.md) - represents a set of docs, either top-level docs under the domain, or children docs
- [`Doc`](./CloudAPI.md) - One named data entry in a doc set. It refers to a current block of data..
- [`Block`](./CloudAPI.md) - One chunk of data that never changes (although it may not be loaded). It has an id, but no name.

## Client API

In your app, you can access this object with `useCloudClient()`. This module allows you to log in, log out, and it will give you access to the cloud object that allows you to access data based on your current authentication.

## Doc Set API

## Doc API
