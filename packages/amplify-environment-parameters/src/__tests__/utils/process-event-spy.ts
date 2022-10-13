/**
 * Spies on process.on('event', callback) and adds the callbacks to an internal map
 * @returns A function that can be used to execute the event callbacks that were attached to a particular event
 */
export const getProcessEventSpy = (): ((event: string, exitCode?: number) => void) => {
  // eslint-disable-next-line @typescript-eslint/ban-types
  const processEventListeners: Record<string | symbol, Function[]> = {};
  jest.spyOn(process, 'on').mockImplementation((event, func) => {
    if (Array.isArray(processEventListeners[event])) {
      processEventListeners[event].push(func);
    } else {
      processEventListeners[event] = [func];
    }
    return process;
  });
  return (event: string, exitCode = 0): void => {
    processEventListeners[event].forEach(func => func(exitCode));
  };
};
