# AWS Amplify CLI

To setup your local dev environment:

- under dir `aws-amplify-staging/`<br />
  execute `npm run setup-dev`
<br />

To test your category: 
- `cd <your test frontend project>`
- `amplify init` 
- `amplify <your category> <subcommand>` 

About aws credentials and configurations

- For general configurations, the cli directly uses what the aws sdk provides. The aws sdk uses EC2 role, environmental variables and the shared config files in the directory ~/.aws/ folder, to get credentials. So no additional secrets are stored by the cli.
- If the user does not provide project specific configurations, the cli will use the general configurations for aws access.
- If the user configured project specific configurations, they override the general configurations when cli commands are executed inside the project.
- For project specific configurations, the cli stores the keys in a file (per project) in the ~/.amplify/ folder. Since it's not in the project's codebase, the file won't be accidentally checked into code repos.

Before pushing code or sending PR:
- run npm run lint at the top level directory. This invokes lerna to check for lint errors in all our packages
- eslint can fix some of the lint errors, so go into the package which has errors and run 'lint-fx'
- You might stil have some lint errors which you would have to resolve manually
- Linting your code would make sure of good code quality and practices. So please make sure to do it :)
