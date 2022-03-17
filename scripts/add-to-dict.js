const fs = require('fs-extra');
const dictionary = require('../.eslint-dictionary.json');

const main = async () => {
  const newWords = process.argv.slice(2);
  dictionary.push(...newWords);
  dictionary.sort();
  await fs.writeFile(require.resolve('../.eslint-dictionary.json'), JSON.stringify(dictionary, undefined, 2))
}

main().catch(err => {
  console.log(err);
  process.exit(1);
});