const console = require('../../commands/analytics/console');
jest.mock('../../index', () => {
  return { console: () => {} };
});

describe('analytics console: ', () => {
  it('enable run method should exist', () => {
    expect(console.run).toBeDefined();
    expect(console.name).toBeDefined();
  });

});

