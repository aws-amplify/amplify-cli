
import * as fs from 'fs-extra';
import * as path from 'path';
import * as cfnDiff from '@aws-cdk/cloudformation-diff';
import * as yaml_cfn from './yaml-cfn';
import * as cxapi from '@aws-cdk/cx-api';
import { print } from './print';
import { pathManager } from 'amplify-cli-core';
import chalk from 'chalk';

const CategoryTypes = {
    PROVIDERS : "providers",
    API : "api",
    AUTH : "auth",
    STORAGE : "storage",
    FUNCTION : "function",
    ANALYTICS : "analytics"
}

const CategoryProviders = {
    CLOUDFORMATION : "cloudformation",
}

interface StackMutationInfo {
  label : String;
  consoleStyle : (string)=>string ;
  icon : String;
}
interface StackMutationType {
  CREATE : StackMutationInfo,
  UPDATE : StackMutationInfo,
  DELETE : StackMutationInfo,
  IMPORT : StackMutationInfo,
  UNLINK : StackMutationInfo,
  NOCHANGE : StackMutationInfo,
}
export const stackMutationType :  StackMutationType = {
    CREATE : {
      label : "Create",
      consoleStyle : chalk.green.bold,
      icon : "[+]"
    },
    UPDATE : {
      label : "Update",
      consoleStyle : chalk.yellow.bold,
      icon : "[~]"
    },

    DELETE : {
      label: "Delete",
      consoleStyle : chalk.red.bold,
      icon : "[-]"
    },

    IMPORT : {
      label: "Import",
      consoleStyle : chalk.blue.bold,
      icon : `[\u21E9]`
    },

    UNLINK : {
      label : "Unlink",
      consoleStyle : chalk.red.bold,
      icon : `[\u2BFB]`
    },
    NOCHANGE : {
      label : "No Change",
      consoleStyle : chalk.grey,
      icon : `[ ]`
    }

}

//TBD: move this to a class
//Maps File extension to deserializer functions
const InputFileExtensionDeserializers = {
    json : JSON.parse,
    yaml : yaml_cfn.deserialize,
    yml  : yaml_cfn.deserialize
}

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}
interface ResourcePaths {
    cloudBuildTemplateFile : string; //cloud file path after transformation
    localBuildTemplateFile : string; //file path
    cloudTemplateFile : string;
    localTemplateFile : string;
    localPreBuildTemplateFile : string;
    cloudPreBuildTemplateFile : string;

}

export class ResourceDiff {
    resourceName: string;
    category : string;
    provider : string;
    resourceFiles : ResourcePaths;
    localBackendDir : string;
    cloudBackendDir : string;
    localTemplate : {
                        [key: string]: any;
                    };
    cloudTemplate : {
                        [key: string]: any;
                    };

    constructor( category, resourceName, provider ){
        this.localBackendDir = pathManager.getBackendDirPath();
        this.cloudBackendDir = pathManager.getCurrentCloudBackendDirPath();
        this.resourceName = resourceName;
        this.category = category;
        this.provider = this.normalizeProviderForFileNames(provider);
        this.localTemplate = {}; //requires file-access, hence loaded from async methods
        this.cloudTemplate = {}; //requires file-access, hence loaded from async methods
        //Note: All file names include full-path but no extension.Extension will be added later.
        this.resourceFiles = {
            localTemplateFile : path.normalize(path.join(this.localBackendDir, category, resourceName)),
            cloudTemplateFile : path.normalize(path.join(this.cloudBackendDir, category, resourceName)),
            //Used for API category, since cloudformation is overridden by user generated changes
            localBuildTemplateFile : path.normalize(path.join(this.localBackendDir, category, resourceName, 'build',`${this.provider}-template`)),
            cloudBuildTemplateFile : path.normalize(path.join(this.cloudBackendDir, category, resourceName, 'build', `${this.provider}-template`)),
            //Use for non-API category like storage, auth
            localPreBuildTemplateFile: path.normalize(path.join(this.localBackendDir, category, resourceName, this.getResourceProviderFileName(resourceName, this.provider))),
            cloudPreBuildTemplateFile: path.normalize(path.join(this.cloudBackendDir , category, resourceName, this.getResourceProviderFileName(resourceName, this.provider))),
        }
        //console.log("SACPC:ResourceDiff: ", this.resourceFiles);
    }

    normalizeProviderForFileNames(provider:string){
      //file-names are currently standardized around "cloudformation" not awscloudformation.
      if ( provider === "awscloudformation"){
        return CategoryProviders.CLOUDFORMATION
      } else {
        return provider;
      }
    }

