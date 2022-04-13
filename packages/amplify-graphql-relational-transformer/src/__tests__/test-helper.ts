export const featureFlags = {
  getBoolean: (value: string) => {
    if (value === 'useSubUsernameForDefaultIdentityClaim') {
      return false;
    }
    return false;
  },
  getNumber: jest.fn(),
  getString: jest.fn(),
  getObject: jest.fn(),
};
