# Amplify GraphiQL Explorer

This is the package that contains graphiql explorer assets for amplify-appsync-simulator. This is a private package and does not get published to NPM. These assets get copied to amplify-appsync-simulator at the build step of amplify-appsync-simulator.

## Development Mode

When making changes to grapiql-explorer, run `yarn start`. All the requests get proxied to `http://localhost:20002/` by default (If you use the --https flag on `amplify mock`, change the proxy from `http://localhost:20002/` to `https://localhost:20002/` in package.json.)
