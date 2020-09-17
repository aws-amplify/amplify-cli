function obfuscate(value) {
  const { length } = value;
  const half = Math.round(length / 2);
  return value.substr(0, half) + '*'.repeat(length - half);
}

function isObfuscated(value = '') {
  const { length } = value;

  if (length === 0) return false;

  const half = Math.round(length / 2);
  return value.substr(half) === '*'.repeat(length - half);
}

function transform(value, answer, { isFinal }) {
  return isFinal ? obfuscate(value) : value;
}

module.exports = {
  obfuscate,
  isObfuscated,
  transform,
};
