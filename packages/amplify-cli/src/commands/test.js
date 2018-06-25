module.exports = {
  name: 'test',
  run: async () => {
    const obj = { a: 1, b: 2, c: 3 };
    const { a } = obj;

    console.log(a);
    console.log(obj);
  },
};

