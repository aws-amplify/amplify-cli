export const validatePathName = (name: string, paths: { name: string }[]) => {
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

  const split = name.split('/').filter(sub => sub !== ''); // because name starts with a /, this filters out the first empty element
  // Check if any prefix of this path matches an existing path
  let subpath = '';
  const subMatch = split.some(sub => {
    subpath = `${subpath}/${sub}`;
    return paths.map(path => path.name).find(name => name === subpath) !== undefined;
  });
  if (subMatch) {
    return `An existing path already matches this sub-path: ${subpath}`;
  }
  return true;
};

// Convert a CloudFormation parameterized path to an ExpressJS parameterized path
// /library/{libraryId}/book/{isbn} => /library/:libraryId/book/:isbn
export const formatCFNPathParamsForExpressJs = (path: string) => {
  return path.replace(/{([a-zA-Z0-9\-]+)}/g, ':$1');
};
