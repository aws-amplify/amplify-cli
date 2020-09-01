export const getPostAddAuthMessagePrinter = (context: any) => (resourceName: string) => {
  const { print } = context;
  print.success(`Successfully added resource ${resourceName} locally`);
  print.info('');
  print.success('Some next steps:');
  print.info('"amplify push" will build all your local backend resources and provision it in the cloud');
  print.info(
    '"amplify publish" will build all your local backend and frontend resources (if you have hosting category added) and provision it in the cloud',
  );
  print.info('');
};
