# Amplify DynamoDB Simulator

This package contains wrapper logic to download and use the dynamodb emulator.

This package automatically (on install) downloads the latest dynamodb emulator.

Much of the logic in this package is around retrying to start the server. This can be an issue when using jest and there is contention when binding a port.

## Usage

```js
const emulator = require('amplify-dynamodb-simulator');

async function main() {
  // start the emulator
  const emu = await emulator.launch({
    /* options */
  });
  // by default we launch the emulator on some open port in the ephemeral range in the 'inMemory' mode.

  // get the dynamodb client (aws-sdk)
  const dynamodb = emulator.getClient(emu);
}
```

### Options:

#### `port`

Port to bind the emulator to. If omitted will bind to the first available port in the ephemeral range.

default: `null`

#### `sharedDb`

If to use a single database file to use in the emulator. Should typically be left on.

default: `true`

#### `dbPath`

Where to launch the database. Will automatically create this directory if missing.

deafult: `null`

#### `startTimeout`

Maximum amount of time to wait for the dynamodb emulator to start listening on it's chosen port.

default: `5000`