module.exports = (value) => {
  value = value.trim();

  let isValid = value.length > 0;
  if (!isValid) {
    return 'Must not be empty, or only contains space characters.';
  }

  isValid = !/\//.test(value);
  if (!isValid) {
    return 'The slash charactor is not allowed.';
  }
  return true;
};
