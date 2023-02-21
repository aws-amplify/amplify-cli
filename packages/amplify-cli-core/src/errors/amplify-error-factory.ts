/**
 * This class is a placeholder for filtering errors coming from @aws-amplify/amplify-category-api package.
 * This whole class can be removed if the above package implements amplify Errors and AmplifyFaults
 */
import { $TSAny } from '../types';
import { AmplifyError } from './amplify-error';
import { AmplifyErrorType } from './amplify-exception';
import { AmplifyFault } from './amplify-fault';

/**
 * Error types defined in @aws-amplify/amplify-category-api
 */
const amplifyErrorList = [
  'InvalidDirectiveError' ,
  'InvalidTransformerError',
  'SchemaValidationError',
  'TransformerContractError',
  'DestructiveMigrationError',
  'InvalidMigrationError',
  'InvalidGSIMigrationError', 
  'UnknownDirectiveError', 
  'GraphQLError'
 ];
 
 const schemaNotFoundRegexError = [
     /^.*\bNo GraphQL schema found\b.*$/,
     /^.*\bNo schema found\b.*$/,
     /^.*\bCould not find a schema\b.*$/
 ];
 
 const apiAlreadyExistsRegexError = [
   /^.*\bUse 'amplify update api' to make modifications\b.*$/,
 ];
 
// error can be an AmplifyException Type or  Error type or any type
export class AmplifyErrorFactory {
    private readonly defaultError: AmplifyFault;
    constructor(error: AmplifyFault) {
        this.defaultError = error;
    }
    create(error: $TSAny): AmplifyError | AmplifyFault {
      let amplifyError;
        if(error instanceof Error && error?.name && amplifyErrorList.includes(error.name)){
            const amplifyErrorType = `${error.name}` as AmplifyErrorType;
            amplifyError =  new AmplifyError(
                amplifyErrorType,
                {
                  message: error.message,
                },
                error,
              )
        }
        // try regex matching for errors without name 
        const regexUserArrayMap = this.createMapFromRegexList();
        for (const [regexArray, errorName] of regexUserArrayMap.entries()) {
          regexArray.forEach( regex => {
            if(regex.test(error.message)){
              amplifyError =  new AmplifyError(
                errorName as AmplifyErrorType,
                {
                  message: error.message,
                },
                error,
              ) 
            }
          });
        }
        if(amplifyError){
          return amplifyError;
        }
        return this.defaultError;
    }

    /**
     * creates a map of Array<Regexp> and Error key to group a section of erros to a specific bucket
     */
    private createMapFromRegexList(): Map<Array<RegExp>,string> {
      const regexUserArrayMap = new Map<Array<RegExp>,string>();
      // setting SchemaNotFoundError here
      regexUserArrayMap.set(schemaNotFoundRegexError,'SchemaNotFoundError');
      regexUserArrayMap.set(apiAlreadyExistsRegexError, 'ResourceAlreadyExistsError')
      return regexUserArrayMap;
    }
}


