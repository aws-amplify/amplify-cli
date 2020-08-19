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
  Makes sure that every JS object to the array comes with its
  key-value pair. It doesn't specifically check if the JSON itself
  is valid, since that already sends an error directly through the
  console before anything else
*/
function hasValidTags(json) {
  Object.values(json).map(tag => {
    // First check : If tag object has a "Key" and "Value" text
    if (!Object.keys(tag).includes('Key') || !Object.keys(tag).includes('Value'))
      throw new Error('Make sure to follow the correct key-value format. Check tags.json file for example');

    // Second check : If Key value is empty
    // Grabs the value of the "Key" text
    if (!Object.values(tag)[0]) throw new Error('You cannot use empty strings as tag keys');
  });

  return true;
}

function isWithinLimit(json) {
  const nOfItems = Object.keys(json).length;

  if (nOfItems > 50) throw new Error('Tag limit exceeded (50 tags max)');

  return true;
}

// Returns an error if two or more "Key" values are used more than once
function checkDuplicates(json) {
  // Using Set so we have quick access to the .has() function that comes with it
  let set = new Set();

  Object.values(json).map(tag => {
    // If our set already contains a tag Key, we know that it's a duplicate
    if (set.has(tag.Key)) {
      throw new Error('File contains duplicate keys');
    } else {
      set.add(tag.Key);
    }
  });

  // Gets returned if we don't have any duplicates
  return true;
}

module.exports = {
  isValidJSON,
  hasValidTags,
  isWithinLimit,
  checkDuplicates,
};
