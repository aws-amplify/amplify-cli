module.exports = (toolbox) => {
  toolbox.api = async () => {
    const params = toolbox.parameters;
    console.log(params);
  };
};
