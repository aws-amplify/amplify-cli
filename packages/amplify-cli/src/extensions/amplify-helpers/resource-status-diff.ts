
import * as fs from 'fs-extra';
import * as path from 'path';
import * as cfnDiff from '@aws-cdk/cloudformation-diff';
import * as yaml_cfn from './yaml-cfn';
import * as cxapi from '@aws-cdk/cx-api';
import { print } from './print';
import { pathManager } from 'amplify-cli-core';
import chalk from 'chalk';
import { getResourceService } from './resource-status';
import { getBackendConfigFilePath } from './path-manager';
import * as glob from 'glob';

const ResourceProviderServiceNames = {
  S3 : "S3",
  DDB : "DynamoDB",
  LAMBDA : "Lambda",
  S3AndCLOUDFNT: "S3AndCloudFront",
  PINPOINT: "Pinpoint",
  COGNITO: "Cognito",
  APIGW: 'API Gateway',
  APPSYNC : 'AppSync',
}
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
    cloudTemplateFile : string;
    localTemplateFile : string;
    localPreBuildCfnFile : string;
    cloudPreBuildCfnFile : string;
    localBuildCfnFile : string;
    cloudBuildCfnFile : string;
}


export class ResourceDiff {
    resourceName: string;
    category : string;
    provider : string;
    service: string;
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
        this.service = getResourceService(category, resourceName);
        this.localTemplate = {}; //requires file-access, hence loaded from async methods
        this.cloudTemplate = {}; //requires file-access, hence loaded from async methods
        //Note: All file names include full-path but no extension.Extension will be added later.
        this.resourceFiles = {
            localTemplateFile : path.normalize(path.join(this.localBackendDir, category, resourceName)),
            cloudTemplateFile : path.normalize(path.join(this.cloudBackendDir, category, resourceName)),
            //Paths using glob for Cfn file and Build file
            localPreBuildCfnFile : this.globCfnFilePath( path.normalize(path.join(this.localBackendDir, category, resourceName))),
            cloudPreBuildCfnFile : this.globCfnFilePath( path.normalize(path.join(this.cloudBackendDir, category, resourceName))),
            localBuildCfnFile : this.globCfnFilePath( path.normalize(path.join(this.localBackendDir, category, resourceName, 'build'))),
            cloudBuildCfnFile : this.globCfnFilePath( path.normalize(path.join(this.cloudBackendDir, category, resourceName, 'build'))),
          }
    }

    normalizeProviderForFileNames(provider:string){
      //file-names are currently standardized around "cloudformation" not awscloudformation.
      if ( provider === "awscloudformation"){
        return CategoryProviders.CLOUDFORMATION
      } else {
        return provider;
      }
    }

    calculateCfnDiff = async () =>{
      const resourceTemplatePaths = await this.getCfnResourceFilePaths();
      //load resource template objects
      this.localTemplate = await this.loadCfnTemplate(resourceTemplatePaths.localTemplatePath)
      this.cloudTemplate = await this.loadCfnTemplate(resourceTemplatePaths.cloudTemplatePath);
      const diff = cfnDiff.diffTemplate(this.cloudTemplate, this.localTemplate );
      return diff;
    }

    isCategory( categoryType ){
       return this.category.toLowerCase() == categoryType
    }

    getCfnResourceFilePaths = async() => {
      return {
            localTemplatePath : (checkExist(this.resourceFiles.localBuildCfnFile))?this.resourceFiles.localBuildCfnFile: this.resourceFiles.localPreBuildCfnFile ,
            cloudTemplatePath : (checkExist(this.resourceFiles.cloudBuildCfnFile))?this.resourceFiles.cloudBuildCfnFile: this.resourceFiles.cloudPreBuildCfnFile
      }
    }

    printResourceDetailStatus = async ( mutationInfo : StackMutationInfo ) => {
      const header = `${ mutationInfo.consoleStyle(mutationInfo.label)}`;
      const diff = await this.calculateCfnDiff();
      print.info(`${resourceDetailSectionStyle(`[\u27A5] Resource Stack: ${capitalize(this.category)}/${this.resourceName}`)} : ${header}`);
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
        if( this.service === ResourceProviderServiceNames.S3 ){
          return `s3-cloudformation-template`;
        }
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

    getFilePathExtension( filePath :string ){
       const ext = path.extname( filePath );
       return (ext)? (ext.substring(1)).toLowerCase() : "" ;
    }

    globCfnFilePath( fileFolder : string ){
      if (fs.existsSync(fileFolder )) {
        const globOptions: glob.IOptions = {
          absolute: false,
          cwd: fileFolder,
          follow: false,
          nodir: true,
        };

        const templateFileNames = glob.sync('**/*template.{yaml,yml,json}', globOptions);
        for (const templateFileName of templateFileNames) {
          const absolutePath = path.join(fileFolder, templateFileName);
          return absolutePath; //We support only one cloudformation template ( nested templates are picked )
        }
      }
      return ""
    }

    //Load Cloudformation template from file.
    //The filePath should end in json/yaml or yml
    loadCfnTemplate = async(filePath) => {
      if( filePath === ""){
        return {}
      }
      const fileType = this.getFilePathExtension(filePath)
      try {
        //Load yaml or yml or json files
        let providerObject = {};
        if (fs.existsSync(filePath) ){
            providerObject = await this.loadStructuredFile(filePath, //Filename with extension
                                                           InputFileExtensionDeserializers[fileType] //Deserialization function
                                                           );
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
  tagsUpdated: boolean
}

//Console text styling for resource details section
const resourceDetailSectionStyle = chalk.bgRgb(15, 100, 204)


export async function CollateResourceDiffs( resources , mutationInfo : StackMutationInfo  /* create/update/delete */ ){
    const provider = CategoryProviders.CLOUDFORMATION;
    let resourceDiffs : ResourceDiff[] = [];
    for await (let resource of resources) {
      resourceDiffs.push( new ResourceDiff( resource.category, resource.resourceName, provider ) );
    }
    return resourceDiffs;
  }


