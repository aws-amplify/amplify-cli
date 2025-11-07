import { $TSContext } from '@aws-amplify/amplify-cli-core';
import { CustomResourceMigrator } from './custom-resource-migrator';
import { printer } from '@aws-amplify/amplify-prompts';

export const run = async (context: $TSContext) => {
  try {
    printer.info('🔄 Starting custom resource migration...\n');
    
    const projectPath = process.cwd();
    
    const result = await CustomResourceMigrator.migrateProject(projectPath);
    
    const report = CustomResourceMigrator.generateReport(result);
    printer.info(report);
    
    if (result.success) {
      printer.success('\n✅ Custom resource migration completed successfully!');
      
      if (result.transformedFiles.length > 0) {
        printer.info('\n📋 Next Steps:');
        printer.info('1. Review the transformed files');
        printer.info('2. Test your custom resources');
        printer.info('3. Update any remaining manual references');
        printer.info('4. Run amplify push to deploy');
      } else {
        printer.info('\n📋 No AmplifyHelper functions found to migrate.');
      }
    } else {
      printer.error('\n❌ Migration failed. Please review the errors above.');
      process.exit(1);
    }
    
  } catch (error) {
    printer.error(`Migration error: ${error.message}`);
    process.exit(1);
  }
};

export const name = 'migrate-custom-resources';
export const alias = 'mcr';
