import { AmplifyTerminal as Terminal } from '../progressbars/terminal';

test('check if lines are printed properly', () => {
  const terminal = new Terminal();
  const streamWriteMock = jest.fn();
  Object.defineProperty(terminal, 'stream', {
    value: { write: streamWriteMock },
  });
  const stringsToRender = [
    { renderString: 'Hello World', color: '' },
    { renderString: 'How are you', color: '' },
  ];
  terminal.writeLines(stringsToRender);
  expect(streamWriteMock).toBeCalledTimes(3);
  expect(terminal.getLastHeight()).toBe(2);
});