    calculateDiffTemplate = async () => {
      const resourceTemplatePaths = await this.getResourceFilePaths()
      //load resource template objects
      this.localTemplate = await this.loadCloudFormationTemplate(resourceTemplatePaths.localTemplatePath)
      this.cloudTemplate = await this.loadCloudFormationTemplate(resourceTemplatePaths.cloudTemplatePath);
      const diff = cfnDiff.diffTemplate(this.cloudTemplate, this.localTemplate );
      return diff;
    }

    isCategory( categoryType ){
       return this.category.toLowerCase() == categoryType
    }

    getResourceFilePaths = async() => {
      if ( this.isCategory(CategoryTypes.API) ){
          //API artifacts are stored in build folder for cloud resources
          //SACPCTBD!!: This should not rely on the presence or absence of a file, it should be based on the context state.
          //e.g user-added, amplify-built-not-deployed, amplify-deployed-failed, amplify-deployed-success
          return {
            localTemplatePath : (checkExist(this.resourceFiles.localBuildTemplateFile))?this.resourceFiles.localBuildTemplateFile: this.resourceFiles.localPreBuildTemplateFile ,
            cloudTemplatePath : (checkExist(this.resourceFiles.cloudBuildTemplateFile))?this.resourceFiles.cloudBuildTemplateFile: this.resourceFiles.cloudPreBuildTemplateFile
          }
        }
        return {
            localTemplatePath: this.resourceFiles.localPreBuildTemplateFile ,
            cloudTemplatePath: this.resourceFiles.cloudPreBuildTemplateFile
        }
    }

    printResourceDetailStatus = async ( mutationInfo : StackMutationInfo ) => {
      const header = `${ mutationInfo.consoleStyle(mutationInfo.label)}`;
      const diff = await this.calculateDiffTemplate();
      //display template diff to console
      //print.info(`[\u27A5] ${vaporStyle("Stack: ")} ${capitalize(this.category)}/${this.resourceName} : ${header}`);
      print.info(`${vaporStyle(`[\u27A5] Resource Stack: ${capitalize(this.category)}/${this.resourceName}`)} : ${header}`);
      const diffCount = this.printStackDiff( diff );
      if ( diffCount === 0 ){
          console.log("No changes  ")
      }
    }

    normalizeAWSResourceName( cfnType ){
       let parts = cfnType.split("::");
       parts.shift(); //remove "AWS::"
       return parts.join("::")
    }

    normalizeCdkChangeImpact( cdkChangeImpact : cfnDiff.ResourceImpact ){
        switch (cdkChangeImpact) {
          case cfnDiff.ResourceImpact.MAY_REPLACE:
            return chalk.italic(chalk.yellow('may be replaced'));
          case cfnDiff.ResourceImpact.WILL_REPLACE:
            return chalk.italic(chalk.bold(chalk.red('replace')));
          case cfnDiff.ResourceImpact.WILL_DESTROY:
            return chalk.italic(chalk.bold(chalk.red('destroy')));
          case cfnDiff.ResourceImpact.WILL_ORPHAN:
            return chalk.italic(chalk.yellow('orphan'));
          case cfnDiff.ResourceImpact.WILL_UPDATE:
          case cfnDiff.ResourceImpact.WILL_CREATE:
          case cfnDiff.ResourceImpact.NO_CHANGE:
            return ''; // no extra info is gained here
        }
    }

    getActionStyle( changeType:StackMutationInfo, valueType ){
      return ` ${changeType.consoleStyle(changeType.icon)} ${this.normalizeAWSResourceName(valueType)}`
    }

    getUpdateImpactStyle( summaryStringArray ){
      return summaryStringArray.join(`\n  \u2514\u2501 `)
    }

    constructChangeSummary( change ){
       let action : string;
       let propChangeSummary : string[] = [];
       if ( change.isAddition ){
          action = this.getActionStyle(stackMutationType.CREATE, change.newValue.Type);
       } else if (change.isRemoval){
          action = this.getActionStyle(stackMutationType.DELETE, change.oldValue.Type);
       } else {
           //Its an update
           action = this.getActionStyle(stackMutationType.UPDATE, change.newValue.Type);
           Object.keys(change.propertyDiffs).map( propType => {
             const changeData = change.propertyDiffs[propType];
             if ( changeData.isDifferent ) {
                   const summary = `${propType} ${this.normalizeCdkChangeImpact(changeData.changeImpact)}`;
                   propChangeSummary.push(summary)
             }
           })
       }
       if ( propChangeSummary.length > 0 ){
        const summaryString = this.getUpdateImpactStyle(propChangeSummary)
        return `${action} ${summaryString}`
       } else {
        return action
       }
    }

