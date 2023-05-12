const removeYarnPath = () => {
  process.env.PATH = process.env.PATH!.replace(process.env.BERRY_BIN_FOLDER ?? '', '');
};

process.nextTick(() => {
  removeYarnPath();
  process.exit();
});
