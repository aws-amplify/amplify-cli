 Amplify Gen1 → Gen2 Migration | High Level Design 

 

Author: @Polonsky, Eli  

Audience: Amplify Engineering/Product/DAs, CDK Engineering, Former Amplify Tech leads 

Last Updated: 10/02/25 

Last Reviewed: 10/02/25  

 

This document provides a high-level design for migrating Gen1 customers to Gen2. It incorporates conclusions from prior docs and should serve as the main source of information about the current migration project efforts. 

Reader Notes: 

The proposed migration workflow is based on the Reliability Analysis document. It can help clarify some decisions but is not a required read. 

This document focuses solely on migration of amplify backend environments. Frontend efforts are assumed to be minimal and are (mostly) out of scope. 

Same goes for hosting. 

For technical context, refer to the “Technical Background” section in the Appendix. 

Goals: 

Align relevant stakeholders with the proposed customer experience. 

Provide a technical foundation for the implementation phase. 

Surface required effort to follow up with an execution and rollout plan. 

Agree on the design approach and evaluate alternatives. 

 

Agenda 

We start off by defining the problem statement this project aims to solve; both from an engineering and a customer perspective. 

Given this project has been floating around for quite a long time, we will provide some historical background and point to prior art that this document builds upon.  

The bulk of this document will then be dedicated to a step-by-step overview of the proposed solution, detailing which artifacts will be delivered, and how customers are expected to use them. We will then discuss a few alternatives that were rejected along the way.  

Finally, a more detailed technical overview will be given. 

Problem Statement 

Amplify Gen2 was launched roughly two years ago (Nov 21, 2023). Since then, customers have naturally expressed concerns about the future of Gen1 and requested guidance for migrating their apps. 

As we will see, Gen2 diverged quite significantly from Gen1, both in developer experience and feature set. In fact, much of the functionally supported in Gen1 is not natively supported in Gen2. In a sense, Gen1 and Gen2 can be thought of as entirely different products. Migrating from one to the other poses a considerable challenge, which most of our customers are not willing to take on by themselves. 

This situation creates a lot of customer frustration, as our PMs are constantly approached with questions about migration. Internally, the continuous maintenance of Gen1 greatly increases the operational burden of the team. To resolve customer frustration, we need to help them migrate. To reduce the operational burden, we want to put Gen1 on a deprecation path – which also requires formal migration guidance. 

Historical Background 

In April 2024, A few months after Gen2 was launched, we officially announced that we are actively working on a migration tool. We also spoke about this tool during re:Invent 2024. 

In May 2025, the amplify hosting team was scheduled to launch a tool; this launch was paused at the last minute after evaluation from DAs and other relevant stakeholders. Major concerns were raised about DX, AWS reliability reputation, and significant coverage gaps. These concerns are presented in the following documents: 

Gen 1 - Gen 2 Migration Tool Missing Parts 

Migration Tool Action Items 

Gen 1 - Gen 2 Migration Testing Feedback 

In addition, the Migration Tool Concerns document provides a potent executive summary: 

“AWS Amplify Gen1 to Gen2 migration tool is poised for general availability (GA) release without adequate real-world testing or community feedback. This premature launch strategy exposes our customers to significant risks, potentially leading to widespread migration failures, data loss, and severe customer dissatisfaction.” 

In July 2025, ownership for the tool was moved over to the amplify backend team, and a new proposal was created to address the previous feedback. In September 2025, following the departure of the lead engineer from the team, the tool switched ownership again. This ownership shift prompted another round of evaluation, which resulted in the current design. 

Tenets (unless you know better ones) 

Safety First. We should apply all possible mitigations to reduce operational risks. 

Developer Experience Is Key. Migration processes are inherently complex and risky, a complicated DX on top of that will severely cripple adoption. 

Performance Last. Migration is a one-time process; we won't compromise operational aspects for the sake of performance.  

Enable, Don’t Block. Our tooling should help customers, not prevent.   

Transparency Earns Trust. We should inform customers of why & what each part of the migration does. Risks must be communicated as well. 

Solution 

We will provide the following artifacts: 

