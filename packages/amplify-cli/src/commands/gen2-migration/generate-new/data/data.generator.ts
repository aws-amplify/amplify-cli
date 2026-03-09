import path from 'node:path';
import fs from 'node:fs/promises';
import ts from 'typescript';
import { Generator } from '../generator';
import { AmplifyMigrationOperation } from '../../_operation';
import { BackendGenerator } from '../backend.generator';
import { Gen1App } from '../gen1-app/gen1-app';
import { printNodes } from '../ts-writer';

// Phase 2-3: Import rendering and fetching functions from old code.
// These are pure functions or self-contained fetchers that will move
// into generate-new/ when we rename the directory in Phase 4.
import { DataDefinition, generateDataSource } from '../../generate/generators/data/index';
import { DataDefinitionFetcher } from '../../generate/codegen-head/data_definition_fetcher';
import { BackendEnvironmentResolver } from '../../generate/codegen-head/backend_environment_selector';

const factory = ts.factory;

/**
 * Generates data (GraphQL/REST API) resource files and contributes to backend.ts.
 *
 * Reads the Gen1 API configuration (AppSync schema, REST API paths,
 * authorization modes) and generates amplify/data/resource.ts with a
 * defineData() call. Also contributes the data import and any additional
 * auth provider overrides to backend.ts.
 */
export class DataGenerator implements Generator {
  private readonly gen1App: Gen1App;
  private readonly backendGenerator: BackendGenerator;
  private readonly outputDir: string;

  public constructor(gen1App: Gen1App, backendGenerator: BackendGenerator, outputDir: string) {
    this.gen1App = gen1App;
    this.backendGenerator = backendGenerator;
    this.outputDir = outputDir;
  }

  public async plan(): Promise<AmplifyMigrationOperation[]> {
    // Reuse the existing DataDefinitionFetcher which handles the complex
    // logic of reading schemas, REST API configs, and AppSync settings.
    // This fetcher reads from both cloud backend and local project files.
    const backendEnvironmentResolver = new BackendEnvironmentResolver(
      this.gen1App.appId,
      this.gen1App.envName,
      this.gen1App.clients.amplify,
    );
    const fetcher = new DataDefinitionFetcher(backendEnvironmentResolver, this.gen1App.backendDownloader);
    const data = await fetcher.getDefinition();

    if (!data) {
      return [];
    }

    const dataDir = path.join(this.outputDir, 'amplify', 'data');
    const envName = this.gen1App.envName;

    return [
      {
        describe: async () => ['Generate data/resource.ts'],
        execute: async () => {
          const nodes = await generateDataSource(envName, data);
          if (!nodes) return;

          const content = printNodes(nodes);
          await fs.mkdir(dataDir, { recursive: true });
          await fs.writeFile(path.join(dataDir, 'resource.ts'), content, 'utf-8');

          // Contribute to backend.ts
          const dataIdentifier = factory.createIdentifier('data');
          this.backendGenerator.addImport('./data/resource', ['data']);
          this.backendGenerator.addDefineBackendProperty(factory.createShorthandPropertyAssignment(dataIdentifier));

          // Additional auth providers are handled as CDK overrides in backend.ts
          // by the BackendGenerator when it assembles the final file.
          // The data definition's additionalAuthProviders and restApis are stored
          // for the BackendGenerator to process during its plan() phase.
        },
      },
    ];
  }
}
