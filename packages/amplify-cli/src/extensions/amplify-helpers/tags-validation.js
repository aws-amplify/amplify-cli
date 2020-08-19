function isValidJSON(json) {
  const stringJson = JSON.stringify(json);

  // We can assume that the file exists, since we already checked when retrieving the project details
  try {
    JSON.parse(stringJson);
  } catch (e) {
    throw new Error("JSON file can't be read");
  }

  return true;
}

/*
  Makes sure that every JS object to the arary comes with its
  key-value pair. It doesn't specifically check if the JSON itself
  is valid, since that already sends an error directly through the
  console before anything else
*/
function hasValidTags(json) {
  // Looping through all of the objects and returning an error if one is empty
  for (let i = 0; i < Object.keys(json).length; i++) {
    let currObj = Object.values(json[i]);
    let currObjKeys = Object.keys(json[i])
      .toString()
      .split(',');

    // First check : If obj is empty
    if (currObj.length === 0) throw new Error('Invalid empty tag object found');

    // Second check : If obj only includes the key or the value, or none of these (meaning that  random strings for the key and value representation were used)
    if (!currObjKeys.includes('Key') || !currObjKeys.includes('Value'))
      throw new Error('Make sure to follow the correct key-value format. Check tags.json file for example.');

    // Last check : If the key contains an empty string (it seems to already handle that case through the checkDuplicates() method, but the return statement can be confusing for the user)
    if (currObj[0] === '') throw new Error('You cannot use empty strings as tag keys.');
  }

  // returns true if the file includes only valid tags
  // this can be a bit confusing, so I'm going to have to refactor this part
  return true;
}

function isWithinLimit(json) {
  const nOfItems = Object.keys(json).length;

  if (nOfItems > 50) throw new Error('Tag limit exceeded (50 tags max)');

  return true;
}

// Returns an error if two or more "Key" values are used more than once
function checkDuplicates(json) {
  // Using Map so I can have quick access to the .has() function that comes with it
  let map = new Map();
  let hasDuplicates = false;

  for (let i = 0; i < Object.keys(json).length; i++) {
    let currVal = Object.values(json[i])[0]; // This grabs the key value from the object, instead of having the key-value pair

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
  // again, this can be a bit confusing, so I'm going to have to refactor this part
  return true;
}

module.exports = {
  isValidJSON,
  hasValidTags,
  isWithinLimit,
  checkDuplicates,
};
