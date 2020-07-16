import redactInput from '../domain/amplify-usageData/identifiable-input-regex';
import { Input } from '../domain/input';

describe('input-redaction', () => {
  const input = new Input([
    '/usr/local/bin/node',
    '/usr/local/bin/amplify-dev',
    'init',
    '--amplify',
    '{"envName":"mydevabc"}', // 4
    '--providers',
    '{"awscloudformation":{"configLevel":"project","useProfile":true,"profileName":"default"}}',
    '--categories',
    '{"notifications":{"Pinpoint":{\n"SMS":{\n"Enabled":true},"Email":{\n"Enabled":true,"FromAddress":"xxx@amzon.com","Identity":"identityArn","RoleArn":"roleArn"},"APNS":{\n"Enabled":true,"DefaultAuthenticationMethod":"Certificate","P12FilePath":"p12filePath","Password":"p12FilePasswordIfAny"},"FCM":{\n"Enabled":true,"ApiKey":"fcmapikey"}}}}', // 8
    '--yes',
  ]);
  input.command = 'init';
  input.options = {
    amplify: '{"envName":"mydevabc"}',
    providers: '{"awscloudformation":{"configLevel":"project","useProfile":true,"profileName":"default"}}',
    categories:
      '{"notifications":{"Pinpoint":{\n"SMS":{\n"Enabled":true},"Email":{\n"Enabled":true,"FromAddress":"xxx@amzon.com","Identity":"identityArn","RoleArn":"roleArn"},"APNS":{\n"Enabled":true,"DefaultAuthenticationMethod":"Certificate","P12FilePath":"p12filePath","Password":"p12FilePasswordIfAny"},"FCM":{\n"Enabled":true,"ApiKey":"fcmapikey"}}}}',
    yes: true,
  };

  it('should redact argv and options', () => {
    const replacementstring = 'noseethis';
    const redactedInput = redactInput(input, false, replacementstring);
    expect(redactedInput.argv.length).toEqual(10);
    const redactedCategoriesJsonFromArg = JSON.parse(redactedInput.argv[8]);
    expect(redactedCategoriesJsonFromArg.notifications.Pinpoint.APNS.Password).toEqual(replacementstring);
    expect(redactedCategoriesJsonFromArg.notifications.Pinpoint.Email.FromAddress).toEqual(replacementstring);
    expect(redactedCategoriesJsonFromArg.notifications.Pinpoint.Email.Identity).toEqual(replacementstring);
    expect(redactedCategoriesJsonFromArg.notifications.Pinpoint.Email.RoleArn).toEqual(replacementstring);
    expect(redactedCategoriesJsonFromArg.notifications.Pinpoint.FCM.ApiKey).toEqual(replacementstring);
    expect(redactedInput.options).toBeDefined();
    const options = redactedInput.options || {};
    const redactedCategoriesJsonFromOptions = JSON.parse(options.categories.toString());
    expect(redactedCategoriesJsonFromOptions.notifications.Pinpoint.APNS.Password).toEqual(replacementstring);
    expect(redactedCategoriesJsonFromOptions.notifications.Pinpoint.Email.FromAddress).toEqual(replacementstring);
    expect(redactedCategoriesJsonFromOptions.notifications.Pinpoint.Email.Identity).toEqual(replacementstring);
    expect(redactedCategoriesJsonFromOptions.notifications.Pinpoint.Email.RoleArn).toEqual(replacementstring);
    expect(redactedCategoriesJsonFromOptions.notifications.Pinpoint.FCM.ApiKey).toEqual(replacementstring);
    const deletedInput = redactInput(input, true, replacementstring);
    expect(deletedInput.argv).toBeFalsy();
    expect(deletedInput.options).toBeFalsy();
  });
});
