module.exports = (value) => {
  let isValid =
    typeof value === 'string' &&
    value.length >= 3 &&
    value.length <= 63 &&
    /^[a-z0-9.-]*$/.test(value);

  if (!isValid) {
    return 'The bucket name must be a string between 3 and 63 characters long, and can contain only lower-case characters, numbers, periods, and dashes.';
  }

  isValid = /^[a-z0-9]/.test(value);
  if (!isValid) {
    return 'The bucket name must start with a lowercase letter or number.';
  }

  isValid = !/-$/.test(value);
  if (!isValid) {
    return 'The bucket name cannot end with a dash.';
  }

  isValid = !/\.{2,}/.test(value);
  if (!isValid) {
    return 'The bucket name cannot have consecutive periods.';
  }

  isValid = !/\.-|-\./.test(value);
  if (!isValid) {
    return 'The bucket name cannot have dashes adjacent to periods.';
  }

  isValid = !(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/.test(value));
  if (!isValid) {
    return 'The bucket name cannot be formatted as an IP address.';
  }

  return true;
};
