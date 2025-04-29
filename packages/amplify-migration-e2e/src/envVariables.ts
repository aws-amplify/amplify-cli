export const envVariable = {
  set: (name: string, value: string): void => {
    process.env[name] = value;
  },
  delete: (name: string): void => {
    delete process.env[name];
  },
};
