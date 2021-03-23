export const run = async context => {
  context.print.info(context.amplify.listCategories(context));
};
