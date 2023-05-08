describe('fake test remember to delete', () => {
  const x = 1;
  const y = 1;
  const z = 2;

  it('will pass', async () => {
    expect(x).toEqual(y);
  });

  it('will fail', async () => {
    expect(x).toEqual(z);
  });
});
