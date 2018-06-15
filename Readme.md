# AWS Mobile CLI

To setup your local dev environment:

- under dir `aws-amplify-staging/`<br />
  execute `npm run setup-dev`
- open `aws-amplify-staging/packages/awsmobile-provider-cloudformation/lib/configuraiton-manager.js` and put your credentials there.
<br />

To test your category: 
- `cd <your test frontend project>`
- `awsmobile init` 
- `awsmobile <your category> <subcommand>`
