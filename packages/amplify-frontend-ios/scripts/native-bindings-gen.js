const path = require('path');
const fs = require('fs');
const { generateNativeBindings } = require('../native-bindings-codegen');

const OUPUT_DIR = path.join('..', 'lib');
const SCHEMA_RELATIVE_PATH = path.join('..', 'resources', 'amplify-xcode.json');

const schemaPath = path.join(__dirname, SCHEMA_RELATIVE_PATH);
const schema = JSON.parse(fs.readFileSync(schemaPath));
const outputPath = path.join(__dirname, OUPUT_DIR, 'amplify-xcode.js');

generateNativeBindings(schema, outputPath);
