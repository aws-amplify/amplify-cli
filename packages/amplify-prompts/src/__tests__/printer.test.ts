import { AmplifyPrinter } from '../printer';
import * as flags from '../flags';
const writeStream_stub = ({
  write: jest.fn(),
} as unknown) as jest.Mocked<NodeJS.WritableStream>;

jest.mock('../flags');
jest.mock('os');

type Writeable<T> = { -readonly [P in keyof T]: T[P] };

const flags_mock = flags as jest.Mocked<Writeable<typeof flags>>;

const testInput = 'this is a test line';

const printer = new AmplifyPrinter(writeStream_stub);

beforeEach(() => {
  jest.clearAllMocks();
  flags_mock.isDebug = false;
  flags_mock.isSilent = false;
  flags_mock.isYes = false;
});

it('prints debug lines when debug flag is set', () => {
  flags_mock.isDebug = true;
  printer.debug(testInput);
  expect(writeStream_stub.write.mock.calls[0][0].trim()).toMatchInlineSnapshot(`"this is a test line"`);
});

it('does not print debug lines by default', () => {
  printer.debug(testInput);
  expect(writeStream_stub.write.mock.calls.length).toBe(0);
});

it('prints info line by default', () => {
  printer.info(testInput);
  expect(writeStream_stub.write.mock.calls[0][0].trim()).toMatchInlineSnapshot(`"[0mthis is a test line[0m"`);
});

it('prints info line in specified color', () => {
  printer.info(testInput, 'blue');
  expect(writeStream_stub.write.mock.calls[0][0].trim()).toMatchInlineSnapshot(`"[34mthis is a test line[39m"`);
});

it('does not print info line when silent flag is set', () => {
  flags_mock.isSilent = true;
  printer.info(testInput);
  expect(writeStream_stub.write.mock.calls.length).toBe(0);
});

it('prints success line by default', () => {
  printer.success(testInput);
  expect(writeStream_stub.write.mock.calls[0][0].trim()).toMatchInlineSnapshot(`"✅ [32mthis is a test line[39m"`);
});

it('does not print success line when silent flag is set', () => {
  flags_mock.isSilent = true;
  printer.success(testInput);
  expect(writeStream_stub.write.mock.calls.length).toBe(0);
});

it('prints warn line by default', () => {
  printer.warn(testInput);
  expect(writeStream_stub.write.mock.calls[0][0].trim()).toMatchInlineSnapshot(`"⚠️ [33mthis is a test line[39m"`);
});

it('prints warn line when silent flag is set', () => {
  flags_mock.isSilent = true;
  printer.warn(testInput);
  expect(writeStream_stub.write.mock.calls[0][0].trim()).toMatchInlineSnapshot(`"⚠️ [33mthis is a test line[39m"`);
});

it('prints error line by default', () => {
  printer.error(testInput);
  expect(writeStream_stub.write.mock.calls[0][0].trim()).toMatchInlineSnapshot(`"🛑 [31mthis is a test line[39m"`);
});

it('prints error line when silent flag is set', () => {
  flags_mock.isSilent = true;
  printer.error(testInput);
  expect(writeStream_stub.write.mock.calls[0][0].trim()).toMatchInlineSnapshot(`"🛑 [31mthis is a test line[39m"`);
});
