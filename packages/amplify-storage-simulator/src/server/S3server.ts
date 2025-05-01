import express from 'express';
import cors from 'cors';
import * as path from 'path';
import * as fs from 'fs-extra';
import xml from 'xml';
import * as bodyParser from 'body-parser';
import * as convert from 'xml-js';
import { fromEvent } from 'promise-toolbox';
import serveStatic from 'serve-static';
import { globSync } from 'glob';
import o2x from 'object-to-xml';
import { v4 as uuid } from 'uuid';
import etag from 'etag';
import { EventEmitter } from 'events';

import { StorageSimulatorServerConfig } from '../index';

import * as util from './utils';

const LIST_CONTENT = 'Contents';
const LIST_COMMOM_PREFIXES = 'CommonPrefixes';
const EVENT_RECORDS = 'Records';

const corsOptions = {
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
    this.app.use(cors(corsOptions));
    // eslint-disable-next-line spellcheck/spell-checker
    this.app.use(bodyParser.raw({ limit: '100mb', type: '*/*' }));
    /* eslint-disable @typescript-eslint/no-misused-promises */
    this.app.use(serveStatic(this.localDirectoryPath), this.handleRequestAll.bind(this));
    /* eslint-enable */

    this.server = null;
    this.route = config.route;
    this.upload_bufferMap = {};
  }

  start() {
    if (this.server) {
      throw new Error('Server is already running');
    }

    this.server = this.app.listen(this.config.port);

    return fromEvent(this.server, 'listening').then(() => {
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
    try {
      // parsing the path and the request parameters
      util.parseUrl(request, this.route);

      // create eventObj for thr trigger

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
        // emit event for delete
        const eventObj = this.createEvent(request);
        this.emit('event', eventObj);
        await this.handleRequestDelete(request, response);
      }
    } catch (err) {
      response.set('Content-Type', 'text/xml');
      response.status(500);
      response.send(
        o2x({
          '?xml version="1.0" encoding="utf-8"?': null,
          Error: {
            Code: 'InternalServerException',
            Message: err.message,
          },
        }),
      );
    }
  }

  private async handleRequestGet(request, response) {
    const filePath = path.normalize(path.join(this.localDirectoryPath, request.params.path));
    if (fs.existsSync(filePath) && !fs.statSync(filePath).isDirectory()) {
      fs.readFile(filePath, (err, data) => {
        if (err) {
          console.log('error');
        }
        response.send(data);
      });
    } else {
      // fix up the key name for proper error message since it is normalized for the given platform
      // remove the leading path separator and replace the remaining ones.
      let keyName = request.params.path.replace(/\\/g, '/');
      if (keyName.startsWith('/')) {
        keyName = keyName.slice(1);
      }
      response.set('Content-Type', 'text/xml');
      response.status(404);
      response.send(
        o2x({
          '?xml version="1.0" encoding="utf-8"?': null,
          Error: {
            Code: 'NoSuchKey',
            Message: 'The specified key does not exist.',
            Key: keyName,
            RequestId: '',
            HostId: '',
          },
        }),
      );
    }
  }

  private async handleRequestList(request, response) {
    const ListBucketResult = {};
    ListBucketResult[LIST_CONTENT] = [];
    ListBucketResult[LIST_COMMOM_PREFIXES] = [];

    let maxKeys;
    const prefix = request.query.prefix || '';
    if (request.query.maxKeys !== undefined) {
      maxKeys = Math.min(request.query.maxKeys, 1000);
    } else {
      maxKeys = 1000;
    }
    const delimiter = request.query.delimiter || '';
    let keyCount = 0;
    // getting folders recursively
    const dirPath = path.normalize(path.join(this.localDirectoryPath, request.params.path));

    const files = globSync('**/*', {
      cwd: dirPath,
      absolute: true,
    });
    for (const file of files) {
      // We have to normalize glob returned filenames to make sure deriving the key name will work under every OS.
      const normalizedFile = path.normalize(file);
      // Remove directory portion, cut starting slash, replace backslash with slash.
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
          ETag: etag(file),
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
      }),
    );
  }

  private async handleRequestDelete(request, response) {
    const filePath = path.join(this.localDirectoryPath, request.params.path);
    if (fs.existsSync(filePath)) {
      fs.unlink(filePath, (err) => {
        if (err) throw err;
        response.set('Content-Type', 'text/xml');
        response.send(xml(convert.json2xml(JSON.stringify(request.params.id + 'was deleted'))));
      });
    } else {
      response.sendStatus(204);
    }
  }

  private async handleRequestPut(request, response) {
    const directoryPath = path.normalize(path.join(String(this.localDirectoryPath), String(request.params.path)));
    fs.ensureFileSync(directoryPath);
    // strip signature in android , returns same buffer for other clients
    const new_data = util.stripChunkSignature(request.body);
    // loading data in map for each part
    if (request.query.partNumber !== undefined) {
      this.upload_bufferMap[request.query.uploadId][request.query.partNumber] = request.body;
    } else {
      fs.writeFileSync(directoryPath, new_data);
      // event trigger  to differentiate between multipart and normal put
      const eventObj = this.createEvent(request);
      this.emit('event', eventObj);
    }
    response.set('Content-Type', 'text/xml');
    response.send(xml(convert.json2xml(JSON.stringify('upload success'))));
  }

  private async handleRequestPost(request, response) {
    const directoryPath = path.normalize(path.join(String(this.localDirectoryPath), String(request.params.path)));
    if (request.query.uploads !== undefined) {
      const id = uuid();
      this.uploadIds.push(id);
      this.upload_bufferMap[id] = {};
      response.set('Content-Type', 'text/xml');
      response.send(
        o2x({
          '?xml version="1.0" encoding="utf-8"?': null,
          InitiateMultipartUploadResult: {
            Bucket: this.route,
            Key: request.params.path,
            UploadId: id,
          },
        }),
      );
    } else if (this.uploadIds.includes(request.query.uploadId)) {
      const arr: Buffer[] = Object.values(this.upload_bufferMap[request.query.uploadId]); // store all the buffers  in an array
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
        }),
      );
      const buf = Buffer.concat(arr);
      fs.writeFileSync(directoryPath, buf);
      // event trigger for multipart post
      const eventObj = this.createEvent(request);
      this.emit('event', eventObj);
    } else {
      const directoryPath = path.normalize(path.join(String(this.localDirectoryPath), String(request.params.path)));
      fs.ensureFileSync(directoryPath);
      const new_data = util.stripChunkSignature(request.body);
      fs.writeFileSync(directoryPath, new_data);
      // event trigger for normal post
      const eventObj = this.createEvent(request);
      this.emit('event', eventObj);
      response.set('Content-Type', 'text/xml');
      response.send(
        o2x({
          '?xml version="1.0" encoding="utf-8"?': null,
          PostResponse: {
            Location: request.url,
            Bucket: this.route,
            Key: request.params.path,
            Etag: etag(directoryPath),
          },
        }),
      );
    }
  }
  // build event obj for s3 trigger
  private createEvent(request) {
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
        eTag: etag(filePath),
        // eslint-disable-next-line spellcheck/spell-checker
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
