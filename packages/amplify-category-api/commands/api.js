module.exports = {
  name: 'api',
  run: async ({ print, api }) => {
    print.info(await api())
  },
}