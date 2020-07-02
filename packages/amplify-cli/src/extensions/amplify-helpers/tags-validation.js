const fs = require('fs-extra');

const parseJsonFile = pathToFile => JSON.parse(fs.readFileSync(pathToFile, 'utf-8'));

export function isValidJSON(pathToJson) {
  // We can assume that the file exists, since we already checked when retrieving the project details
  try {
    parseJsonFile(pathToJson);
  } catch (e) {
    throw new Error("JSON file can't be read");
  }

  return true;
}

export function isWithinLimit(pathToJson) {
  const parsedJson = parseJsonFile(pathToJson);
  const nOfItems = Object.keys(parsedJson).length;

  if (nOfItems > 50) throw new Error('Tag limit exceeded (50 tags max)');

  return true;
}

export function checkDuplicates(pathToJson) {
  const parsedJson = parseJsonFile(pathToJson);

  // Using Map so I can have quick access to the .has() function that comes with it
  let map = new Map();
  let hasDuplicates = false;

  for (let i = 0; i < Object.keys(parsedJson).length; i++) {
    let currVal = Object.values(parsedJson[i])[0]; // This grabs the key value from the object, instead of having the key-value pair

    if (map.has(currVal)) {
      let keyVal = map.get(currVal);
      map.set(currVal, (keyVal += 1));
    } else {
      map.set(currVal, 1);
    }
  }

  map.forEach(key => {
    if (key > 1) hasDuplicates = true;
  });

  if (hasDuplicates) throw new Error('File contains duplicate keys');

  // returns true if there are no duplicates
  // this can be a bit confusing, so I'm going to have to refactor this part
  return true;
}
