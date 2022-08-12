import { Stopwatch } from '../stopwatch';

describe('stopwatch test', () => {
  it('test stopwatch start and pause', async () => {
    const stopwatch = new Stopwatch();
    stopwatch.start();
    await new Promise((resolve, __reject) => { setTimeout(resolve, 300); });
    stopwatch.pause();
    // expected times are not exact to account for how the JS event loop schedules tasks
    expect(stopwatch.getElapsedMilliseconds()).toBeGreaterThan(290);
    expect(stopwatch.getElapsedMilliseconds()).toBeLessThan(310);
    stopwatch.start();
    await new Promise((resolve, __reject) => { setTimeout(resolve, 300); });
    stopwatch.pause();
    expect(stopwatch.getElapsedMilliseconds()).toBeGreaterThan(580);
    expect(stopwatch.getElapsedMilliseconds()).toBeLessThan(620);
  });
});
