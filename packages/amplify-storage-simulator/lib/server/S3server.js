"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StorageServer = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs-extra"));
const xml_1 = __importDefault(require("xml"));
const bodyParser = __importStar(require("body-parser"));
const convert = __importStar(require("xml-js"));
const promise_toolbox_1 = require("promise-toolbox");
const serve_static_1 = __importDefault(require("serve-static"));
const glob = __importStar(require("glob"));
const object_to_xml_1 = __importDefault(require("object-to-xml"));
const uuid_1 = require("uuid");
const etag_1 = __importDefault(require("etag"));
const events_1 = require("events");
const util = __importStar(require("./utils"));
const LIST_CONTENT = 'Contents';
const LIST_COMMOM_PREFIXES = 'CommonPrefixes';
const EVENT_RECORDS = 'Records';
const corsOptions = {
    maxAge: 20000,
    exposedHeaders: ['x-amz-server-side-encryption', 'x-amz-request-id', 'x-amz-id-2', 'ETag'],
};
class StorageServer extends events_1.EventEmitter {
    constructor(config) {
        super();
        this.config = config;
        this.uploadIds = [];
        this.localDirectoryPath = config.localDirS3;
        this.app = (0, express_1.default)();
        this.app.use((0, cors_1.default)(corsOptions));
        this.app.use(bodyParser.raw({ limit: '100mb', type: '*/*' }));
        this.app.use((0, serve_static_1.default)(this.localDirectoryPath), this.handleRequestAll.bind(this));
        this.server = null;
        this.route = config.route;
        this.upload_bufferMap = {};
    }
    start() {
        if (this.server) {
            throw new Error('Server is already running');
        }
        this.server = this.app.listen(this.config.port);
        return (0, promise_toolbox_1.fromEvent)(this.server, 'listening').then(() => {
            this.connection = this.server.address();
            this.url = `http://localhost:${this.connection.port}`;
            return this.server;
        });
    }
    stop() {
        if (this.server) {
            this.server.close();
            this.server = null;
            this.connection = null;
            this.uploadIds = null;
            this.upload_bufferMap = null;
        }
    }
    async handleRequestAll(request, response) {
        util.parseUrl(request, this.route);
        if (request.method === 'PUT') {
            await this.handleRequestPut(request, response);
        }
        if (request.method === 'POST') {
            await this.handleRequestPost(request, response);
        }
        if (request.method === 'GET') {
            await this.handleRequestGet(request, response);
        }
        if (request.method === 'LIST') {
            await this.handleRequestList(request, response);
        }
        if (request.method === 'DELETE') {
            const eventObj = this.createEvent(request);
            this.emit('event', eventObj);
            await this.handleRequestDelete(request, response);
        }
    }
    async handleRequestGet(request, response) {
        const filePath = path.normalize(path.join(this.localDirectoryPath, request.params.path));
        if (fs.existsSync(filePath) && !fs.statSync(filePath).isDirectory()) {
            fs.readFile(filePath, (err, data) => {
                if (err) {
                    console.log('error');
                }
                response.send(data);
            });
        }
        else {
            let keyName = request.params.path.replace(/\\/g, '/');
            if (keyName.startsWith('/')) {
                keyName = keyName.slice(1);
            }
            response.set('Content-Type', 'text/xml');
            response.status(404);
            response.send((0, object_to_xml_1.default)({
                '?xml version="1.0" encoding="utf-8"?': null,
                Error: {
                    Code: 'NoSuchKey',
                    Message: 'The specified key does not exist.',
                    Key: keyName,
                    RequestId: '',
                    HostId: '',
                },
            }));
        }
    }
    async handleRequestList(request, response) {
        const ListBucketResult = {};
        ListBucketResult[LIST_CONTENT] = [];
        ListBucketResult[LIST_COMMOM_PREFIXES] = [];
        let maxKeys;
        const prefix = request.query.prefix || '';
        if (request.query.maxKeys !== undefined) {
            maxKeys = Math.min(request.query.maxKeys, 1000);
        }
        else {
            maxKeys = 1000;
        }
        const delimiter = request.query.delimiter || '';
        let keyCount = 0;
        const dirPath = path.normalize(path.join(this.localDirectoryPath, request.params.path));
        const files = glob.sync('**/*', {
            cwd: dirPath,
            absolute: true,
        });
        for (const file of files) {
            const normalizedFile = path.normalize(file);
            let keyName = normalizedFile.replace(dirPath, '').replace(/\\/g, '/');
            if (keyName.startsWith('/')) {
                keyName = keyName.slice(1);
            }
            if (delimiter !== '' && util.checkFile(file, prefix, delimiter)) {
                ListBucketResult[LIST_COMMOM_PREFIXES].push({
                    prefix: request.params.path + keyName,
                });
            }
            if (!fs.statSync(file).isDirectory()) {
                if (keyCount === maxKeys) {
                    break;
                }
                ListBucketResult[LIST_CONTENT].push({
                    Key: request.params.path + keyName,
                    LastModified: new Date(fs.statSync(file).mtime).toISOString(),
                    Size: fs.statSync(file).size,
                    ETag: (0, etag_1.default)(file),
                    StorageClass: 'STANDARD',
                });
                keyCount = keyCount + 1;
            }
        }
        ListBucketResult['Name'] = this.route.split('/')[1];
        ListBucketResult['Prefix'] = request.query.prefix || '';
        ListBucketResult['KeyCount'] = keyCount;
        ListBucketResult['MaxKeys'] = maxKeys;
        ListBucketResult['Delimiter'] = delimiter;
        if (keyCount === maxKeys) {
            ListBucketResult['IsTruncated'] = true;
        }
        else {
            ListBucketResult['IsTruncated'] = false;
        }
        response.set('Content-Type', 'text/xml');
        response.send((0, object_to_xml_1.default)({
            '?xml version="1.0" encoding="utf-8"?': null,
            ListBucketResult,
        }));
    }
    async handleRequestDelete(request, response) {
        const filePath = path.join(this.localDirectoryPath, request.params.path);
        if (fs.existsSync(filePath)) {
            fs.unlink(filePath, (err) => {
                if (err)
                    throw err;
                response.set('Content-Type', 'text/xml');
                response.send((0, xml_1.default)(convert.json2xml(JSON.stringify(request.params.id + 'was deleted'))));
            });
        }
        else {
            response.sendStatus(204);
        }
    }
    async handleRequestPut(request, response) {
        const directoryPath = path.normalize(path.join(String(this.localDirectoryPath), String(request.params.path)));
        fs.ensureFileSync(directoryPath);
        const new_data = util.stripChunkSignature(request.body);
        if (request.query.partNumber !== undefined) {
            this.upload_bufferMap[request.query.uploadId][request.query.partNumber] = request.body;
        }
        else {
            fs.writeFileSync(directoryPath, new_data);
            const eventObj = this.createEvent(request);
            this.emit('event', eventObj);
        }
        response.set('Content-Type', 'text/xml');
        response.send((0, xml_1.default)(convert.json2xml(JSON.stringify('upload success'))));
    }
    async handleRequestPost(request, response) {
        const directoryPath = path.normalize(path.join(String(this.localDirectoryPath), String(request.params.path)));
        if (request.query.uploads !== undefined) {
            const id = (0, uuid_1.v4)();
            this.uploadIds.push(id);
            this.upload_bufferMap[id] = {};
            response.set('Content-Type', 'text/xml');
            response.send((0, object_to_xml_1.default)({
                '?xml version="1.0" encoding="utf-8"?': null,
                InitiateMultipartUploadResult: {
                    Bucket: this.route,
                    Key: request.params.path,
                    UploadId: id,
                },
            }));
        }
        else if (this.uploadIds.includes(request.query.uploadId)) {
            const arr = Object.values(this.upload_bufferMap[request.query.uploadId]);
            delete this.upload_bufferMap[request.query.uploadId];
            this.uploadIds.splice(this.uploadIds.indexOf(request.query.uploadId), 1);
            response.set('Content-Type', 'text/xml');
            response.send((0, object_to_xml_1.default)({
                '?xml version="1.0" encoding="utf-8"?': null,
                CompleteMultipartUploadResult: {
                    Location: request.url,
                    Bucket: this.route,
                    Key: request.params.path,
                    Etag: (0, etag_1.default)(directoryPath),
                },
            }));
            const buf = Buffer.concat(arr);
            fs.writeFileSync(directoryPath, buf);
            const eventObj = this.createEvent(request);
            this.emit('event', eventObj);
        }
        else {
            const directoryPath = path.normalize(path.join(String(this.localDirectoryPath), String(request.params.path)));
            fs.ensureFileSync(directoryPath);
            const new_data = util.stripChunkSignature(request.body);
            fs.writeFileSync(directoryPath, new_data);
            const eventObj = this.createEvent(request);
            this.emit('event', eventObj);
            response.set('Content-Type', 'text/xml');
            response.send((0, object_to_xml_1.default)({
                '?xml version="1.0" encoding="utf-8"?': null,
                PostResponse: {
                    Location: request.url,
                    Bucket: this.route,
                    Key: request.params.path,
                    Etag: (0, etag_1.default)(directoryPath),
                },
            }));
        }
    }
    createEvent(request) {
        const filePath = path.normalize(path.join(this.localDirectoryPath, request.params.path));
        const eventObj = {};
        eventObj[EVENT_RECORDS] = [];
        const event = {
            eventVersion: '2.0',
            eventSource: 'aws:s3',
            awsRegion: 'local',
            eventTime: new Date().toISOString(),
            eventName: `ObjectCreated:${request.method}`,
        };
        const s3 = {
            s3SchemaVersion: '1.0',
            configurationId: 'testConfigRule',
            bucket: {
                name: String(this.route).substring(1),
                ownerIdentity: {
                    principalId: 'A3NL1KOZZKExample',
                },
                arn: `arn:aws:s3:::${String(this.route).substring(1)}`,
            },
            object: {
                key: request.params.path,
                size: fs.statSync(filePath).size,
                eTag: (0, etag_1.default)(filePath),
                versionId: '096fKKXTRTtl3on89fVO.nfljtsv6qko',
            },
        };
        eventObj[EVENT_RECORDS].push({
            event,
            s3,
        });
        return eventObj;
    }
}
exports.StorageServer = StorageServer;
//# sourceMappingURL=S3server.js.map