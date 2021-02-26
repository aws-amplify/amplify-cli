import { URL } from 'url';
import { scalars } from '../../schema/appsync-scalars';

describe('AWSURL parse', () => {
  it('Returns falsy values unchanged', () => {
    expect(scalars.AWSURL.parseValue(0)).toEqual(0);
  });

  it('Returns valid URL objects', () => {
    const parsed = new URL('http://www.amazon.com');
    expect(scalars.AWSURL.parseValue('http://www.amazon.com')).toEqual(parsed);
  });

  it('Should reject an invalid URL', () => {
    function serialize() {
      scalars.AWSURL.parseValue('invalid-url');
    }
    expect(serialize).toThrowErrorMatchingSnapshot();
  });
});

describe('AWSURL serialize', () => {
  it('Returns falsy values unchanged', () => {
    expect(scalars.AWSURL.serialize(0)).toEqual(0);
  });

  it('Returns valid URLs', () => {
    expect(scalars.AWSURL.serialize('http://www.amazon.com')).toEqual('http://www.amazon.com/');
  });

  it('Should reject an invalid URL', () => {
    function serialize() {
      scalars.AWSURL.serialize('invalid-url');
    }
    expect(serialize).toThrowErrorMatchingSnapshot();
  });
});
