# Cloud Client

## Authenticated and non-authenticated clients

createSessionClient produces a client for a given session (auth object, which can be null). createClient allows you to log in, and it will automatically maintain the session client on your behalf.

## useCloud

In your React apps, you can access the client with the useCloud hook from `@aven/cloud-core`,