Command line utilities that perform various operations on amplify environments. Customers are expected to install the utility and execute commands on a machine with access to the relevant AWS account. 

Migration guide that outlines the required order of operations, their purpose, and recovery mechanisms in case of failures. In addition, the guide will help the customer validate the migration was completed successfully. 

Migration is performed in a partially blue/green fashion. Customers will use CLI commands to generate and deploy a Gen2 environment (green) that is equivalent to the existing Gen1 production environment (blue). Both environments will coexist for the duration of migration, and customers will perform traffic shifts via DNS records to test the Gen2 application. Decommissioning the Gen1 environment can be done at any time after completion.  

Since amplify applications are stateful, the Gen2 environment must have access to already existing data. There are two ways to achieve this: 

Share Data: In this approach, stateful resources from the Gen1 environment are reused by the Gen2 environment. This can be accomplished by performing stack operations alone, leaving the resources themselves untouched. While this approach is fully automated, it also introduces the risk of data corruption in case the Gen2 environment behaves unexpectedly. 

 

Replicate Data: In this approach, customers are required to replicate historical data to the newly created stateful resources in the Gen2 environment. To support live data, customers need to either place the system in maintenance mode, or route incoming traffic to both environments. 

Data replication poses a high operational burden for our customers. Building and providing automated tools can reduce this burden but would require a large engineering effort the team is not well positioned to execute on, will significantly delay delivery, and introduce a new set of risks. We aim to provide a solution that doesn’t require data replication, accepting its inherent risk (this is why we are only partially blue/green). To reduce its likelihood, customers will first create temporary environments that will serve as a testing ground prior to executing operations on their production environment. 

The following diagram shows the entire flow, transitioning from blue to green: 

 

Our solution will not preclude data replication though; customers who prefer that approach can refer to our migration guide, which will provide instructions on where in the process this should be executed at.  

The migration process is therefore comprised of 4 logical phases; each phase includes one or more steps, facilitated by one or more commands and/or manual operations. 

Pre Flight 

Migration starts with a set of non-destructive operations, designed to increase confidence in the successful execution of future commands. Customers will need to address and resolve any issues surfaced in this phase before proceeding. 

Step 1 | Lockdown 

Locking down means preventing the customer’s environment from changing during the migration process; otherwise, the generated Gen2 app can become stale. In addition, as we will see, some parts of the process intentionally introduce (temporary) drift*, if state is allowed to change, this drift can potentially break the existing application. 

* Note: This drift could have been avoided if we re-wrote the amplify state files as well. However, those files are not designed to represent this unique partial state, and we prefer not to add this complexity. 

Prior to locking down state, we perform a few validations to ensure the customer’s environment is healthy: 

Drift detection checks will ensure that migration operations will not override or conflict with any existing state. These checks will also be available as a new top level amplify drift command, as they are beneficial outside the context of migration as well. 

Backend version check will validate the customer has deployed their environment with the latest major version of the Gen1 CLI, ensuring migration operates on a single and expected backend architecture. 

Deployment status check will validate the CloudFormation stack is in a healthy and deployable state. Otherwise, future migration operations are likely to fail. 

To perform this step, customers run: amplify migration lock. 

Following this command, customers will not be able to deploy any changes to their production stack. Their environment will be marked as such in the amplify console: 

 

If an emergency deployment is required, the –-rollback option can be used to unlock the stack. 

While CloudFormation deployments are blocked, we cannot automatically prevent out-of-band changes made to the resources themselves. Customers are expected to instruct their personnel to avoid making such changes and preferably disable any pipelines that might do the same. 

Flight Simulator 

In this phase, customers execute the migration commands against newly created environments that are equivalent to the production environment. Going forward, these will be referred to as “Clones”. They exist only for simulation purposes and will be deleted once migration is completed successfully. 

Note: Customers who opted for the data replication approach can skip this phase and proceed directly to Step 5 | Generate & Deploy Gen2 Prod. 

Step 2 | Create Gen1 Clone 

Gen1 clone is an environment with identical configuration to the customer’s Gen1 production environment. It contains its own set of stateful resources, which will be used to test the same stack operations that will be executed on the production stack. 

To create and deploy this environment, customers run: amplify migration clone. 

