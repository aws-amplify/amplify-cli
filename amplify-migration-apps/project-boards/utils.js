function getRandomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function formatTimestamp() {
  return new Date().toISOString();
}

function formatResponse(message, data) {
  return {
    message,
    ...data,
    timestamp: formatTimestamp(),
  };
}

module.exports = { getRandomItem, formatTimestamp, formatResponse };
