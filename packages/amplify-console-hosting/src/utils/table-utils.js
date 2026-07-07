const clientFactory = require('./client-factory');
const Table = require('cli-table3');
const { spinner } = require('@aws-amplify/amplify-cli-core');
const { ListBranchesCommand, ListDomainAssociationsCommand } = require('@aws-sdk/client-amplify');

async function generateTableContentForApp(context, appId) {
  spinner.start('Fetching AWS Amplify Console domains');
  const amplifyClient = await clientFactory.getAmplifyClient(context);
  const domainMap = {};

  let nextToken = null;
  try {
    do {
      const { branches } = await amplifyClient.send(
        new ListBranchesCommand({
          appId,
          nextToken,
        }),
      );

      for (const branch of branches) {
        const { branchName, displayName } = branch;
        const validDisplayName = displayName || branchName;
        domainMap[branchName] = [];
        domainMap[branchName].push(`https://${validDisplayName}.${appId}.amplifyapp.com`);
      }
    } while (nextToken != null);

    nextToken = null;
    do {
      const { domainAssociations } = await amplifyClient.send(
        new ListDomainAssociationsCommand({
          appId,
          nextToken,
        }),
      );

      for (const domainAssociation of domainAssociations) {
        const { domainName, subDomains } = domainAssociation;
        for (const subDomain of subDomains) {
          const { prefix, branchName } = subDomain.subDomainSetting;
          if (!domainMap[branchName]) {
            domainMap[branchName] = [];
          }
          if (prefix === null || prefix === undefined) {
            domainMap[branchName].push(`https://${domainName}`);
          } else {
            domainMap[branchName].push(`https://${prefix}.${domainName}`);
          }
        }
      }
    } while (nextToken != null);
    spinner.stop();
    if (Object.keys(domainMap).length === 0) {
      console.log('No amplify console domain detected');
      return;
    }
    // Init table
    const table = new Table({
      style: { head: ['reset'] }, // "no color"
      head: ['FrontEnd Env', 'Domain'],
    });

    for (const [branchName, domains] of Object.entries(domainMap)) {
      for (let index = 0; index < domains.length; index++) {
        if (index === 0) {
          table.push([
            {
              rowSpan: domains.length,
              content: branchName,
            },
            domains[index],
          ]);
        } else {
          table.push([domains[index]]);
        }
      }
    }
    console.log('Amplify hosting urls: ');
    console.log(table.toString());
  } catch (err) {
    spinner.fail(err.message);
  }
}

module.exports = {
  generateTableContentForApp,
};