Since this environment will be used to code-generate the Gen2 app, we will also lock it down to prevent accidentally generating stale apps. 

Step 3 | Generate & Deploy Gen2 Clone 

Gen2 clone is an environment with identical configuration to the customer’s Gen1 clone environment, defined with Gen2 APIs. It contains its own set of stateful resources, which we will be orphaned in favor of the Gen1 resources. To generate the necessary definition files, customers run: amplify migration generate. 

At this point, customers inspect the generated app and perform manual modifications if required. Such modifications should be performed in external (i.e. non generated) files as much as possible, to allow minimum churn in case re-generation is needed.  

Gen1 categories that are supported in Gen2 will be ported to native Gen2 APIs. Unsupported categories will be ported to CDK L1 code, which customers are expected to maintain going forward. 

GraphQL schemas will be copied over as is and consumed by the Gen2 app a string. If time permits, we will code-generate a zod schema instead, which is the natural way to define schemas in Gen2. 

To deploy the generated app, customers push the code to a new git branch and configure the hosting service to deploy it. Customers who use an external pipeline will configure it independently to deploy the new branch. Deployment failures can be addressed by updating the generated code and retrying. 

Step 4 | Refactor Clone 

To make the Gen2 clone environment use (access) the Gen1 clone data, we perform a refactor operation. This operation updates the corresponding CloudFormation stacks such that the stateful resources are only managed via the Gen2 stack. 

To execute this operation, customers run: amplify migration refactor.  

At this point, customers perform manual verification of the Gen2 clone environment to ensure it correctly operates with the data from the Gen1 clone. In case problems are found, customers can either re-generate the environment (because, for example, a new version of the migration tool that fixes a bug was released) or manually update the generated code. 

In Flight 

In this phase, the customer will create and verify the Gen2 application that will eventually replace their existing Gen1 production environment. They do so by executing several commands and manually inspecting the artifacts they produce. 

Step 5 | Generate & Deploy Gen2 Prod 

Same procedure as Step 3 | Generate & Deploy Gen2 Clone. 

This environment will eventually become the new production environment. At this point, customers apply the same manual modifications (if any) they made during the simulation phase. 

Step 6 | Refactor Prod 

Same procedure as Step 5 | Refactor Clone. 

Note: Customers who opted for the data replication approach will skip this step and execute the replication instead. 

Contrary to the simulation phase though, this step introduces a data risk because for the first time in the process, the newly generated app can interact with live production data. 

The following diagram describes the state of the customer’s production environments: 

 

Note that: 

Gen1 stateful resources are moved to Gen2. 

Gen1 is operational, but its deployed CloudFormation template no longer corresponds to the state stored in s3. 

Both Gen1 and Gen2 access the same stateful resources. 

If problems are detected at this stage, customers can disconnect the production data from the Gen2 environment by rolling back to the previous state: amplify migration refactor –-rollback. 

Step 7 | Traffic Shift 

Traffic shift is the process of redirecting end-user traffic to the Gen2 prod environment. Hosting service APIs will be used to assign the existing application custom domain name to the new branch containing the Gen2 production environment.  

Landing 

In this phase, migration is effectively done. The customer has two fully operational environments that can serve the same traffic. All that is left is to delete unnecessary resources, which can be done at the customer’s will. 

Step 8 | Cleanup 

Cleanup involves deleting the environments that were created during the simulation phase (the clones). To execute this operation, customers run: amplify migration cleanup. 

Step 9 | Decommission Gen1  

Deleting the previous Gen1 production environment is the final step of migration. Doing so pre-maturely, in an unexpected state, will have devastating results.  To execute this step safely, customers run: amplify migration decommission. The command will perform several validations to ensure it doesn’t cause unexpected breakage. 

Alternatives Considered 

Migration In the Cloud 

In this approach, migration is executed via the AWS console, instead of the customer’s local machine. It leverages other AWS services that allow codifying workflows, and starts when the customer clicks the “Start Gen2 Migration” button on their Gen1 environment: 

 

Clicking this button will deploy the workflow into the customer’s account, the customer will then interact with the workflow directly in the corresponding AWS service console. This approach has the following common benefits: 

