import { Stopwatch } from '../stopwatch';

describe('stopwatch test', () => {
  it('test stopwatch start and pause', async () => {
    const stopwatch = new Stopwatch();
    stopwatch.start();
    await new Promise((resolve) => {
      setTimeout(resolve, 300);
    });
    stopwatch.pause();
    expect(stopwatch.getElapsedMilliseconds()).toBeGreaterThanOrEqual(295);
    expect(stopwatch.getElapsedMilliseconds()).toBeLessThan(350);
    stopwatch.start();
    await new Promise((resolve) => {
      setTimeout(resolve, 300);
    });
    stopwatch.pause();
    expect(stopwatch.getElapsedMilliseconds()).toBeGreaterThanOrEqual(595);
    expect(stopwatch.getElapsedMilliseconds()).toBeLessThanOrEqual(700);
  });
});
