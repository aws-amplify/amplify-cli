import { scalars } from '../../schema/appsync-scalars';

describe('AWSEmail parse', () => {
  it('Should reject a non-string', () => {
    function parse() {
      scalars.AWSEmail.parseValue(1);
    }
    expect(parse).toThrowErrorMatchingSnapshot();
  });

  it('Should reject an invalid email address', () => {
    function parse() {
      scalars.AWSEmail.parseValue('@@');
    }
    expect(parse).toThrowErrorMatchingSnapshot();
  });
});
