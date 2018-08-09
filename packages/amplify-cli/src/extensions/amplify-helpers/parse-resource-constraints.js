const buildConstraints = (edit, projectName, externalCategory, resourceName, newConstraints, oldConstraints) => { //eslint-disable-line
  let constraints;
  const constraint = {};
  constraint[externalCategory] = {};
  constraint[externalCategory][resourceName] = newConstraints;

  if (!projectName || !externalCategory || !resourceName || !newConstraints) {
    return new Error('Error receiving parameters for building contraints');
  }

  if (oldConstraints && typeof oldConstraints === 'string') {
    oldConstraints = JSON.parse(oldConstraints);
  }

  // if no previous auth...
  if (!edit) {
    const buildConstraint = {};
    buildConstraint[externalCategory] = {};
    buildConstraint[externalCategory][resourceName] = newConstraints;
    // if no previous authParameters, we save a new constraints object
    constraints = [buildConstraint];
  // if auth has been previously configured...
  } else {
    try {
      if (oldConstraints) {
        if (oldConstraints[externalCategory][resourceName]) {
          Object.keys(oldConstraints[externalCategory][resourceName]).forEach((i) => {
            oldConstraints[externalCategory][resourceName][i] = newConstraints[i];
          });
        } else {
          oldConstraints[externalCategory] = {};
          oldConstraints[externalCategory][resourceName] = newConstraints;
        }
      }
    } catch (e) {
      return new Error('Error building contraints');
    }
  }
  return constraints;
};

module.exports = {
  buildConstraints,
};
