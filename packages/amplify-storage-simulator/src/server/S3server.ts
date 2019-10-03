import * as express from 'express';
import * as cors from 'cors';
import { join, normalize } from 'path';
import { readFile, unlink, statSync, ensureFileSync, writeFileSync, existsSync } from 'fs-extra';
import * as xml from 'xml';
import * as bodyParser from 'body-parser';
import * as convert from 'xml-js';
import * as e2p from 'event-to-promise';
import * as serveStatic from 'serve-static';
import * as glob from 'glob';
import * as o2x from 'object-to-xml';
import * as uuid from 'uuid';
import * as etag from 'etag';
import * as EventEmitter from 'events';

import { StorageSimulatorServerConfig } from '../index';

import * as util from './utils';

const LIST_CONTENT = 'Contents';
const LIST_COMMOM_PREFIXES = 'CommonPrefixes';
const EVENT_RECORDS = 'Records';

var corsOptions = {
  maxAge: 20000,
  exposedHeaders: ['x-amz-server-side-encryption', 'x-amz-request-id', 'x-amz-id-2', 'ETag'],
};
export class StorageServer extends EventEmitter {
  private app;
  private server;
  private connection;
  private route; // bucket name get from the CFN parser
  url: string;
  private uploadIds = [];
  private upload_bufferMap: {
    [key: string]: {
      [key: string]: Buffer;
    };
  }; // object to store parts of a big file

  private localDirectoryPath: string;

  constructor(private config: StorageSimulatorServerConfig) {
    super();
    this.localDirectoryPath = config.localDirS3;
    this.app = express();
    this.app.use(express.json());
    this.app.use(cors(corsOptions));
    this.app.use(bodyParser.raw({ limit: '100mb', type: '*/*' }));
    this.app.use(bodyParser.json({ limit: '50mb', type: '*/*' }));
    this.app.use(bodyParser.urlencoded({ limit: '50mb', extended: false, type: '*/*' }));
    this.app.use(serveStatic(this.localDirectoryPath), this.handleRequestAll.bind(this));

    this.server = null;
    this.route = config.route;
    this.upload_bufferMap = {};
  }

