import { readFile, writeFile } from 'fs-extra';
import { eslintDictionaryPath } from './constants';

const main = async (): Promise<void> => {
  const rawDictionaryContent = (await readFile(eslintDictionaryPath)).toString();
  const dictionaryContentWithoutConflictLines = rawDictionaryContent.split('\n').filter((line: string) => line.match(/(^[\[\]])|\".*\"/));
  const dictionary = JSON.parse(dictionaryContentWithoutConflictLines.join('\n'));
  const wordSet = new Set(dictionary);
  const sortedDedupedWordList = Array.from(wordSet).sort();
  await writeFile(eslintDictionaryPath, `${JSON.stringify(sortedDedupedWordList, undefined, 2)}\n`);
};

main().catch((err) => {
  console.log(err);
  process.exit(1);
});
