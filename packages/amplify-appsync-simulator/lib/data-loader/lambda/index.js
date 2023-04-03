"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LambdaDataLoader = void 0;
const dataloader_1 = __importDefault(require("dataloader"));
const batchLoaders = {};
const getBatchDataResolver = (loaderName, resolver) => {
    if (batchLoaders[loaderName] === undefined) {
        batchLoaders[loaderName] = new dataloader_1.default(resolver, { cache: false });
    }
    return batchLoaders[loaderName];
};
class LambdaDataLoader {
    constructor(_config) {
        this._config = _config;
    }
    async load(req, extraData) {
        try {
            let result;
            if (req.operation === 'BatchInvoke') {
                const { fieldName, parentType } = extraData.info;
                const batchName = `${parentType}.${fieldName}`;
                const dataLoader = getBatchDataResolver(batchName, this._config.invoke);
                result = await dataLoader.load(req.payload);
            }
            else {
                result = await this._config.invoke(req.payload);
            }
            return result;
        }
        catch (e) {
            console.log('Lambda Data source failed with the following error');
            console.error(e);
            throw e;
        }
    }
}
exports.LambdaDataLoader = LambdaDataLoader;
//# sourceMappingURL=index.js.map