const fs = require('fs-extra');
const dictionary = require('../.eslint-dictionary.json');

const main = async () => {
  const newWords = process.argv.slice(2);
  const wordSet = new Set(dictionary);
  newWords.forEach(word => wordSet.add(word));
  const sortedDedupedWordList = Array.from(wordSet).sort();
  await fs.writeFile(require.resolve('../.eslint-dictionary.json'), JSON.stringify(sortedDedupedWordList, undefined, 2))
}

main().catch(err => {
  console.log(err);
  process.exit(1);
});