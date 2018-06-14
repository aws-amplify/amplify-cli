"use strict";
/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.2.0 */
Object.defineProperty(exports, "__esModule", { value: true });
const resource_1 = require("../resource");
class DataSource {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.DataSource = DataSource;
class EnvironmentVariable {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.EnvironmentVariable = EnvironmentVariable;
class SslConfiguration {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.SslConfiguration = SslConfiguration;
class Source {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.Source = Source;
class App extends resource_1.ResourceBase {
    constructor(properties) {
        super('AWS::OpsWorks::App', properties);
    }
}
App.DataSource = DataSource;
App.EnvironmentVariable = EnvironmentVariable;
App.SslConfiguration = SslConfiguration;
App.Source = Source;
exports.default = App;
