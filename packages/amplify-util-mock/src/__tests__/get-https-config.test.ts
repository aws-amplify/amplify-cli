import { getHttpsConfig } from '../utils/get-https-config';

describe('getHttpsConfig', () => {
  let context;

  beforeEach(() => {
    context = {
      input: {
        argv: [],
      },
      print: {
        error: jest.fn(),
      },
    };
  });

  it('returns paths when --https option is followed by key and cert paths', () => {
    context.input.argv = ['--https', '/path/to/key', '/path/to/cert'];

    const config = getHttpsConfig(context);

    expect(config).toEqual({
      sslKeyPath: '/path/to/key',
      sslCertPath: '/path/to/cert',
    });
  });

  it('returns null and prints error when --https option is not followed by key and cert paths', () => {
    context.input.argv = ['--https'];

    const config = getHttpsConfig(context);

    expect(config).toEqual(null);
    expect(context.print.error).toHaveBeenCalled();
  });
});
