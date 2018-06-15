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

Before pushing code or sending PR:
- run npm run lint at the top level directory. This invokes lerna to check for lint errors in all our packages
- eslint can fix some of the lint errors, so go into the package which has errors and run 'lint-fx'
- You might stil have some lint errors which you would have to resolve manually
- Linting your code would make sure of good code quality and practices. So please make sure to do it :)
