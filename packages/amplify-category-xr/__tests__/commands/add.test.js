const add = require('../../commands/xr/add');

describe('XR add', () => {
  it('should have a run method', () => {
    expect(add.run).toBeDefined();
  });
});
