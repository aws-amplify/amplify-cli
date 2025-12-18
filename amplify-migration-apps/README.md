# amplify-apps
Example Amplify apps to test the Gen2 migration, end-to-end.

## Process
Gen1 application (sans `amplify/` directory) lives in each of the `app-#` directories.

1. Operator for an app migration runs `amplify init` in their assigned app, and follows `README.md` in the app to configure Amplify categories.

2. Operator runs the migration workflow, up to but not including the refactor operation.
- Create an Amplify Gen2 application from the app (select Monorepo option).

3. Operator creates a new branch and commits the codegenned Gen2 application.

4. Operator runs the rest of the migration workflow and checks for any problems.
