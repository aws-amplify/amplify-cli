module.exports = {
  name: 'status',
  run: async (context) => {
  	context.awsmobile.showResourceTable();
  }
}
