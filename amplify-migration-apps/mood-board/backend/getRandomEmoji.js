const emojis = ['😀', '🎉', '✨', '🌈', '🦄', '🎨', '💫', '🌸', '🔥', '💖'];

exports.handler = async (event) => {
  const randomIndex = Math.floor(Math.random() * emojis.length);
  return emojis[randomIndex];
};