    getDiffSummary = async () => {
      const templateDiff = await this.calculateDiffTemplate();
      const results : string[] = [];
      templateDiff.resources.forEachDifference( (logicalId, change)=> {
        results.push( this.constructChangeSummary( change ));
      });
      if ( results.length > 0){
        return results.join("\n");
      } else {
        return chalk.grey("no change");
      }
    }

    printResourceSummaryStatus = async ( mutationInfo : StackMutationInfo ) => {
      const header = `${ mutationInfo.consoleStyle(mutationInfo.label)}`;
      const templateDiff = await this.calculateDiffTemplate();
      //display template diff to console
      print.info(`[\u27A5] ${vaporStyle("Stack: ")} ${capitalize(this.category)}/${this.resourceName} : ${header}`);
      templateDiff.resources.forEachDifference( (logicalId, change)=> {
        console.log(this.constructChangeSummary( change )  );
      })
    }

    printStackDiff = ( templateDiff, stream?: cfnDiff.FormatStream ) =>{
        // filter out 'AWS::CDK::Metadata' resources from the template
        if (templateDiff.resources ) {
          templateDiff.resources = templateDiff.resources.filter(change => {
            if (!change) { return true; }
            if (change.newResourceType === 'AWS::CDK::Metadata') { return false; }
            if (change.oldResourceType === 'AWS::CDK::Metadata') { return false; }
            return true;
          });
        }
        if (!templateDiff.isEmpty) {
          cfnDiff.formatDifferences(stream || process.stderr, templateDiff);
        }
        return templateDiff.differenceCount;
    }


    getResourceProviderFileName(  resourceName : string, providerType : string ){
        //resourceName is the name of an instantiated category type e.g name of your s3 bucket
        //providerType is the name of the cloud infrastructure provider e.g cloudformation/terraform
        return `${resourceName}-${providerType}-template`
    }

    loadStructuredFile = async(fileName: string, deserializeFunction) => {
        const contents = await fs.readFile(fileName, { encoding: 'utf-8' });
        return deserializeFunction(contents);
    }

    loadCloudFormationTemplate = async( filePath ) => {
        try {
          //Load yaml or yml or json files
          let providerObject = {};
          const inputFileExtensions = Object.keys(InputFileExtensionDeserializers)
          for( let i = 0 ; i < inputFileExtensions.length ; i++ ){
            if ( fs.existsSync(`${filePath}.${inputFileExtensions[i]}`) ){
              providerObject = await this.loadStructuredFile(`${filePath}.${inputFileExtensions[i]}`, //Filename with extension
                                                             InputFileExtensionDeserializers[inputFileExtensions[i]] //Deserialization function
                                                             );
              return providerObject;
            }
          }
          return providerObject;
        } catch (e) {
          //No resource file found
          console.log(e);
          throw e;
        }
    }

}

function checkExist( filePath ){
    const inputTypes = [ 'json', 'yaml', 'yml'] ; //check for existence of any one of the extensions.
    for( let i = 0 ; i < inputTypes.length ; i++ ){
      if ( fs.existsSync(`${filePath}.${inputTypes[i]}`) ){
        return true;
      }
    }
    return false;
}

//Interface to store template-diffs for C-R-U resource diffs
export interface IResourceDiffCollection {
  updatedDiff : ResourceDiff[]|[],
  deletedDiff : ResourceDiff[]|[],
  createdDiff : ResourceDiff[]|[]
}

//Interface to store resource status for each category
export interface ICategoryStatusCollection {
  resourcesToBeCreated: any[],
  resourcesToBeUpdated: any[],
  resourcesToBeDeleted: any[],
  resourcesToBeSynced: any[],
  allResources:any[],
  tagsUpdated: false
}

//const vaporStyle = chalk.hex('#8be8fd').bgHex('#282a36');
const vaporStyle = chalk.bgRgb(15, 100, 204)


export async function CollateResourceDiffs( resources , mutationInfo : StackMutationInfo  /* create/update/delete */ ){
    const provider = CategoryProviders.CLOUDFORMATION;
    let resourceDiffs : ResourceDiff[] = [];
    for await (let resource of resources) {
      resourceDiffs.push( new ResourceDiff( resource.category, resource.resourceName, provider ) );
    }
    return resourceDiffs;
  }


