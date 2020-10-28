export const run = async context => {
  await context.amplify.listCategories(context);
};
