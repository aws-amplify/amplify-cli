export function getHttpsConfig(context): { sslKeyPath: string; sslCertPath: string } | null {
  if (!context.input || !context.input.argv) {
    return null;
  }

  const argv = context.input.argv;
  const httpsIndex = argv.indexOf('--https');

  if (httpsIndex !== -1) {
    if (httpsIndex < argv.length - 2) {
      const keyPath = argv[httpsIndex + 1];
      const certPath = argv[httpsIndex + 2];
      if (typeof keyPath === 'string' && typeof certPath === 'string') {
        return { sslKeyPath: keyPath, sslCertPath: certPath };
      } else {
        context.print.error('\nThe provided paths for the SSL key and certificate are not valid.\n');
        context.print.error('Please ensure you have entered the correct paths.\n');
      }
    } else {
      context.print.error('\nThe --https option must be followed by the path to the SSL key and the path to the SSL certificate.\n');
      context.print.error('Example: amplify mock api --https /path/to/key /path/to/cert\n');
      context.print.error('In order to generate a key and certificate, you can use openssl:\n');
      context.print.error('openssl req -nodes -new -x509 -keyout server.key -out server.cert\n');
      context.print.error('Then, run the command again with the paths to the generated key and certificate.\n');
    }
  }

  return null;
}
