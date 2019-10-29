const update = require('../../commands/xr/update');

describe('XR update', () => {
  it('should have a run method', () => {
    expect(update.run).toBeDefined();
  });
});
