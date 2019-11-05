import {Request} from '../lib/request';
import {Response} from '../lib/response';
import {AWSError} from '../lib/error';
import {Service} from '../lib/service';
import {ServiceConfigurationOptions} from '../lib/service';
import {ConfigBase as Config} from '../lib/config';
interface Blob {}
declare class TranscribeService extends Service {
  /**
   * Constructs a service object. This object has one method for each API operation.
   */
  constructor(options?: TranscribeService.Types.ClientConfiguration)
  config: Config & TranscribeService.Types.ClientConfiguration;
  /**
   * Creates a new custom vocabulary that you can use to change the way Amazon Transcribe handles transcription of an audio file.
   */
  createVocabulary(params: TranscribeService.Types.CreateVocabularyRequest, callback?: (err: AWSError, data: TranscribeService.Types.CreateVocabularyResponse) => void): Request<TranscribeService.Types.CreateVocabularyResponse, AWSError>;
  /**
   * Creates a new custom vocabulary that you can use to change the way Amazon Transcribe handles transcription of an audio file.
   */
  createVocabulary(callback?: (err: AWSError, data: TranscribeService.Types.CreateVocabularyResponse) => void): Request<TranscribeService.Types.CreateVocabularyResponse, AWSError>;
  /**
   * Deletes a vocabulary from Amazon Transcribe. 
   */
  deleteVocabulary(params: TranscribeService.Types.DeleteVocabularyRequest, callback?: (err: AWSError, data: {}) => void): Request<{}, AWSError>;
  /**
   * Deletes a vocabulary from Amazon Transcribe. 
   */
  deleteVocabulary(callback?: (err: AWSError, data: {}) => void): Request<{}, AWSError>;
  /**
   * Returns information about a transcription job. To see the status of the job, check the TranscriptionJobStatus field. If the status is COMPLETED, the job is finished and you can find the results at the location specified in the TranscriptionFileUri field.
   */
  getTranscriptionJob(params: TranscribeService.Types.GetTranscriptionJobRequest, callback?: (err: AWSError, data: TranscribeService.Types.GetTranscriptionJobResponse) => void): Request<TranscribeService.Types.GetTranscriptionJobResponse, AWSError>;
  /**
   * Returns information about a transcription job. To see the status of the job, check the TranscriptionJobStatus field. If the status is COMPLETED, the job is finished and you can find the results at the location specified in the TranscriptionFileUri field.
   */
  getTranscriptionJob(callback?: (err: AWSError, data: TranscribeService.Types.GetTranscriptionJobResponse) => void): Request<TranscribeService.Types.GetTranscriptionJobResponse, AWSError>;
  /**
   * Gets information about a vocabulary.
   */
  getVocabulary(params: TranscribeService.Types.GetVocabularyRequest, callback?: (err: AWSError, data: TranscribeService.Types.GetVocabularyResponse) => void): Request<TranscribeService.Types.GetVocabularyResponse, AWSError>;
  /**
   * Gets information about a vocabulary.
   */
  getVocabulary(callback?: (err: AWSError, data: TranscribeService.Types.GetVocabularyResponse) => void): Request<TranscribeService.Types.GetVocabularyResponse, AWSError>;
  /**
   * Lists transcription jobs with the specified status.
   */
  listTranscriptionJobs(params: TranscribeService.Types.ListTranscriptionJobsRequest, callback?: (err: AWSError, data: TranscribeService.Types.ListTranscriptionJobsResponse) => void): Request<TranscribeService.Types.ListTranscriptionJobsResponse, AWSError>;
  /**
   * Lists transcription jobs with the specified status.
   */
  listTranscriptionJobs(callback?: (err: AWSError, data: TranscribeService.Types.ListTranscriptionJobsResponse) => void): Request<TranscribeService.Types.ListTranscriptionJobsResponse, AWSError>;
  /**
   * Returns a list of vocabularies that match the specified criteria. If no criteria are specified, returns the entire list of vocabularies.
   */
  listVocabularies(params: TranscribeService.Types.ListVocabulariesRequest, callback?: (err: AWSError, data: TranscribeService.Types.ListVocabulariesResponse) => void): Request<TranscribeService.Types.ListVocabulariesResponse, AWSError>;
  /**
   * Returns a list of vocabularies that match the specified criteria. If no criteria are specified, returns the entire list of vocabularies.
   */
  listVocabularies(callback?: (err: AWSError, data: TranscribeService.Types.ListVocabulariesResponse) => void): Request<TranscribeService.Types.ListVocabulariesResponse, AWSError>;
  /**
   * Starts an asynchronous job to transcribe speech to text.
   */
  startTranscriptionJob(params: TranscribeService.Types.StartTranscriptionJobRequest, callback?: (err: AWSError, data: TranscribeService.Types.StartTranscriptionJobResponse) => void): Request<TranscribeService.Types.StartTranscriptionJobResponse, AWSError>;
  /**
   * Starts an asynchronous job to transcribe speech to text.
   */
  startTranscriptionJob(callback?: (err: AWSError, data: TranscribeService.Types.StartTranscriptionJobResponse) => void): Request<TranscribeService.Types.StartTranscriptionJobResponse, AWSError>;
  /**
   * Updates an existing vocabulary with new values. The UpdateVocabulary operation overwrites all of the existing information with the values that you provide in the request.
   */
  updateVocabulary(params: TranscribeService.Types.UpdateVocabularyRequest, callback?: (err: AWSError, data: TranscribeService.Types.UpdateVocabularyResponse) => void): Request<TranscribeService.Types.UpdateVocabularyResponse, AWSError>;
  /**
   * Updates an existing vocabulary with new values. The UpdateVocabulary operation overwrites all of the existing information with the values that you provide in the request.
   */
  updateVocabulary(callback?: (err: AWSError, data: TranscribeService.Types.UpdateVocabularyResponse) => void): Request<TranscribeService.Types.UpdateVocabularyResponse, AWSError>;
}
declare namespace TranscribeService {
  export type Boolean = boolean;
  export interface CreateVocabularyRequest {
    /**
     * The name of the vocabulary. The name must be unique within an AWS account. The name is case-sensitive.
     */
    VocabularyName: VocabularyName;
    /**
     * The language code of the vocabulary entries.
     */
    LanguageCode: LanguageCode;
    /**
     * An array of strings that contains the vocabulary entries. 
     */
    Phrases: Phrases;
  }
  export interface CreateVocabularyResponse {
    /**
     * The name of the vocabulary.
     */
    VocabularyName?: VocabularyName;
    /**
     * The language code of the vocabulary entries.
     */
    LanguageCode?: LanguageCode;
    /**
     * The processing state of the vocabulary. When the VocabularyState field contains READY the vocabulary is ready to be used in a StartTranscriptionJob request.
     */
    VocabularyState?: VocabularyState;
    /**
     * The date and time that the vocabulary was created.
     */
    LastModifiedTime?: DateTime;
    /**
     * If the VocabularyState field is FAILED, this field contains information about why the job failed.
     */
    FailureReason?: FailureReason;
  }
  export type DateTime = Date;
  export interface DeleteVocabularyRequest {
    /**
     * The name of the vocabulary to delete. 
     */
    VocabularyName: VocabularyName;
  }
  export type FailureReason = string;
  export interface GetTranscriptionJobRequest {
    /**
     * The name of the job.
     */
    TranscriptionJobName: TranscriptionJobName;
  }
  export interface GetTranscriptionJobResponse {
    /**
     * An object that contains the results of the transcription job.
     */
    TranscriptionJob?: TranscriptionJob;
  }
  export interface GetVocabularyRequest {
    /**
     * The name of the vocabulary to return information about. The name is case-sensitive.
     */
    VocabularyName: VocabularyName;
  }
  export interface GetVocabularyResponse {
    /**
     * The name of the vocabulary to return.
     */
    VocabularyName?: VocabularyName;
    /**
     * The language code of the vocabulary entries.
     */
    LanguageCode?: LanguageCode;
    /**
     * The processing state of the vocabulary.
     */
    VocabularyState?: VocabularyState;
    /**
     * The date and time that the vocabulary was last modified.
     */
    LastModifiedTime?: DateTime;
    /**
     * If the VocabularyState field is FAILED, this field contains information about why the job failed.
     */
    FailureReason?: FailureReason;
    /**
     * The S3 location where the vocabulary is stored. Use this URI to get the contents of the vocabulary. The URI is available for a limited time.
     */
    DownloadUri?: Uri;
  }
  export type LanguageCode = "en-US"|"es-US"|string;
  export interface ListTranscriptionJobsRequest {
    /**
     * When specified, returns only transcription jobs with the specified status.
     */
    Status?: TranscriptionJobStatus;
    /**
     * When specified, the jobs returned in the list are limited to jobs whose name contains the specified string.
     */
    JobNameContains?: TranscriptionJobName;
    /**
     * If the result of the previous request to ListTranscriptionJobs was truncated, include the NextToken to fetch the next set of jobs.
     */
    NextToken?: NextToken;
    /**
     * The maximum number of jobs to return in the response. If there are fewer results in the list, this response contains only the actual results.
     */
    MaxResults?: MaxResults;
  }
  export interface ListTranscriptionJobsResponse {
    /**
     * The requested status of the jobs returned.
     */
    Status?: TranscriptionJobStatus;
    /**
     * The ListTranscriptionJobs operation returns a page of jobs at a time. The maximum size of the page is set by the MaxResults parameter. If there are more jobs in the list than the page size, Amazon Transcribe returns the NextPage token. Include the token in the next request to the ListTranscriptionJobs operation to return in the next page of jobs.
     */
    NextToken?: NextToken;
    /**
     * A list of objects containing summary information for a transcription job.
     */
    TranscriptionJobSummaries?: TranscriptionJobSummaries;
  }
  export interface ListVocabulariesRequest {
    /**
     * If the result of the previous request to ListVocabularies was truncated, include the NextToken to fetch the next set of jobs.
     */
    NextToken?: NextToken;
    /**
     * The maximum number of vocabularies to return in the response. If there are fewer results in the list, this response contains only the actual results.
     */
    MaxResults?: MaxResults;
    /**
     * When specified, only returns vocabularies with the VocabularyState field equal to the specified state.
     */
    StateEquals?: VocabularyState;
    /**
     * When specified, the vocabularies returned in the list are limited to vocabularies whose name contains the specified string. The search is case-insensitive, ListVocabularies will return both "vocabularyname" and "VocabularyName" in the response list.
     */
    NameContains?: VocabularyName;
  }
  export interface ListVocabulariesResponse {
    /**
     * The requested vocabulary state.
     */
    Status?: TranscriptionJobStatus;
    /**
     * The ListVocabularies operation returns a page of vocabularies at a time. The maximum size of the page is set by the MaxResults parameter. If there are more jobs in the list than the page size, Amazon Transcribe returns the NextPage token. Include the token in the next request to the ListVocabularies operation to return in the next page of jobs.
     */
    NextToken?: NextToken;
    /**
     * A list of objects that describe the vocabularies that match the search criteria in the request.
     */
    Vocabularies?: Vocabularies;
  }
  export type MaxResults = number;
  export type MaxSpeakers = number;
  export interface Media {
    /**
     * The S3 location of the input media file. The URI must be in the same region as the API endpoint that you are calling. The general form is:   https://&lt;aws-region&gt;.amazonaws.com/&lt;bucket-name&gt;/&lt;keyprefix&gt;/&lt;objectkey&gt;   For example:  https://s3-us-east-1.amazonaws.com/examplebucket/example.mp4   https://s3-us-east-1.amazonaws.com/examplebucket/mediadocs/example.mp4  For more information about S3 object names, see Object Keys in the Amazon S3 Developer Guide.
     */
    MediaFileUri?: Uri;
  }
  export type MediaFormat = "mp3"|"mp4"|"wav"|"flac"|string;
  export type MediaSampleRateHertz = number;
  export type NextToken = string;
  export type OutputBucketName = string;
  export type OutputLocationType = "CUSTOMER_BUCKET"|"SERVICE_BUCKET"|string;
  export type Phrase = string;
  export type Phrases = Phrase[];
  export interface Settings {
    /**
     * The name of a vocabulary to use when processing the transcription job.
     */
    VocabularyName?: VocabularyName;
    /**
     * Determines whether the transcription job uses speaker recognition to identify different speakers in the input audio. Speaker recognition labels individual speakers in the audio file. If you set the ShowSpeakerLabels field to true, you must also set the maximum number of speaker labels MaxSpeakerLabels field. You can't set both ShowSpeakerLabels and ChannelIdentification in the same request. If you set both, your request returns a BadRequestException.
     */
    ShowSpeakerLabels?: Boolean;
    /**
     * The maximum number of speakers to identify in the input audio. If there are more speakers in the audio than this number, multiple speakers will be identified as a single speaker. If you specify the MaxSpeakerLabels field, you must set the ShowSpeakerLabels field to true.
     */
    MaxSpeakerLabels?: MaxSpeakers;
    /**
     * Instructs Amazon Transcribe to process each audio channel separately and then merge the transcription output of each channel into a single transcription.  Amazon Transcribe also produces a transcription of each item detected on an audio channel, including the start time and end time of the item and alternative transcriptions of the item including the confidence that Amazon Transcribe has in the transcription. You can't set both ShowSpeakerLabels and ChannelIdentification in the same request. If you set both, your request returns a BadRequestException.
     */
    ChannelIdentification?: Boolean;
  }
  export interface StartTranscriptionJobRequest {
    /**
     * The name of the job. You can't use the strings "." or ".." in the job name. The name must be unique within an AWS account.
     */
    TranscriptionJobName: TranscriptionJobName;
    /**
     * The language code for the language used in the input media file.
     */
    LanguageCode: LanguageCode;
    /**
     * The sample rate, in Hertz, of the audio track in the input media file. 
     */
    MediaSampleRateHertz?: MediaSampleRateHertz;
    /**
     * The format of the input media file.
     */
    MediaFormat: MediaFormat;
    /**
     * An object that describes the input media for a transcription job.
     */
    Media: Media;
    /**
     * The location where the transcription is stored. If you set the OutputBucketName, Amazon Transcribe puts the transcription in the specified S3 bucket. When you call the GetTranscriptionJob operation, the operation returns this location in the TranscriptFileUri field. The S3 bucket must have permissions that allow Amazon Transcribe to put files in the bucket. For more information, see Permissions Required for IAM User Roles. If you don't set the OutputBucketName, Amazon Transcribe generates a pre-signed URL, a shareable URL that provides secure access to your transcription, and returns it in the TranscriptFileUri field. Use this URL to download the transcription.
     */
    OutputBucketName?: OutputBucketName;
    /**
     * A Settings object that provides optional settings for a transcription job.
     */
    Settings?: Settings;
  }
  export interface StartTranscriptionJobResponse {
    /**
     * An object containing details of the asynchronous transcription job.
     */
    TranscriptionJob?: TranscriptionJob;
  }
  export interface Transcript {
    /**
     * The location where the transcription is stored. Use this URI to access the transcription. If you specified an S3 bucket in the OutputBucketName field when you created the job, this is the URI of that bucket. If you chose to store the transcription in Amazon Transcribe, this is a shareable URL that provides secure access to that location.
     */
    TranscriptFileUri?: Uri;
  }
  export interface TranscriptionJob {
    /**
     * The name of the transcription job.
     */
    TranscriptionJobName?: TranscriptionJobName;
    /**
     * The status of the transcription job.
     */
    TranscriptionJobStatus?: TranscriptionJobStatus;
    /**
     * The language code for the input speech.
     */
    LanguageCode?: LanguageCode;
    /**
     * The sample rate, in Hertz, of the audio track in the input media file. 
     */
    MediaSampleRateHertz?: MediaSampleRateHertz;
    /**
     * The format of the input media file.
     */
    MediaFormat?: MediaFormat;
    /**
     * An object that describes the input media for the transcription job.
     */
    Media?: Media;
    /**
     * An object that describes the output of the transcription job.
     */
    Transcript?: Transcript;
    /**
     * A timestamp that shows when the job was created.
     */
    CreationTime?: DateTime;
    /**
     * A timestamp that shows when the job was completed.
     */
    CompletionTime?: DateTime;
    /**
     * If the TranscriptionJobStatus field is FAILED, this field contains information about why the job failed.
     */
    FailureReason?: FailureReason;
    /**
     * Optional settings for the transcription job. Use these settings to turn on speaker recognition, to set the maximum number of speakers that should be identified and to specify a custom vocabulary to use when processing the transcription job.
     */
    Settings?: Settings;
  }
  export type TranscriptionJobName = string;
  export type TranscriptionJobStatus = "IN_PROGRESS"|"FAILED"|"COMPLETED"|string;
  export type TranscriptionJobSummaries = TranscriptionJobSummary[];
  export interface TranscriptionJobSummary {
    /**
     * The name of the transcription job.
     */
    TranscriptionJobName?: TranscriptionJobName;
    /**
     * A timestamp that shows when the job was created.
     */
    CreationTime?: DateTime;
    /**
     * A timestamp that shows when the job was completed.
     */
    CompletionTime?: DateTime;
    /**
     * The language code for the input speech.
     */
    LanguageCode?: LanguageCode;
    /**
     * The status of the transcription job. When the status is COMPLETED, use the GetTranscriptionJob operation to get the results of the transcription.
     */
    TranscriptionJobStatus?: TranscriptionJobStatus;
    /**
     * If the TranscriptionJobStatus field is FAILED, a description of the error.
     */
    FailureReason?: FailureReason;
    /**
     * Indicates the location of the output of the transcription job. If the value is CUSTOMER_BUCKET then the location is the S3 bucket specified in the outputBucketName field when the transcription job was started with the StartTranscriptionJob operation. If the value is SERVICE_BUCKET then the output is stored by Amazon Transcribe and can be retrieved using the URI in the GetTranscriptionJob response's TranscriptFileUri field.
     */
    OutputLocationType?: OutputLocationType;
  }
  export interface UpdateVocabularyRequest {
    /**
     * The name of the vocabulary to update. The name is case-sensitive.
     */
    VocabularyName: VocabularyName;
    /**
     * The language code of the vocabulary entries.
     */
    LanguageCode: LanguageCode;
    /**
     * An array of strings containing the vocabulary entries.
     */
    Phrases: Phrases;
  }
  export interface UpdateVocabularyResponse {
    /**
     * The name of the vocabulary that was updated.
     */
    VocabularyName?: VocabularyName;
    /**
     * The language code of the vocabulary entries.
     */
    LanguageCode?: LanguageCode;
    /**
     * The date and time that the vocabulary was updated.
     */
    LastModifiedTime?: DateTime;
    /**
     * The processing state of the vocabulary. When the VocabularyState field contains READY the vocabulary is ready to be used in a StartTranscriptionJob request.
     */
    VocabularyState?: VocabularyState;
  }
  export type Uri = string;
  export type Vocabularies = VocabularyInfo[];
  export interface VocabularyInfo {
    /**
     * The name of the vocabulary.
     */
    VocabularyName?: VocabularyName;
    /**
     * The language code of the vocabulary entries.
     */
    LanguageCode?: LanguageCode;
    /**
     * The date and time that the vocabulary was last modified.
     */
    LastModifiedTime?: DateTime;
    /**
     * The processing state of the vocabulary. If the state is READY you can use the vocabulary in a StartTranscriptionJob request.
     */
    VocabularyState?: VocabularyState;
  }
  export type VocabularyName = string;
  export type VocabularyState = "PENDING"|"READY"|"FAILED"|string;
  /**
   * A string in YYYY-MM-DD format that represents the latest possible API version that can be used in this service. Specify 'latest' to use the latest possible version.
   */
  export type apiVersion = "2017-10-26"|"latest"|string;
  export interface ClientApiVersions {
    /**
     * A string in YYYY-MM-DD format that represents the latest possible API version that can be used in this service. Specify 'latest' to use the latest possible version.
     */
    apiVersion?: apiVersion;
  }
  export type ClientConfiguration = ServiceConfigurationOptions & ClientApiVersions;
  /**
   * Contains interfaces for use with the TranscribeService client.
   */
  export import Types = TranscribeService;
}
export = TranscribeService;
