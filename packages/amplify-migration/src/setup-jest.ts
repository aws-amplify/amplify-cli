jest.mock('ora', () => {
  return {
    start: jest.fn(() => ({
      succeed: jest.fn(),
      stop: jest.fn(),
    })),
  };
});
