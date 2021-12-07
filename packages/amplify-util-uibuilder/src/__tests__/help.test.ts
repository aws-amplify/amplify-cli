describe('can run help script', () => {
  let context: any;
  beforeEach(() => {
    context = {
      print: {
        info: () => true,
      },
    };
  });
  it('runs help script', async () => {
    const { run } = require('../commands/help');
    await run(context);
  });
});
