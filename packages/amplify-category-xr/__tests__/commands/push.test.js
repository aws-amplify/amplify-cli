const push = require('../../commands/xr/push');

describe('XR push', () => {
  it('should have a run method', () => {
    expect(push.run).toBeDefined();
  });
});
