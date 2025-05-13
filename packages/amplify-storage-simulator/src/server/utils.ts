import * as path from 'path';

// parse the request url to get the path and storing in the request.params.path  with the prefix if present

export function parseUrl(request, route: string) {
  request.url = path.normalize(decodeURIComponent(request.url));
  const temp = request.url.split(route);
  request.params.path = '';

  if (request.query.prefix !== undefined) {
    request.params.path = request.query.prefix + '/';
  }

  if (temp[1] !== undefined) {
    request.params.path = path.normalize(path.join(request.params.path, temp[1].split('?')[0]));
  } else {
    // change for IOS as no bucket name is present in the original url
    request.params.path = path.normalize(path.join(request.params.path, temp[0].split('?')[0]));
  }

  if (request.params.path[0] == '/' || request.params.path[0] == '.') {
    request.params.path = request.params.path.substring(1);
  }

  // changing file path by removing invalid file path characters for windows
  if (process.platform === 'win32') {
    request.params.path = request.params.path.replace(/[<>:"|?*]/g, (match) => '%' + Buffer.from(match, 'utf8').toString('hex'));
  }

  if (request.method === 'GET') {
    if (request.query.prefix !== undefined || (temp[1] === '' && temp[0] === '') || (temp[1] === '/' && temp[0] === '')) {
      request.method = 'LIST';
    }
  }
}

// check for the delimiter in the file for list object request
export function checkFile(file: string, prefix: string, delimiter: string) {
  if (delimiter === '') {
    return true;
  } else {
    const temp = file.split(String(prefix))[1].split(String(delimiter));
    if (temp[1] === undefined) {
      return false;
    } else {
      return true;
    }
  }
}

// removing chunk siognature from request payload if present
export function stripChunkSignature(buf: Buffer) {
  if (!Buffer.isBuffer(buf)) {
    // If buf is not a Buffer, return it unchanged or handle the error
    return buf;
  }
  const str = buf.toString();
  const regex = /^[A-Fa-f0-9]+;chunk-signature=[0-9a-f]{64}/gm;
  let m;
  const offset = [];
  const chunk_size = [];
  const arr = [];
  while ((m = regex.exec(str)) !== null) {
    // This is necessary to avoid infinite loops with zero-width matches
    if (m.index === regex.lastIndex) {
      regex.lastIndex++;
    }
    m.forEach((match) => {
      offset.push(Buffer.from(match).byteLength);
      const temp = match.split(';')[0];
      chunk_size.push(parseInt(temp, 16));
    });
  }
  let start = 0;
  //if no chunk signature is present
  if (offset.length === 0) {
    return buf;
  }
  for (let i = 0; i < offset.length - 1; i++) {
    start = start + offset[i] + 2;
    arr.push(buf.slice(start, start + chunk_size[i]));
    start = start + chunk_size[i] + 2;
  }
  return Buffer.concat(arr);
}
