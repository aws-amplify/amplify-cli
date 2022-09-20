/**
 * Pinpoint app data type.
 * This is the minimum information to be stored in the 'output' section of amplify-meta for the Pinpoint resource
 */
export interface ICategoryMeta {
  Id: string,
  Name: string,
  Region: string,
  RegulatedResourceName? : string
}
