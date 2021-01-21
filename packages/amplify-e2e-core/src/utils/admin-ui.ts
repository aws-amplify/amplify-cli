import * as https from 'https';
import * as url from 'url';
const uri = 'https://e7auv6no3g.execute-api.us-east-1.amazonaws.com/wave3Prod/AppState';

export async function getAdminApp(body: any): Promise<string> {
  const adminUiUrl = url.parse(uri);
  return new Promise<string>((resolve, reject) => {
    let str = '';
    const req = https.request(
      {
        hostname: adminUiUrl.hostname,
        port: adminUiUrl.port,
        path: adminUiUrl.path,
        method: 'POST',
      },
      res => {
        res.on('data', chunk => {
          str += chunk;
        });
        res.on('end', () => {
          resolve(str);
        });
      },
    );
    req.on('error', err => {
      reject(err);
    });
    req.write(JSON.stringify(body));
    req.end();
  });
}
