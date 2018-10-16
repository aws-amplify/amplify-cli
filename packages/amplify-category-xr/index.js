const opn = require('opn');

function console(context) {
    const amplifyMeta = context.amplify.getProjectMeta();
    const region = amplifyMeta.providers.awscloudformation.Region; 
    const consoleUrl =
            `https://console.aws.amazon.com/sumerian/home/start?region=${region}`;
    context.print.info(chalk.green(consoleUrl));
    opn(consoleUrl, { wait: false });
}

module.exports = {
    console
};
  