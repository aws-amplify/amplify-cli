"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OperationServer = void 0;
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const graphql_1 = require("graphql");
const path_1 = require("path");
const auth_helpers_1 = require("../utils/auth-helpers");
const helpers_1 = require("../utils/graphql-runner/helpers");
const query_and_mutation_1 = require("../utils/graphql-runner/query-and-mutation");
const subscriptions_1 = require("../utils/graphql-runner/subscriptions");
const helpers_2 = require("../utils/auth-helpers/helpers");
const server_1 = require("./subscription/websocket-server/server");
const MAX_BODY_SIZE = '10mb';
const STATIC_ROOT = (0, path_1.join)(__dirname, '..', '..', 'public');
class OperationServer {
    constructor(config, simulatorContext) {
        this.config = config;
        this.simulatorContext = simulatorContext;
        this.handleClearDBData = async (request, response) => {
            console.log('Clearing DB data...');
            try {
                const deletedItems = await this.simulatorContext.clearData();
                console.log('DB data cleared');
                return response.status(200).send({ message: `Successfully deleted ${JSON.stringify(deletedItems)} tables` });
            }
            catch (e) {
                console.error(`Error clearing DB data. Error: ${e.message}`);
                return response.status(500).send({ message: e.message });
            }
        };
        this.handleAPIInfoRequest = (request, response) => {
            return response.send(this.simulatorContext.appSyncConfig);
        };
        this.handleRequest = async (request, response) => {
            try {
                const { headers } = request;
                let requestAuthorizationMode;
                try {
                    requestAuthorizationMode = (0, auth_helpers_1.getAuthorizationMode)(headers, this.simulatorContext.appSyncConfig);
                }
                catch (e) {
                    return response.status(401).send({
                        errors: [
                            {
                                errorType: 'UnauthorizedException',
                                message: e.message,
                            },
                        ],
                    });
                }
                const { variables = {}, query, operationName } = request.body;
                const doc = (0, graphql_1.parse)(query);
                if (!this.simulatorContext.schema) {
                    return response.send({
                        data: null,
                        error: 'No schema available',
                    });
                }
                const authorization = (0, auth_helpers_1.extractHeader)(headers, 'Authorization');
                const jwt = authorization && (0, auth_helpers_1.extractJwtToken)(authorization);
                const sourceIp = request.connection.remoteAddress;
                const iamToken = requestAuthorizationMode === 'AWS_IAM' ? (0, helpers_2.extractIamToken)(authorization, this.simulatorContext.appSyncConfig) : undefined;
                const context = {
                    jwt,
                    requestAuthorizationMode,
                    sourceIp,
                    headers: request.headers,
                    appsyncErrors: [],
                    iamToken,
                };
                switch ((0, helpers_1.getOperationType)(doc, operationName)) {
                    case 'query':
                    case 'mutation': {
                        const gqlResult = await (0, query_and_mutation_1.runQueryOrMutation)(this.simulatorContext.schema, doc, variables, operationName, context);
                        return response.send(gqlResult);
                    }
                    case 'subscription': {
                        const subscriptionResult = await (0, subscriptions_1.runSubscription)(this.simulatorContext.schema, doc, variables, operationName, context);
                        if (subscriptionResult.errors) {
                            return response.send(subscriptionResult);
                        }
                        throw new Error(`Subscription request is only supported in realtime url. Send requests to ${server_1.REALTIME_SUBSCRIPTION_PATH} path instead`);
                        break;
                    }
                    default:
                        throw new Error(`unknown operation`);
                }
            }
            catch (e) {
                console.log('Error while executing GraphQL statement', e);
                return response.send({
                    errorMessage: e.message,
                });
            }
        };
        this._app = (0, express_1.default)();
        this._app.use(express_1.default.json({ limit: MAX_BODY_SIZE }));
        this._app.use((0, cors_1.default)());
        this._app.post('/graphql', this.handleRequest);
        this._app.get('/api-config', this.handleAPIInfoRequest);
        this._app.delete('/clear-data', this.handleClearDBData);
        this._app.use('/', express_1.default.static(STATIC_ROOT));
    }
    get app() {
        return this._app;
    }
}
exports.OperationServer = OperationServer;
//# sourceMappingURL=operations.js.map