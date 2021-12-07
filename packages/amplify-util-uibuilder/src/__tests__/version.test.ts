describe('can run version script', () => {
  let context: any;
  beforeEach(() => {
    context = {
      print: {
        info: () => true,
      },
    };
  });
  it('runs version script', async () => {
    const { run } = require('../commands/version');
    await run(context);
  });
});
