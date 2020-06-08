const https = require('https');

export function post({ body, ...options }) {
  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        method: 'POST',
        ...options,
      },
      res => {
        const chunks = [];
        res.on('data', data => chunks.push(data));
        res.on('end', () => {
          let body = Buffer.concat(chunks);
          if (res.headers['content-type'].startsWith('application/json')) {
            body = JSON.parse(body.toString());
          }
          resolve(body);
        });
      },
    );

    req.on('error', reject);
    if (body) {
      req.write(body);
    }
    req.end();
  });
}