  start() {
    if (this.server) {
      throw new Error('Server is already running');
    }

    this.server = this.app.listen(this.config.port);

    return e2p(this.server, 'listening').then(() => {
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

  private async handleRequestAll(request, response) {
    // parsing the path and the request parameters
    util.parseUrl(request, this.route);

    // create eventObj for thr trigger

    if (request.method === 'PUT') {
      this.handleRequestPut(request, response);
    }

    if (request.method === 'POST') {
      this.handleRequestPost(request, response);
    }

    if (request.method === 'GET') {
      this.handleRequestGet(request, response);
    }

    if (request.method === 'LIST') {
      this.handleRequestList(request, response);
    }

    if (request.method === 'DELETE') {
      // emit event for delete
      let eventObj = this.createEvent(request);
      this.emit('event', eventObj);
      this.handleRequestDelete(request, response);
    }
  }

  private async handleRequestGet(request, response) {
    const filePath = normalize(join(this.localDirectoryPath, request.params.path));
    if (existsSync(filePath)) {
      readFile(filePath, (err, data) => {
        if (err) {
          console.log('error');
        }
        response.send(data);
      });
    } else {
      response.status(404);
      response.send(
        o2x({
          '?xml version="1.0" encoding="utf-8"?': null,
          Error: {
            Code: 'NoSuchKey',
            Message: 'The specified key does not exist.',
            Key: request.params.path,
            RequestId: '',
            HostId: '',
          },
        })
      );
    }
  }

  private async handleRequestList(request, response) {
    let ListBucketResult = {};
    ListBucketResult[LIST_CONTENT] = [];
    ListBucketResult[LIST_COMMOM_PREFIXES] = [];

    let maxKeys;
    let prefix = request.query.prefix || '';
    if (request.query.maxKeys !== undefined) {
      maxKeys = Math.min(request.query.maxKeys, 1000);
    } else {
      maxKeys = 1000;
    }
    let delimiter = request.query.delimiter || '';
    let startAfter = request.query.startAfter || '';
    let keyCount = 0;
    // getting folders recursively
    const dirPath = normalize(join(this.localDirectoryPath, request.params.path) + '/');

    let files = glob.sync(dirPath + '/**/*');
    for (let file in files) {
      if (delimiter !== '' && util.checkfile(file, prefix, delimiter)) {
        ListBucketResult[LIST_COMMOM_PREFIXES].push({
          prefix: request.params.path + files[file].split(dirPath)[1],
        });
      }
      if (!statSync(files[file]).isDirectory()) {
        if (keyCount === maxKeys) {
          break;
        }

        ListBucketResult[LIST_CONTENT].push({
          Key: request.params.path + files[file].split(dirPath)[1],
          LastModified: new Date(statSync(files[file]).mtime).toISOString(),
          Size: statSync(files[file]).size,
          ETag: etag(files[file]),
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
    } else {
      ListBucketResult['IsTruncated'] = false;
    }
    response.set('Content-Type', 'text/xml');
    response.send(
      o2x({
        '?xml version="1.0" encoding="utf-8"?': null,
        ListBucketResult,
      })
    );
  }

  private async handleRequestDelete(request, response) {
    const filePath = join(this.localDirectoryPath, request.params.path);
    if (existsSync(filePath)) {
      unlink(filePath, err => {
        if (err) throw err;
        response.send(xml(convert.json2xml(JSON.stringify(request.params.id + 'was deleted'))));
      });
    } else {
      response.sendStatus(204);
    }
  }

  private async handleRequestPut(request, response) {
    const directoryPath = normalize(
      join(String(this.localDirectoryPath), String(request.params.path))
    );
    ensureFileSync(directoryPath);
    // strip signature in android , returns same buffer for other clients
    var new_data = util.stripChunkSignature(request.body);
    // loading data in map for each part
    if (request.query.partNumber !== undefined) {
      this.upload_bufferMap[request.query.uploadId][request.query.partNumber] = request.body;
    }
    else {
      writeFileSync(directoryPath, new_data);
      // event trigger  to differentitiate between multipart and normal put
      let eventObj = this.createEvent(request);
      this.emit('event', eventObj);
    }
    response.send(xml(convert.json2xml(JSON.stringify('upload success'))));
  }

  private async handleRequestPost(request, response) {
    const directoryPath = normalize(
      join(String(this.localDirectoryPath), String(request.params.path))
    );
    if (request.query.uploads !== undefined) {
      let id = uuid();
      this.uploadIds.push(id);
      this.upload_bufferMap[id] = {};
      response.send(
        o2x({
          '?xml version="1.0" encoding="utf-8"?': null,
          InitiateMultipartUploadResult: {
            Bucket: this.route,
            Key: request.params.path,
            UploadId: id
          },
        })
      );
    } else if (this.uploadIds.includes(request.query.uploadId)) {
      let arr: Buffer[] = Object.values(this.upload_bufferMap[request.query.uploadId]); // store all the buffers  in an array
      delete this.upload_bufferMap[request.query.uploadId]; // clear the map with current requestID

      // remove the current upload ID
      this.uploadIds.splice(this.uploadIds.indexOf(request.query.uploadId), 1);

      response.set('Content-Type', 'text/xml');
      response.send(
        o2x({
          '?xml version="1.0" encoding="utf-8"?': null,
          CompleteMultipartUploadResult: {
            Location: request.url,
            Bucket: this.route,
            Key: request.params.path,
            Etag: etag(directoryPath),
          },
        })
      );
      let buf = Buffer.concat(arr);
      writeFileSync(directoryPath, buf);
      
      // event trigger for multipart post
      let eventObj = this.createEvent(request);
      this.emit('event', eventObj);
    } else {
      const directoryPath = normalize(
        join(String(this.localDirectoryPath), String(request.params.path))
      );
      ensureFileSync(directoryPath);
      var new_data = util.stripChunkSignature(request.body);
      writeFileSync(directoryPath, new_data);
      // event trigger for normal post
      let eventObj = this.createEvent(request);
      this.emit('event', eventObj);
      response.send(
        o2x({
          '?xml version="1.0" encoding="utf-8"?': null,
          PostResponse: {
            Location: request.url,
            Bucket: this.route,
            Key: request.params.path,
            Etag: etag(directoryPath),
          },
        })
      );
    }
  }
  // build eevent obj for s3 trigger
  private createEvent(request) {
    const filePath = normalize(join(this.localDirectoryPath, request.params.path));
    let eventObj = {};
    eventObj[EVENT_RECORDS] = [];

    let event = {
      eventVersion: '2.0',
      eventSource: 'aws:s3',
      awsRegion: 'local',
      eventTime: new Date().toISOString(),
      eventName: `ObjectCreated:${request.method}`,
    };

    let s3 = {
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
        size: statSync(filePath).size,
        eTag: etag(filePath),
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
