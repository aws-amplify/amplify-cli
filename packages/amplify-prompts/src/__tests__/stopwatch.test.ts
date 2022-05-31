import { Stopwatch } from '../stopwatch';

describe('stopwatch test', () => {
  it('test stopwatch start and pause', async () => {
    const stopwatch = new Stopwatch();
    stopwatch.start();
    await new Promise((resolve, __reject) => { setTimeout(resolve, 300); });
    stopwatch.pause();
    expect(stopwatch.getElapsedMilliseconds()).toBeGreaterThanOrEqual(300);
    expect(stopwatch.getElapsedMilliseconds()).toBeLessThan(305);
    stopwatch.start();
    await new Promise((resolve, __reject) => { setTimeout(resolve, 300); });
    stopwatch.pause();
    expect(stopwatch.getElapsedMilliseconds()).toBeGreaterThanOrEqual(600);
    expect(stopwatch.getElapsedMilliseconds()).toBeLessThanOrEqual(605);
  });
});