Easier and more stable execution environments. No local installations, less chances for network failures. 

Logs are automatically stored on a per execution level. They can be extracted directly from the console, increasing their fidelity. 

Controlled execution order. 

Easier resumability. Migration state is stored remotely and can be resumed at any time, and by different operators. 

However, each solution also poses significant drawbacks.  

1. Migration as a Step Functions State Machine 

 

Manual approval is supported only via email and SNS topics. 

Dynamic inputs (e.g. invoking a step with specific options) are only supported via Test State – which requires more step functions knowledge than we care for. 

Rollbacks can only be exposed as dynamic inputs. 

Overall, rejected due to non-intuitive DX. 

2. Migration as a CodePipeline pipeline 

 

Good: Manual approvals are natively supported.  

Good: Rollback operations are clearly marked in the UI. 

Bad: Rollbacks are only available after a full successful execution of the pipeline, which is too late. 

 

Bad: Dynamic Inputs are not supported. 

Overall, rejected due to missing features. 

Wait for Gen3 

Some concerns have been raised about whether migrating customers to Gen2 is even the right thing to do. Arguments for this concern include: 

Many Gen1 customers prefer the CLI experience – they do not want to write infrastructure code. 

Gen2 still has some design issues that make for a confusing customer experience.  

Migrating to Gen2 will require customers to maintain CDK L1 code for unsupported categories, a highly foreign experience. 

The lambda team, which has now absorbed amplify hosting, are working on an initiative that overlaps with the amplify offering. 

AppSync, a core component of amplify, has entered KTLO and is on a deprecation path. 

All of these might eventually result in our customers having to perform another complicated migration. 

This approach has been previously evaluated and rejected due to a high degree of uncertainty about the future of amplify; meaning it would take too long to wait for it. 

Detailed Architecture 

All command line utilities will be exposed via a new Gen1 CLI subcommand dubbed migration. Each command will follow the same structure: 

Execution: What operations will this command perform. 

Validation: What validations are required for this command. A failing validation will prevent execution, unless the –-skip-validations option is specified. 

Rollback: What operations are required to roll back the state to where it was prior to running the command. Each command will support rollback via the –-rollback option. 

All commands will be idempotent to be robust in the face of unexpected invocation patterns (e.g. invoking a command multiple). If a command is executed out of order, an error will be thrown. Order is enforced by having each command validate its expected initial state. 

Recovery from failures will be done by either manually addressing issues and rerunning the command, or by performing a rollback. 

Logs will be stored in dedicated files in the user’s home directory to allow for crash reporting to the team in case active customer support is needed. 

We will build on top of already existing work and provide the following commands: 

❯ amplify migration lock 

Execution 

Executing this command will attach a stack policy that will prevent any change to the root stack of the customer's environment. To do so, we will use the SetStackPolicyCommand API with the following policy: 

{ 

  "Effect": "Deny", 

  "Action": "*", 

  "Principal": "*", 

  "Resource": "*" 

} 

The command can be executed from any directory and doesn’t rely on any local files. 

Validation 

To ensure we are locking down a healthy state, we will perform the following validations: 

Drift Detection 

Amplify applications can exhibit many forms of drift, as described below: 

 

Each line here represents expected state synchronization between two sources of truth. A healthy state is when all these different sources agree with each other. This will require utilizing both CloudFormation APIs as well as detecting custom drift stemming from amplify specific state files.  

This validation will be implemented first as a top level amplify drift command and then reused wherever necessary. 

Backend Version 

Gen1 CLI has many major versions, each one introducing a breaking change to the backend architecture. We will only support architectures that correspond to the latest major version. More research is required to see how we implement this. 

Deployment Status 

DescribeStacks API will be used to validate the root stack status is UPDATE_COMPLETE. 

Rollback 

Rolling back this command means removing the stack policy to allow updating it once again. 

❯ amplify migration clone 

Execution 

Executing this command will deploy a new Gen1 environment that is a copy of the customers’ production environment. It will perform the following steps: 

Create a temporary working directory. 

Pull the existing production environment using amplify pull. This will create a local amplify directory with the backend configuration. 

Create a new environment using amplify env add. This will create a new root stack. 

