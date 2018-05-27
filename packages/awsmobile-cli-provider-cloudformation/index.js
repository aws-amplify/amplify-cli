var categoryControllers = require("./src/category-controllers/category-controller-mapping");

const addResource = function(context, category) {
  var categoryController = categoryControllers[category];
  return categoryController.addResource(context, category);
};

module.exports = { addResource }
