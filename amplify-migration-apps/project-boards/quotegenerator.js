const { getRandomItem, formatResponse } = require('/opt/nodejs/utils');

/**
 * AppSync Lambda function handler
 * When using @function directive, return data directly (not API Gateway proxy format)
 */
exports.handler = async (event) => {
  console.log(`EVENT: ${JSON.stringify(event)}`);

  const quotes = [
    { text: 'The only way to do great work is to love what you do.', author: 'Steve Jobs' },
    { text: 'Innovation distinguishes between a leader and a follower.', author: 'Steve Jobs' },
    { text: 'Stay hungry, stay foolish.', author: 'Steve Jobs' },
    { text: "Code is like humor. When you have to explain it, it's bad.", author: 'Cory House' },
    { text: 'First, solve the problem. Then, write the code.', author: 'John Johnson' },
    { text: 'Experience is the name everyone gives to their mistakes.', author: 'Oscar Wilde' },
    { text: 'In order to be irreplaceable, one must always be different.', author: 'Coco Chanel' },
    { text: 'Java is to JavaScript what car is to Carpet.', author: 'Chris Heilmann' },
    { text: 'Knowledge is power.', author: 'Francis Bacon' },
    {
      text: "Sometimes it pays to stay in bed on Monday, rather than spending the rest of the week debugging Monday's code.",
      author: 'Dan Salomon',
    },
    {
      text: 'Perfection is achieved not when there is nothing more to add, but rather when there is nothing more to take away.',
      author: 'Antoine de Saint-Exupery',
    },
    { text: "Programming isn't about what you know; it's about what you can figure out.", author: 'Chris Pine' },
    { text: 'The best error message is the one that never shows up.', author: 'Thomas Fuchs' },
    { text: 'Simplicity is the soul of efficiency.', author: 'Austin Freeman' },
  ];

  const randomQuote = getRandomItem(quotes);

  return formatResponse('Quote generated successfully! 🎯', {
    quote: randomQuote.text,
    author: randomQuote.author,
    totalQuotes: quotes.length,
  });
};