Deploy resources using amplify push. This will create the nested stacks corresponding to the configured categories. 

Lock the environment using the same stack policy applied to the production stack. 

 

The command can be executed from any directory and doesn’t rely on any local files. 

Validation 

Creating a clone environment can pose an operational risk in case it happens to share any stateful resources with the production environment. We should validate that the production environment is truly isolated and cloneable prior to executing this command. More research is needed to understand how to implement this.  

Rollback 

Delete the clone environment using amplify env remove. 

❯ amplify migration generate 

Execution 

Executing this command will inspect a Gen1 environment to generate and override the local amplify directory with the equivalent Gen2 definition files. The original directory can be restored via git operations. For customers who dont use git, we will back it up and store it in the user’s home directory (under ~/.amplify/migrations). Generating different parts of the app will require different implementation mechanisms: 

Supported Categories will be ported to Gen2 native APIs using custom code generation. Much of this has already been implemented. 

Unsupported Categories will be ported to CDK L1s using cdk-from-cfn. PoC research is available here. 

Overrides will be copied over as is and combined with native Gen2 APIs. 

Custom Resources will be copied over as is and combined with Gen2 APIs. 

GraphQL Schema will be copied over as is and remain string based. If time permits, we will code-generate a zod schema instead, which is the native way to author schemas in Gen2. 

Some differences also exist within the categories themselves, which are not explicitly covered by this doc. We will review the feature matrix and address each one on the go. 

The command should be executed from the root directory of the project. 

Validation 

We will perform two validations: 

Since this command overrides the customer’s local directory, we ensure a clean working tree with the help of git status. This will be skipped for customers who don’t use git. 

To avoid generating an application that will soon become stale, we validate the clone environment is indeed locked. 

Rollback 

Rolling back this command means restoring the customer’s original amplify directory. We can achieve this by either running git commands or using the backup directory.  

❯ amplify migration refactor 

Execution 

This command is the crux of the migration process; it allows Gen2 environments to reuse existing stateful resources from Gen1 environments. To achieve this, we perform: 

Resolve stateful resource references in the Gen1 environment and deploy a CFN template where those resources are detached (i.e. are not part of any dependency chain). This is required because CloudFormation stack refactoring rejects moving “non isolated” resources. 

Use Stack Refactoring APIs to move the stateful resources from the Gen1 to the Gen2 stack. 

Generate a template that links the moved stateful resources to the stateless resources in the Gen2 environment via CloudFormation Refs. This is essentially the reverse of step 1, applied to the Gen2 stack. The previously connected stateful resources are orphaned. Update the Gen2 stack with that generated template. 

Much of this work has already been implemented by the previous version of the migration tool. The following diagram shows the expected state transitions on simplified versions of amplify templates. 

 

Given the complexity and potential risks of this operation, we will also provide a –-dry-run option that will only display the expected change sets. 

The command can be executed from any directory and doesn’t rely on any local files. 

Validation 

This command updates both the Gen1 and the Gen2 stacks and must validate that: 

No change set includes the removal of a stateful resource. 

The Gen1 stack should be locked, to prevent the operation from becoming stale.  

Rollback 

Rolling back this command will restore both environments to their original state. We effectively run the exact same process, swapping the source and target stacks. 

❯ amplify migration traffic-shift 

Execution 

This command re-assigns the branch associated with the production domain to point to the new Gen2 production environment: 

Calling UpdateDomainAssociation API 

This achieves the same thing as doing it from the console: 

 

The command can be executed from any directory and doesn’t rely on any local files 

Validation 

The traffic shift means that, for the first time, end users will start using the Gen2 environment. We validate that: 

The Gen2 stack is in a healthy state (all possible validations). 

The Gen2 environment is deployed with the latest commit on the corresponding branch. 

Rollback 

Rolling back to the previous state means re-assigning the associated branch to the original Gen1 branch. 

❯ amplify migration cleanup 

Execution 

This command deletes the two clone environments that were created during the simulation phase. We do this by running: 

amplify env remove (for the Gen1 clone) 

Calling DeleteBranch API (for the Gen2 clone) 

The command can be executed from any directory and doesn’t rely on any local files 

Validation 

