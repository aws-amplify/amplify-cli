import { join, normalize } from 'path';

// parse the request url to get the path and storing in the request.params.path  with the prefix if present

export function parseUrl(request, route: String) {
  request.url = normalize(decodeURIComponent(request.url));
  const temp = request.url.split(route);
  request.params.path = '';
  
  if (request.query.prefix !== undefined) request.params.path = request.query.prefix + '/';

  if (temp[1] !== undefined)
    request.params.path = normalize(join(request.params.path, temp[1].split('?')[0]));
  // change for IOS as no bucket name is present in the original url
  else request.params.path = normalize(join(request.params.path, temp[0].split('?')[0]));

  if (request.params.path[0] == '/' || request.params.path[0] == '.') {
    request.params.path = request.params.path.substring(1);
  }

  if (request.method === 'GET') {
    if (request.query.prefix !== undefined || (temp[1] === '' && temp[0] === '')) {
      request.method = 'LIST';
    }
  }
}

// check for the delimiter in the file for list object request
export function checkfile(file: String, prefix: String, delimiter: String) {
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
  let str = buf.toString();
  var regex = /^[A-Fa-f0-9]+;chunk-signature=[0-9a-f]{64}/gm;
  let m;
  let offset = [];
  let chunk_size = [];
  let arr = [];
  while ((m = regex.exec(str)) !== null) {
    // This is necessary to avoid infinite loops with zero-width matches
    if (m.index === regex.lastIndex) {
      regex.lastIndex++;
    }
    m.forEach((match, groupIndex, index) => {
      offset.push(Buffer.from(match).byteLength);
      var temp = match.split(';')[0];
      chunk_size.push(parseInt(temp, 16));
    });
  }
  var start = 0;
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
