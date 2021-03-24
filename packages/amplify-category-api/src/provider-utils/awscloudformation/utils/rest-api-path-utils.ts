// validatePathName checks that the provided path name is of a valid path structure.
// Examples of valid path structures: /book, /book/{isbn}, /book/{isbn}/page/{pageNum}
export const validatePathName = (name: string) => {
  // Allow the path /
  if (name === '/') {
    return true;
  }

  if (name.length === 0) {
    return 'The path must not be empty';
  }

  if (name.charAt(name.length - 1) === '/') {
    return 'The path must not end with /';
  }

  if (name.charAt(0) !== '/') {
    return 'The path must begin with / e.g. /items';
  }

  // Matches parameterized paths such as /book/{isbn}/page/{pageNum}
  // This regex also catches the above conditions, but those are left in to provide clearer error messages.
  if (!/^(?:\/(?:[a-zA-Z0-9\-]+|{[a-zA-Z0-9\-]+}))+$/.test(name)) {
    return 'Each path part must use characters a-z A-Z 0-9 - and must not be empty.\nOptionally, a path part can be surrounded by { } to denote a path parameter.';
  }

  return true;
};

// checkForPathOverlap checks to see if the provided path name eclipses or overlaps any other paths in the provided list of paths.
//
// checkForPathOverlap returns false if the provided path name does not overlap with any of the other provided paths.
// checkForPathOverlap returns an object with the following structure if the provided path name does overlap with any of the provided paths:
// {
//   higherOrderPath: string,
//   lowerOrderPath: string,
// }
//
// checkForPathOverlap assumes that all provided paths have previously been run through validatePathName().
export const checkForPathOverlap = (name: string, paths: { name: string }[]) => {
  // Split name into an array of its components.
  const split = name.split('/').filter(sub => sub !== ''); // Because name starts with a /, this filters out the first empty element

  // Sort paths so that the prefix paths of name are checked with shorter paths first.
  paths.sort();

  // Check if any prefix of this path matches an existing path.
  //
  // Convert parameters to: '{}'. When evaluating whether paths overlap, we're only concerned about the placement of parameters in those
  // paths --- not what the parameters are named.
  //
  // Ex: paths /book/{isbn} and /book/{publication-year} overlap. We aren't concerned with the fact that the parameters in those two routes
  // are named "isbn" and "publication-year"; we're concerned about the fact that the subpaths after /book in both paths are parameters.
  let subpath = '';
  let overlappingPath = '';
  const subMatch = split.some(sub => {
    // If the current subpath is a parameter, convert it to: '{}'.
    sub = sub.replace(/{[a-zA-Z0-9\-]+}/g, '{}');
    subpath = `${subpath}/${sub}`;
    // Explicitly check for the path / since it overlaps with any other valid path.
    // If the path isn't /, replace all of its parameters with '{}' when checking for overlap in find().
    overlappingPath = paths.map(path => path.name).find(name => name === '/' || name.replace(/{[a-zA-Z0-9\-]+}/g, '{}') === subpath);
    return overlappingPath !== undefined;
  });
  if (subMatch) {
    // To determine which of the overlapping paths is the higher order path, count the number of occurrences of '/' in both paths.
    const nameSlashCount = name.split('/').length - 1;
    const overlappingPathSlashCount = overlappingPath.split('/').length - 1;
    if (nameSlashCount < overlappingPathSlashCount) {
      return {
        higherOrderPath: name,
        lowerOrderPath: overlappingPath,
      };
    }
    return {
      higherOrderPath: overlappingPath,
      lowerOrderPath: name,
    };
  }

  // This path doesn't overlap with any of the other provided paths.
  return false;
};

// Convert a CloudFormation parameterized path to an ExpressJS parameterized path
// /library/{libraryId}/book/{isbn} => /library/:libraryId/book/:isbn
export const formatCFNPathParamsForExpressJs = (path: string) => {
  return path.replace(/{([a-zA-Z0-9\-]+)}/g, ':$1');
};
