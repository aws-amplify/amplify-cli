import { DiffRule, ProjectRule, sanityCheckProject } from 'graphql-transformer-core';

export type SanityCheckRules = {
  diffRules: DiffRule[];
  projectRules: ProjectRule[];
};

export class GraphQLSanityCheck {
  constructor(
    private readonly rules: SanityCheckRules,
    private readonly rootStackFileName: string,
    private readonly currentCloudBackendDir: string,
    private readonly localStateDir: string,
  ) {}

  validate = async () => {
    await sanityCheckProject(
      this.currentCloudBackendDir,
      this.localStateDir,
      this.rootStackFileName,
      this.rules.diffRules,
      this.rules.projectRules,
    );
  };
}