The clones are safe to delete as they don’t contain or link to any production resources. No validations are needed here. 

Rollback 

Rolling back to the previous state means re-creating the clones. This is not something we can achieve in a single command. We will instruct users to repeat the generate & deploy process on their own. We don’t expect this to be very commonly needed. 

❯ amplify migration decommission 

Execution 

This command will delete the Gen1 production environment using amplify env remove.  

Validation 

Before destroying the Gen1 production environment, we run a few validations: 

Ensure Gen2 production environment exists and is in a healthy state. 

To prevent accidental data loss, ensure no stateful resources are going to be deleted. 

To ensure this environment no longer accepts traffic, validate no custom domains are attached to it using the ListDomainAssociations API. 

Rollback 

This command destroys an environment that wasn’t created by the migration tool. Therefore, customers would have to manually redeploy their environment by whatever means they originally deployed it. 

Appendix 

Technical Background 

The following is a brief overview of the most important bits relevant to the migration process. 

Backend Architecture 

Both Gen1 and Gen2 backend environments are modeled as CloudFormation stacks. Each environment maps to a single root stack; categories are deployed as nested stack resources inside that top level stack. Environments are supported by a dedicated s3 bucket that stores artifacts required by deployed resources (e.g. CloudFormation templates, AppSync schema definitions, ...).  

The specific stack hierarchy in Gen2 differs from Gen1, but for the sake of this document, we can think of both as a single stack comprised of stateless (e.g. AppSync API) and stateful resources (e.g. DynamoDB Table).  

 

Desired (IaC) State 

Both Gen1 and Gen2 record desired IaC state as local files, created when users add categories to their environments. In Gen1, categories are added via CLI commands, which persist the user’s selection to a local file.  

 

+ amplify/backend/backend-config.json (modified for brevity): 

"api": { 

  "additionalAuthenticationProviders": [], 

  "defaultAuthentication": { 

    "apiKeyConfig": { 

      "apiKeyExpirationDays": 7 

    }, 

    "authenticationType": "API_KEY" 

  }, 

  "service": "AppSync" 

} 

 

Custom code then reads this file and generates a CloudFormation template, which is uploaded to the s3 bucket during deployment. Gen1 also has built-in support for multi-developer workflows, leveraging the s3 bucket as a source control system. For this reason, the configuration file itself is also uploaded to the bucket, so it can later be pulled by other developers. In addition, customers using Git also push this file to their repository. Gen1 customers are not expected to perform any manual edits to these configuration files; any customization needs that are not exposed via the CLI are performed via “external” CDK code. For example: 

 

export function override(resources: AmplifyAuthCognitoStackTemplate) { 

  resources.userPool.policies = { 

    passwordPolicy: { 

      ...resources.userPool.policies["passwordPolicy"], 

      temporaryPasswordValidityDays: 2 

    } 

  }   

} 

In Gen2, categories are added by direct manipulation of TypeScript files. No CLI commands are involved. 

 

+ amplify/backend.ts (modified for brevity): 

import { defineBackend } from '@aws-amplify/backend'; 

import { auth } from './auth/resource'; 

import { data } from './data/resource'; 

 

defineBackend({ auth, data }); 

 

This file is pushed to a repository and converted to CloudFormation template using the CDK toolkit library during deployment. Contrary to Gen1, no additional files are uploaded to s3. Multi-developer workflows are supported only via external source control systems (e.g. Git). 

Deployment 

In Gen1, deployment can be performed via two methods: 

Direct execution of the amplify push command. This command will first pull the s3 state and merge it with the local configuration files. If those files are also stored in Git, a preliminary git pull is required to build the full desired state. More details can be found here. 

Hosting can be configured (either in the console or in the CLI) to map each repository branch to a specific environment. Whenever commits are pushed to the branch, the hosting service will git pull them and execute amplify push on the customer’s behalf. 

Gen2 deployment follow the same pattern, offering an ampx pipeline-deploy command to perform the deployment. Note however that in Gen2, hosting is considered a more fundamental part of the offering, as evident by it being the first step in the Gen2 getting started guide. In Gen1, hosting if offered late in the process, and is more likely to be skipped. 

 