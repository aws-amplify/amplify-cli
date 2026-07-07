const subcommand = 'add';

module.exports = {
  name: subcommand,
  run: async (context) => {
    context.print.warning('The interactions category cannot be added.');

    return context.print.info(
      `
      Amazon Lex V1 is reaching end of life on September 15, 2025 and no longer allows creation of new bots as of March 31, 2025. 
      If you wish to create a new bot with Lex in your Amplify application, we recommend you follow the steps outlined here to create a bot with Lex V2: https://docs.amplify.aws/gen1/react/build-a-backend/more-features/interactions/set-up-interactions/#setup-aws-lexv2-bot
      `,
    );
  },
};
