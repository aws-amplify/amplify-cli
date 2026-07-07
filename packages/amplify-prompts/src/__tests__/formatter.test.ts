import { printer } from '../printer';
import { formatter } from '../formatter';

jest.mock('../printer');

const printer_mock = printer as jest.Mocked<typeof printer>;

describe('list', () => {
  beforeEach(jest.clearAllMocks);
  it('prints list items at info level', () => {
    const items = ['item1', 'item2'];
    formatter.list(items);
    expect(printer_mock.info.mock.calls.length).toBe(2);
    expect(printer_mock.info.mock.calls[0][0]).toMatchInlineSnapshot(`"- item1"`);
    expect(printer_mock.info.mock.calls[1][0]).toMatchInlineSnapshot(`"- item2"`);
  });
});
