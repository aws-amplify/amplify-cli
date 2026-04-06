const { getRandomItem, formatResponse } = require('/opt/nodejs/utils');

const tips = [
  { text: 'Break large tasks into smaller, manageable pieces.', category: 'Productivity' },
  { text: 'Use version control for everything, even personal projects.', category: 'Best Practices' },
  { text: 'Write tests before fixing bugs to prevent regressions.', category: 'Testing' },
  { text: 'Document your decisions, not just your code.', category: 'Documentation' },
  { text: 'Take regular breaks — your brain solves problems in the background.', category: 'Wellness' },
  { text: 'Review your own PR before asking others to.', category: 'Code Review' },
  { text: 'Automate anything you do more than twice.', category: 'Automation' },
  { text: 'Keep your dependencies up to date.', category: 'Maintenance' },
];

/**
 * AppSync Lambda function handler
 * When using @function directive, return data directly (not API Gateway proxy format)
 */
exports.handler = async (event) => {
  console.log(`EVENT: ${JSON.stringify(event)}`);

  const tip = getRandomItem(tips);

  return formatResponse('Tip generated successfully! 💡', {
    tip: tip.text,
    category: tip.category,
    totalTips: tips.length,
  });
};
