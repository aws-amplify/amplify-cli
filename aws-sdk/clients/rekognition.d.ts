import {Request} from '../lib/request';
import {Response} from '../lib/response';
import {AWSError} from '../lib/error';
import {Service} from '../lib/service';
import {ServiceConfigurationOptions} from '../lib/service';
import {ConfigBase as Config} from '../lib/config';
interface Blob {}
declare class Rekognition extends Service {
  /**
   * Constructs a service object. This object has one method for each API operation.
   */
  constructor(options?: Rekognition.Types.ClientConfiguration)
  config: Config & Rekognition.Types.ClientConfiguration;
  /**
   * Compares a face in the source input image with each of the 100 largest faces detected in the target input image.    If the source image contains multiple faces, the service detects the largest face and compares it with each face detected in the target image.   You pass the input and target images either as base64-encoded image bytes or as references to images in an Amazon S3 bucket. If you use the AWS CLI to call Amazon Rekognition operations, passing image bytes isn't supported. The image must be formatted as a PNG or JPEG file.  In response, the operation returns an array of face matches ordered by similarity score in descending order. For each face match, the response provides a bounding box of the face, facial landmarks, pose details (pitch, role, and yaw), quality (brightness and sharpness), and confidence value (indicating the level of confidence that the bounding box contains a face). The response also provides a similarity score, which indicates how closely the faces match.   By default, only faces with a similarity score of greater than or equal to 80% are returned in the response. You can change this value by specifying the SimilarityThreshold parameter.   CompareFaces also returns an array of faces that don't match the source image. For each face, it returns a bounding box, confidence value, landmarks, pose details, and quality. The response also returns information about the face in the source image, including the bounding box of the face and confidence value. If the image doesn't contain Exif metadata, CompareFaces returns orientation information for the source and target images. Use these values to display the images with the correct image orientation. If no faces are detected in the source or target images, CompareFaces returns an InvalidParameterException error.    This is a stateless API operation. That is, data returned by this operation doesn't persist.  For an example, see Comparing Faces in Images in the Amazon Rekognition Developer Guide. This operation requires permissions to perform the rekognition:CompareFaces action.
   */
  compareFaces(params: Rekognition.Types.CompareFacesRequest, callback?: (err: AWSError, data: Rekognition.Types.CompareFacesResponse) => void): Request<Rekognition.Types.CompareFacesResponse, AWSError>;
  /**
   * Compares a face in the source input image with each of the 100 largest faces detected in the target input image.    If the source image contains multiple faces, the service detects the largest face and compares it with each face detected in the target image.   You pass the input and target images either as base64-encoded image bytes or as references to images in an Amazon S3 bucket. If you use the AWS CLI to call Amazon Rekognition operations, passing image bytes isn't supported. The image must be formatted as a PNG or JPEG file.  In response, the operation returns an array of face matches ordered by similarity score in descending order. For each face match, the response provides a bounding box of the face, facial landmarks, pose details (pitch, role, and yaw), quality (brightness and sharpness), and confidence value (indicating the level of confidence that the bounding box contains a face). The response also provides a similarity score, which indicates how closely the faces match.   By default, only faces with a similarity score of greater than or equal to 80% are returned in the response. You can change this value by specifying the SimilarityThreshold parameter.   CompareFaces also returns an array of faces that don't match the source image. For each face, it returns a bounding box, confidence value, landmarks, pose details, and quality. The response also returns information about the face in the source image, including the bounding box of the face and confidence value. If the image doesn't contain Exif metadata, CompareFaces returns orientation information for the source and target images. Use these values to display the images with the correct image orientation. If no faces are detected in the source or target images, CompareFaces returns an InvalidParameterException error.    This is a stateless API operation. That is, data returned by this operation doesn't persist.  For an example, see Comparing Faces in Images in the Amazon Rekognition Developer Guide. This operation requires permissions to perform the rekognition:CompareFaces action.
   */
  compareFaces(callback?: (err: AWSError, data: Rekognition.Types.CompareFacesResponse) => void): Request<Rekognition.Types.CompareFacesResponse, AWSError>;
  /**
   * Creates a collection in an AWS Region. You can add faces to the collection using the operation.  For example, you might create collections, one for each of your application users. A user can then index faces using the IndexFaces operation and persist results in a specific collection. Then, a user can search the collection for faces in the user-specific container.   Collection names are case-sensitive.  This operation requires permissions to perform the rekognition:CreateCollection action.
   */
  createCollection(params: Rekognition.Types.CreateCollectionRequest, callback?: (err: AWSError, data: Rekognition.Types.CreateCollectionResponse) => void): Request<Rekognition.Types.CreateCollectionResponse, AWSError>;
  /**
   * Creates a collection in an AWS Region. You can add faces to the collection using the operation.  For example, you might create collections, one for each of your application users. A user can then index faces using the IndexFaces operation and persist results in a specific collection. Then, a user can search the collection for faces in the user-specific container.   Collection names are case-sensitive.  This operation requires permissions to perform the rekognition:CreateCollection action.
   */
  createCollection(callback?: (err: AWSError, data: Rekognition.Types.CreateCollectionResponse) => void): Request<Rekognition.Types.CreateCollectionResponse, AWSError>;
  /**
   * Creates an Amazon Rekognition stream processor that you can use to detect and recognize faces in a streaming video. Amazon Rekognition Video is a consumer of live video from Amazon Kinesis Video Streams. Amazon Rekognition Video sends analysis results to Amazon Kinesis Data Streams. You provide as input a Kinesis video stream (Input) and a Kinesis data stream (Output) stream. You also specify the face recognition criteria in Settings. For example, the collection containing faces that you want to recognize. Use Name to assign an identifier for the stream processor. You use Name to manage the stream processor. For example, you can start processing the source video by calling with the Name field.  After you have finished analyzing a streaming video, use to stop processing. You can delete the stream processor by calling .
   */
  createStreamProcessor(params: Rekognition.Types.CreateStreamProcessorRequest, callback?: (err: AWSError, data: Rekognition.Types.CreateStreamProcessorResponse) => void): Request<Rekognition.Types.CreateStreamProcessorResponse, AWSError>;
  /**
   * Creates an Amazon Rekognition stream processor that you can use to detect and recognize faces in a streaming video. Amazon Rekognition Video is a consumer of live video from Amazon Kinesis Video Streams. Amazon Rekognition Video sends analysis results to Amazon Kinesis Data Streams. You provide as input a Kinesis video stream (Input) and a Kinesis data stream (Output) stream. You also specify the face recognition criteria in Settings. For example, the collection containing faces that you want to recognize. Use Name to assign an identifier for the stream processor. You use Name to manage the stream processor. For example, you can start processing the source video by calling with the Name field.  After you have finished analyzing a streaming video, use to stop processing. You can delete the stream processor by calling .
   */
  createStreamProcessor(callback?: (err: AWSError, data: Rekognition.Types.CreateStreamProcessorResponse) => void): Request<Rekognition.Types.CreateStreamProcessorResponse, AWSError>;
  /**
   * Deletes the specified collection. Note that this operation removes all faces in the collection. For an example, see delete-collection-procedure. This operation requires permissions to perform the rekognition:DeleteCollection action.
   */
  deleteCollection(params: Rekognition.Types.DeleteCollectionRequest, callback?: (err: AWSError, data: Rekognition.Types.DeleteCollectionResponse) => void): Request<Rekognition.Types.DeleteCollectionResponse, AWSError>;
  /**
   * Deletes the specified collection. Note that this operation removes all faces in the collection. For an example, see delete-collection-procedure. This operation requires permissions to perform the rekognition:DeleteCollection action.
   */
  deleteCollection(callback?: (err: AWSError, data: Rekognition.Types.DeleteCollectionResponse) => void): Request<Rekognition.Types.DeleteCollectionResponse, AWSError>;
  /**
   * Deletes faces from a collection. You specify a collection ID and an array of face IDs to remove from the collection. This operation requires permissions to perform the rekognition:DeleteFaces action.
   */
  deleteFaces(params: Rekognition.Types.DeleteFacesRequest, callback?: (err: AWSError, data: Rekognition.Types.DeleteFacesResponse) => void): Request<Rekognition.Types.DeleteFacesResponse, AWSError>;
  /**
   * Deletes faces from a collection. You specify a collection ID and an array of face IDs to remove from the collection. This operation requires permissions to perform the rekognition:DeleteFaces action.
   */
  deleteFaces(callback?: (err: AWSError, data: Rekognition.Types.DeleteFacesResponse) => void): Request<Rekognition.Types.DeleteFacesResponse, AWSError>;
  /**
   * Deletes the stream processor identified by Name. You assign the value for Name when you create the stream processor with . You might not be able to use the same name for a stream processor for a few seconds after calling DeleteStreamProcessor.
   */
  deleteStreamProcessor(params: Rekognition.Types.DeleteStreamProcessorRequest, callback?: (err: AWSError, data: Rekognition.Types.DeleteStreamProcessorResponse) => void): Request<Rekognition.Types.DeleteStreamProcessorResponse, AWSError>;
  /**
   * Deletes the stream processor identified by Name. You assign the value for Name when you create the stream processor with . You might not be able to use the same name for a stream processor for a few seconds after calling DeleteStreamProcessor.
   */
  deleteStreamProcessor(callback?: (err: AWSError, data: Rekognition.Types.DeleteStreamProcessorResponse) => void): Request<Rekognition.Types.DeleteStreamProcessorResponse, AWSError>;
  /**
   * Describes the specified collection. You can use DescribeCollection to get information, such as the number of faces indexed into a collection and the version of the model used by the collection for face detection. For more information, see Describing a Collection in the Amazon Rekognition Developer Guide.
   */
  describeCollection(params: Rekognition.Types.DescribeCollectionRequest, callback?: (err: AWSError, data: Rekognition.Types.DescribeCollectionResponse) => void): Request<Rekognition.Types.DescribeCollectionResponse, AWSError>;
  /**
   * Describes the specified collection. You can use DescribeCollection to get information, such as the number of faces indexed into a collection and the version of the model used by the collection for face detection. For more information, see Describing a Collection in the Amazon Rekognition Developer Guide.
   */
  describeCollection(callback?: (err: AWSError, data: Rekognition.Types.DescribeCollectionResponse) => void): Request<Rekognition.Types.DescribeCollectionResponse, AWSError>;
  /**
   * Provides information about a stream processor created by . You can get information about the input and output streams, the input parameters for the face recognition being performed, and the current status of the stream processor.
   */
  describeStreamProcessor(params: Rekognition.Types.DescribeStreamProcessorRequest, callback?: (err: AWSError, data: Rekognition.Types.DescribeStreamProcessorResponse) => void): Request<Rekognition.Types.DescribeStreamProcessorResponse, AWSError>;
  /**
   * Provides information about a stream processor created by . You can get information about the input and output streams, the input parameters for the face recognition being performed, and the current status of the stream processor.
   */
  describeStreamProcessor(callback?: (err: AWSError, data: Rekognition.Types.DescribeStreamProcessorResponse) => void): Request<Rekognition.Types.DescribeStreamProcessorResponse, AWSError>;
  /**
   * Detects faces within an image that is provided as input.  DetectFaces detects the 100 largest faces in the image. For each face detected, the operation returns face details. These details include a bounding box of the face, a confidence value (that the bounding box contains a face), and a fixed set of attributes such as facial landmarks (for example, coordinates of eye and mouth), gender, presence of beard, sunglasses, and so on.  The face-detection algorithm is most effective on frontal faces. For non-frontal or obscured faces, the algorithm might not detect the faces or might detect faces with lower confidence.  You pass the input image either as base64-encoded image bytes or as a reference to an image in an Amazon S3 bucket. If you use the AWS CLI to call Amazon Rekognition operations, passing image bytes is not supported. The image must be either a PNG or JPEG formatted file.   This is a stateless API operation. That is, the operation does not persist any data.  This operation requires permissions to perform the rekognition:DetectFaces action. 
   */
  detectFaces(params: Rekognition.Types.DetectFacesRequest, callback?: (err: AWSError, data: Rekognition.Types.DetectFacesResponse) => void): Request<Rekognition.Types.DetectFacesResponse, AWSError>;
  /**
   * Detects faces within an image that is provided as input.  DetectFaces detects the 100 largest faces in the image. For each face detected, the operation returns face details. These details include a bounding box of the face, a confidence value (that the bounding box contains a face), and a fixed set of attributes such as facial landmarks (for example, coordinates of eye and mouth), gender, presence of beard, sunglasses, and so on.  The face-detection algorithm is most effective on frontal faces. For non-frontal or obscured faces, the algorithm might not detect the faces or might detect faces with lower confidence.  You pass the input image either as base64-encoded image bytes or as a reference to an image in an Amazon S3 bucket. If you use the AWS CLI to call Amazon Rekognition operations, passing image bytes is not supported. The image must be either a PNG or JPEG formatted file.   This is a stateless API operation. That is, the operation does not persist any data.  This operation requires permissions to perform the rekognition:DetectFaces action. 
   */
  detectFaces(callback?: (err: AWSError, data: Rekognition.Types.DetectFacesResponse) => void): Request<Rekognition.Types.DetectFacesResponse, AWSError>;
  /**
   * Detects instances of real-world entities within an image (JPEG or PNG) provided as input. This includes objects like flower, tree, and table; events like wedding, graduation, and birthday party; and concepts like landscape, evening, and nature.  For an example, see Analyzing Images Stored in an Amazon S3 Bucket in the Amazon Rekognition Developer Guide.   DetectLabels does not support the detection of activities. However, activity detection is supported for label detection in videos. For more information, see StartLabelDetection in the Amazon Rekognition Developer Guide.  You pass the input image as base64-encoded image bytes or as a reference to an image in an Amazon S3 bucket. If you use the AWS CLI to call Amazon Rekognition operations, passing image bytes is not supported. The image must be either a PNG or JPEG formatted file.   For each object, scene, and concept the API returns one or more labels. Each label provides the object name, and the level of confidence that the image contains the object. For example, suppose the input image has a lighthouse, the sea, and a rock. The response includes all three labels, one for each object.   {Name: lighthouse, Confidence: 98.4629}   {Name: rock,Confidence: 79.2097}    {Name: sea,Confidence: 75.061}  In the preceding example, the operation returns one label for each of the three objects. The operation can also return multiple labels for the same object in the image. For example, if the input image shows a flower (for example, a tulip), the operation might return the following three labels.   {Name: flower,Confidence: 99.0562}   {Name: plant,Confidence: 99.0562}   {Name: tulip,Confidence: 99.0562}  In this example, the detection algorithm more precisely identifies the flower as a tulip. In response, the API returns an array of labels. In addition, the response also includes the orientation correction. Optionally, you can specify MinConfidence to control the confidence threshold for the labels returned. The default is 50%. You can also add the MaxLabels parameter to limit the number of labels returned.   If the object detected is a person, the operation doesn't provide the same facial details that the DetectFaces operation provides.  This is a stateless API operation. That is, the operation does not persist any data. This operation requires permissions to perform the rekognition:DetectLabels action. 
   */
  detectLabels(params: Rekognition.Types.DetectLabelsRequest, callback?: (err: AWSError, data: Rekognition.Types.DetectLabelsResponse) => void): Request<Rekognition.Types.DetectLabelsResponse, AWSError>;
  /**
   * Detects instances of real-world entities within an image (JPEG or PNG) provided as input. This includes objects like flower, tree, and table; events like wedding, graduation, and birthday party; and concepts like landscape, evening, and nature.  For an example, see Analyzing Images Stored in an Amazon S3 Bucket in the Amazon Rekognition Developer Guide.   DetectLabels does not support the detection of activities. However, activity detection is supported for label detection in videos. For more information, see StartLabelDetection in the Amazon Rekognition Developer Guide.  You pass the input image as base64-encoded image bytes or as a reference to an image in an Amazon S3 bucket. If you use the AWS CLI to call Amazon Rekognition operations, passing image bytes is not supported. The image must be either a PNG or JPEG formatted file.   For each object, scene, and concept the API returns one or more labels. Each label provides the object name, and the level of confidence that the image contains the object. For example, suppose the input image has a lighthouse, the sea, and a rock. The response includes all three labels, one for each object.   {Name: lighthouse, Confidence: 98.4629}   {Name: rock,Confidence: 79.2097}    {Name: sea,Confidence: 75.061}  In the preceding example, the operation returns one label for each of the three objects. The operation can also return multiple labels for the same object in the image. For example, if the input image shows a flower (for example, a tulip), the operation might return the following three labels.   {Name: flower,Confidence: 99.0562}   {Name: plant,Confidence: 99.0562}   {Name: tulip,Confidence: 99.0562}  In this example, the detection algorithm more precisely identifies the flower as a tulip. In response, the API returns an array of labels. In addition, the response also includes the orientation correction. Optionally, you can specify MinConfidence to control the confidence threshold for the labels returned. The default is 50%. You can also add the MaxLabels parameter to limit the number of labels returned.   If the object detected is a person, the operation doesn't provide the same facial details that the DetectFaces operation provides.  This is a stateless API operation. That is, the operation does not persist any data. This operation requires permissions to perform the rekognition:DetectLabels action. 
   */
  detectLabels(callback?: (err: AWSError, data: Rekognition.Types.DetectLabelsResponse) => void): Request<Rekognition.Types.DetectLabelsResponse, AWSError>;
  /**
   * Detects explicit or suggestive adult content in a specified JPEG or PNG format image. Use DetectModerationLabels to moderate images depending on your requirements. For example, you might want to filter images that contain nudity, but not images containing suggestive content. To filter images, use the labels returned by DetectModerationLabels to determine which types of content are appropriate. For information about moderation labels, see Detecting Unsafe Content in the Amazon Rekognition Developer Guide. You pass the input image either as base64-encoded image bytes or as a reference to an image in an Amazon S3 bucket. If you use the AWS CLI to call Amazon Rekognition operations, passing image bytes is not supported. The image must be either a PNG or JPEG formatted file. 
   */
  detectModerationLabels(params: Rekognition.Types.DetectModerationLabelsRequest, callback?: (err: AWSError, data: Rekognition.Types.DetectModerationLabelsResponse) => void): Request<Rekognition.Types.DetectModerationLabelsResponse, AWSError>;
  /**
   * Detects explicit or suggestive adult content in a specified JPEG or PNG format image. Use DetectModerationLabels to moderate images depending on your requirements. For example, you might want to filter images that contain nudity, but not images containing suggestive content. To filter images, use the labels returned by DetectModerationLabels to determine which types of content are appropriate. For information about moderation labels, see Detecting Unsafe Content in the Amazon Rekognition Developer Guide. You pass the input image either as base64-encoded image bytes or as a reference to an image in an Amazon S3 bucket. If you use the AWS CLI to call Amazon Rekognition operations, passing image bytes is not supported. The image must be either a PNG or JPEG formatted file. 
   */
  detectModerationLabels(callback?: (err: AWSError, data: Rekognition.Types.DetectModerationLabelsResponse) => void): Request<Rekognition.Types.DetectModerationLabelsResponse, AWSError>;
  /**
   * Detects text in the input image and converts it into machine-readable text. Pass the input image as base64-encoded image bytes or as a reference to an image in an Amazon S3 bucket. If you use the AWS CLI to call Amazon Rekognition operations, you must pass it as a reference to an image in an Amazon S3 bucket. For the AWS CLI, passing image bytes is not supported. The image must be either a .png or .jpeg formatted file.  The DetectText operation returns text in an array of elements, TextDetections. Each TextDetection element provides information about a single word or line of text that was detected in the image.  A word is one or more ISO basic latin script characters that are not separated by spaces. DetectText can detect up to 50 words in an image. A line is a string of equally spaced words. A line isn't necessarily a complete sentence. For example, a driver's license number is detected as a line. A line ends when there is no aligned text after it. Also, a line ends when there is a large gap between words, relative to the length of the words. This means, depending on the gap between words, Amazon Rekognition may detect multiple lines in text aligned in the same direction. Periods don't represent the end of a line. If a sentence spans multiple lines, the DetectText operation returns multiple lines. To determine whether a TextDetection element is a line of text or a word, use the TextDetection object Type field.  To be detected, text must be within +/- 90 degrees orientation of the horizontal axis. For more information, see DetectText in the Amazon Rekognition Developer Guide.
   */
  detectText(params: Rekognition.Types.DetectTextRequest, callback?: (err: AWSError, data: Rekognition.Types.DetectTextResponse) => void): Request<Rekognition.Types.DetectTextResponse, AWSError>;
  /**
   * Detects text in the input image and converts it into machine-readable text. Pass the input image as base64-encoded image bytes or as a reference to an image in an Amazon S3 bucket. If you use the AWS CLI to call Amazon Rekognition operations, you must pass it as a reference to an image in an Amazon S3 bucket. For the AWS CLI, passing image bytes is not supported. The image must be either a .png or .jpeg formatted file.  The DetectText operation returns text in an array of elements, TextDetections. Each TextDetection element provides information about a single word or line of text that was detected in the image.  A word is one or more ISO basic latin script characters that are not separated by spaces. DetectText can detect up to 50 words in an image. A line is a string of equally spaced words. A line isn't necessarily a complete sentence. For example, a driver's license number is detected as a line. A line ends when there is no aligned text after it. Also, a line ends when there is a large gap between words, relative to the length of the words. This means, depending on the gap between words, Amazon Rekognition may detect multiple lines in text aligned in the same direction. Periods don't represent the end of a line. If a sentence spans multiple lines, the DetectText operation returns multiple lines. To determine whether a TextDetection element is a line of text or a word, use the TextDetection object Type field.  To be detected, text must be within +/- 90 degrees orientation of the horizontal axis. For more information, see DetectText in the Amazon Rekognition Developer Guide.
   */
  detectText(callback?: (err: AWSError, data: Rekognition.Types.DetectTextResponse) => void): Request<Rekognition.Types.DetectTextResponse, AWSError>;
  /**
   * Gets the name and additional information about a celebrity based on his or her Amazon Rekognition ID. The additional information is returned as an array of URLs. If there is no additional information about the celebrity, this list is empty. For more information, see Recognizing Celebrities in an Image in the Amazon Rekognition Developer Guide. This operation requires permissions to perform the rekognition:GetCelebrityInfo action. 
   */
  getCelebrityInfo(params: Rekognition.Types.GetCelebrityInfoRequest, callback?: (err: AWSError, data: Rekognition.Types.GetCelebrityInfoResponse) => void): Request<Rekognition.Types.GetCelebrityInfoResponse, AWSError>;
  /**
   * Gets the name and additional information about a celebrity based on his or her Amazon Rekognition ID. The additional information is returned as an array of URLs. If there is no additional information about the celebrity, this list is empty. For more information, see Recognizing Celebrities in an Image in the Amazon Rekognition Developer Guide. This operation requires permissions to perform the rekognition:GetCelebrityInfo action. 
   */
  getCelebrityInfo(callback?: (err: AWSError, data: Rekognition.Types.GetCelebrityInfoResponse) => void): Request<Rekognition.Types.GetCelebrityInfoResponse, AWSError>;
  /**
   * Gets the celebrity recognition results for a Amazon Rekognition Video analysis started by . Celebrity recognition in a video is an asynchronous operation. Analysis is started by a call to which returns a job identifier (JobId). When the celebrity recognition operation finishes, Amazon Rekognition Video publishes a completion status to the Amazon Simple Notification Service topic registered in the initial call to StartCelebrityRecognition. To get the results of the celebrity recognition analysis, first check that the status value published to the Amazon SNS topic is SUCCEEDED. If so, call GetCelebrityDetection and pass the job identifier (JobId) from the initial call to StartCelebrityDetection.  For more information, see Working With Stored Videos in the Amazon Rekognition Developer Guide.  GetCelebrityRecognition returns detected celebrities and the time(s) they are detected in an array (Celebrities) of objects. Each CelebrityRecognition contains information about the celebrity in a object and the time, Timestamp, the celebrity was detected.    GetCelebrityRecognition only returns the default facial attributes (BoundingBox, Confidence, Landmarks, Pose, and Quality). The other facial attributes listed in the Face object of the following response syntax are not returned. For more information, see FaceDetail in the Amazon Rekognition Developer Guide.   By default, the Celebrities array is sorted by time (milliseconds from the start of the video). You can also sort the array by celebrity by specifying the value ID in the SortBy input parameter. The CelebrityDetail object includes the celebrity identifer and additional information urls. If you don't store the additional information urls, you can get them later by calling with the celebrity identifer. No information is returned for faces not recognized as celebrities. Use MaxResults parameter to limit the number of labels returned. If there are more results than specified in MaxResults, the value of NextToken in the operation response contains a pagination token for getting the next set of results. To get the next page of results, call GetCelebrityDetection and populate the NextToken request parameter with the token value returned from the previous call to GetCelebrityRecognition.
   */
  getCelebrityRecognition(params: Rekognition.Types.GetCelebrityRecognitionRequest, callback?: (err: AWSError, data: Rekognition.Types.GetCelebrityRecognitionResponse) => void): Request<Rekognition.Types.GetCelebrityRecognitionResponse, AWSError>;
  /**
   * Gets the celebrity recognition results for a Amazon Rekognition Video analysis started by . Celebrity recognition in a video is an asynchronous operation. Analysis is started by a call to which returns a job identifier (JobId). When the celebrity recognition operation finishes, Amazon Rekognition Video publishes a completion status to the Amazon Simple Notification Service topic registered in the initial call to StartCelebrityRecognition. To get the results of the celebrity recognition analysis, first check that the status value published to the Amazon SNS topic is SUCCEEDED. If so, call GetCelebrityDetection and pass the job identifier (JobId) from the initial call to StartCelebrityDetection.  For more information, see Working With Stored Videos in the Amazon Rekognition Developer Guide.  GetCelebrityRecognition returns detected celebrities and the time(s) they are detected in an array (Celebrities) of objects. Each CelebrityRecognition contains information about the celebrity in a object and the time, Timestamp, the celebrity was detected.    GetCelebrityRecognition only returns the default facial attributes (BoundingBox, Confidence, Landmarks, Pose, and Quality). The other facial attributes listed in the Face object of the following response syntax are not returned. For more information, see FaceDetail in the Amazon Rekognition Developer Guide.   By default, the Celebrities array is sorted by time (milliseconds from the start of the video). You can also sort the array by celebrity by specifying the value ID in the SortBy input parameter. The CelebrityDetail object includes the celebrity identifer and additional information urls. If you don't store the additional information urls, you can get them later by calling with the celebrity identifer. No information is returned for faces not recognized as celebrities. Use MaxResults parameter to limit the number of labels returned. If there are more results than specified in MaxResults, the value of NextToken in the operation response contains a pagination token for getting the next set of results. To get the next page of results, call GetCelebrityDetection and populate the NextToken request parameter with the token value returned from the previous call to GetCelebrityRecognition.
   */
  getCelebrityRecognition(callback?: (err: AWSError, data: Rekognition.Types.GetCelebrityRecognitionResponse) => void): Request<Rekognition.Types.GetCelebrityRecognitionResponse, AWSError>;
  /**
   * Gets the content moderation analysis results for a Amazon Rekognition Video analysis started by . Content moderation analysis of a video is an asynchronous operation. You start analysis by calling . which returns a job identifier (JobId). When analysis finishes, Amazon Rekognition Video publishes a completion status to the Amazon Simple Notification Service topic registered in the initial call to StartContentModeration. To get the results of the content moderation analysis, first check that the status value published to the Amazon SNS topic is SUCCEEDED. If so, call GetCelebrityDetection and pass the job identifier (JobId) from the initial call to StartCelebrityDetection.  For more information, see Working with Stored Videos in the Amazon Rekognition Devlopers Guide.  GetContentModeration returns detected content moderation labels, and the time they are detected, in an array, ModerationLabels, of objects.  By default, the moderated labels are returned sorted by time, in milliseconds from the start of the video. You can also sort them by moderated label by specifying NAME for the SortBy input parameter.  Since video analysis can return a large number of results, use the MaxResults parameter to limit the number of labels returned in a single call to GetContentModeration. If there are more results than specified in MaxResults, the value of NextToken in the operation response contains a pagination token for getting the next set of results. To get the next page of results, call GetContentModeration and populate the NextToken request parameter with the value of NextToken returned from the previous call to GetContentModeration. For more information, see Detecting Unsafe Content in the Amazon Rekognition Developer Guide.
   */
  getContentModeration(params: Rekognition.Types.GetContentModerationRequest, callback?: (err: AWSError, data: Rekognition.Types.GetContentModerationResponse) => void): Request<Rekognition.Types.GetContentModerationResponse, AWSError>;
  /**
   * Gets the content moderation analysis results for a Amazon Rekognition Video analysis started by . Content moderation analysis of a video is an asynchronous operation. You start analysis by calling . which returns a job identifier (JobId). When analysis finishes, Amazon Rekognition Video publishes a completion status to the Amazon Simple Notification Service topic registered in the initial call to StartContentModeration. To get the results of the content moderation analysis, first check that the status value published to the Amazon SNS topic is SUCCEEDED. If so, call GetCelebrityDetection and pass the job identifier (JobId) from the initial call to StartCelebrityDetection.  For more information, see Working with Stored Videos in the Amazon Rekognition Devlopers Guide.  GetContentModeration returns detected content moderation labels, and the time they are detected, in an array, ModerationLabels, of objects.  By default, the moderated labels are returned sorted by time, in milliseconds from the start of the video. You can also sort them by moderated label by specifying NAME for the SortBy input parameter.  Since video analysis can return a large number of results, use the MaxResults parameter to limit the number of labels returned in a single call to GetContentModeration. If there are more results than specified in MaxResults, the value of NextToken in the operation response contains a pagination token for getting the next set of results. To get the next page of results, call GetContentModeration and populate the NextToken request parameter with the value of NextToken returned from the previous call to GetContentModeration. For more information, see Detecting Unsafe Content in the Amazon Rekognition Developer Guide.
   */
  getContentModeration(callback?: (err: AWSError, data: Rekognition.Types.GetContentModerationResponse) => void): Request<Rekognition.Types.GetContentModerationResponse, AWSError>;
  /**
   * Gets face detection results for a Amazon Rekognition Video analysis started by . Face detection with Amazon Rekognition Video is an asynchronous operation. You start face detection by calling which returns a job identifier (JobId). When the face detection operation finishes, Amazon Rekognition Video publishes a completion status to the Amazon Simple Notification Service topic registered in the initial call to StartFaceDetection. To get the results of the face detection operation, first check that the status value published to the Amazon SNS topic is SUCCEEDED. If so, call and pass the job identifier (JobId) from the initial call to StartFaceDetection.  GetFaceDetection returns an array of detected faces (Faces) sorted by the time the faces were detected.  Use MaxResults parameter to limit the number of labels returned. If there are more results than specified in MaxResults, the value of NextToken in the operation response contains a pagination token for getting the next set of results. To get the next page of results, call GetFaceDetection and populate the NextToken request parameter with the token value returned from the previous call to GetFaceDetection.
   */
  getFaceDetection(params: Rekognition.Types.GetFaceDetectionRequest, callback?: (err: AWSError, data: Rekognition.Types.GetFaceDetectionResponse) => void): Request<Rekognition.Types.GetFaceDetectionResponse, AWSError>;
  /**
   * Gets face detection results for a Amazon Rekognition Video analysis started by . Face detection with Amazon Rekognition Video is an asynchronous operation. You start face detection by calling which returns a job identifier (JobId). When the face detection operation finishes, Amazon Rekognition Video publishes a completion status to the Amazon Simple Notification Service topic registered in the initial call to StartFaceDetection. To get the results of the face detection operation, first check that the status value published to the Amazon SNS topic is SUCCEEDED. If so, call and pass the job identifier (JobId) from the initial call to StartFaceDetection.  GetFaceDetection returns an array of detected faces (Faces) sorted by the time the faces were detected.  Use MaxResults parameter to limit the number of labels returned. If there are more results than specified in MaxResults, the value of NextToken in the operation response contains a pagination token for getting the next set of results. To get the next page of results, call GetFaceDetection and populate the NextToken request parameter with the token value returned from the previous call to GetFaceDetection.
   */
  getFaceDetection(callback?: (err: AWSError, data: Rekognition.Types.GetFaceDetectionResponse) => void): Request<Rekognition.Types.GetFaceDetectionResponse, AWSError>;
  /**
   * Gets the face search results for Amazon Rekognition Video face search started by . The search returns faces in a collection that match the faces of persons detected in a video. It also includes the time(s) that faces are matched in the video. Face search in a video is an asynchronous operation. You start face search by calling to which returns a job identifier (JobId). When the search operation finishes, Amazon Rekognition Video publishes a completion status to the Amazon Simple Notification Service topic registered in the initial call to StartFaceSearch. To get the search results, first check that the status value published to the Amazon SNS topic is SUCCEEDED. If so, call GetFaceSearch and pass the job identifier (JobId) from the initial call to StartFaceSearch. For more information, see Searching Faces in a Collection in the Amazon Rekognition Developer Guide. The search results are retured in an array, Persons, of objects. EachPersonMatch element contains details about the matching faces in the input collection, person information (facial attributes, bounding boxes, and person identifer) for the matched person, and the time the person was matched in the video.   GetFaceSearch only returns the default facial attributes (BoundingBox, Confidence, Landmarks, Pose, and Quality). The other facial attributes listed in the Face object of the following response syntax are not returned. For more information, see FaceDetail in the Amazon Rekognition Developer Guide.   By default, the Persons array is sorted by the time, in milliseconds from the start of the video, persons are matched. You can also sort by persons by specifying INDEX for the SORTBY input parameter.
   */
  getFaceSearch(params: Rekognition.Types.GetFaceSearchRequest, callback?: (err: AWSError, data: Rekognition.Types.GetFaceSearchResponse) => void): Request<Rekognition.Types.GetFaceSearchResponse, AWSError>;
  /**
   * Gets the face search results for Amazon Rekognition Video face search started by . The search returns faces in a collection that match the faces of persons detected in a video. It also includes the time(s) that faces are matched in the video. Face search in a video is an asynchronous operation. You start face search by calling to which returns a job identifier (JobId). When the search operation finishes, Amazon Rekognition Video publishes a completion status to the Amazon Simple Notification Service topic registered in the initial call to StartFaceSearch. To get the search results, first check that the status value published to the Amazon SNS topic is SUCCEEDED. If so, call GetFaceSearch and pass the job identifier (JobId) from the initial call to StartFaceSearch. For more information, see Searching Faces in a Collection in the Amazon Rekognition Developer Guide. The search results are retured in an array, Persons, of objects. EachPersonMatch element contains details about the matching faces in the input collection, person information (facial attributes, bounding boxes, and person identifer) for the matched person, and the time the person was matched in the video.   GetFaceSearch only returns the default facial attributes (BoundingBox, Confidence, Landmarks, Pose, and Quality). The other facial attributes listed in the Face object of the following response syntax are not returned. For more information, see FaceDetail in the Amazon Rekognition Developer Guide.   By default, the Persons array is sorted by the time, in milliseconds from the start of the video, persons are matched. You can also sort by persons by specifying INDEX for the SORTBY input parameter.
   */
  getFaceSearch(callback?: (err: AWSError, data: Rekognition.Types.GetFaceSearchResponse) => void): Request<Rekognition.Types.GetFaceSearchResponse, AWSError>;
  /**
   * Gets the label detection results of a Amazon Rekognition Video analysis started by .  The label detection operation is started by a call to which returns a job identifier (JobId). When the label detection operation finishes, Amazon Rekognition publishes a completion status to the Amazon Simple Notification Service topic registered in the initial call to StartlabelDetection. To get the results of the label detection operation, first check that the status value published to the Amazon SNS topic is SUCCEEDED. If so, call and pass the job identifier (JobId) from the initial call to StartLabelDetection.  GetLabelDetection returns an array of detected labels (Labels) sorted by the time the labels were detected. You can also sort by the label name by specifying NAME for the SortBy input parameter. The labels returned include the label name, the percentage confidence in the accuracy of the detected label, and the time the label was detected in the video. Use MaxResults parameter to limit the number of labels returned. If there are more results than specified in MaxResults, the value of NextToken in the operation response contains a pagination token for getting the next set of results. To get the next page of results, call GetlabelDetection and populate the NextToken request parameter with the token value returned from the previous call to GetLabelDetection.
   */
  getLabelDetection(params: Rekognition.Types.GetLabelDetectionRequest, callback?: (err: AWSError, data: Rekognition.Types.GetLabelDetectionResponse) => void): Request<Rekognition.Types.GetLabelDetectionResponse, AWSError>;
  /**
   * Gets the label detection results of a Amazon Rekognition Video analysis started by .  The label detection operation is started by a call to which returns a job identifier (JobId). When the label detection operation finishes, Amazon Rekognition publishes a completion status to the Amazon Simple Notification Service topic registered in the initial call to StartlabelDetection. To get the results of the label detection operation, first check that the status value published to the Amazon SNS topic is SUCCEEDED. If so, call and pass the job identifier (JobId) from the initial call to StartLabelDetection.  GetLabelDetection returns an array of detected labels (Labels) sorted by the time the labels were detected. You can also sort by the label name by specifying NAME for the SortBy input parameter. The labels returned include the label name, the percentage confidence in the accuracy of the detected label, and the time the label was detected in the video. Use MaxResults parameter to limit the number of labels returned. If there are more results than specified in MaxResults, the value of NextToken in the operation response contains a pagination token for getting the next set of results. To get the next page of results, call GetlabelDetection and populate the NextToken request parameter with the token value returned from the previous call to GetLabelDetection.
   */
  getLabelDetection(callback?: (err: AWSError, data: Rekognition.Types.GetLabelDetectionResponse) => void): Request<Rekognition.Types.GetLabelDetectionResponse, AWSError>;
  /**
   * Gets the person tracking results of a Amazon Rekognition Video analysis started by . The person detection operation is started by a call to StartPersonTracking which returns a job identifier (JobId). When the person detection operation finishes, Amazon Rekognition Video publishes a completion status to the Amazon Simple Notification Service topic registered in the initial call to StartPersonTracking. To get the results of the person tracking operation, first check that the status value published to the Amazon SNS topic is SUCCEEDED. If so, call and pass the job identifier (JobId) from the initial call to StartPersonTracking.  GetPersonTracking returns an array, Persons, of tracked persons and the time(s) they were tracked in the video.    GetPersonTracking only returns the default facial attributes (BoundingBox, Confidence, Landmarks, Pose, and Quality). The other facial attributes listed in the Face object of the following response syntax are not returned.  For more information, see FaceDetail in the Amazon Rekognition Developer Guide.  By default, the array is sorted by the time(s) a person is tracked in the video. You can sort by tracked persons by specifying INDEX for the SortBy input parameter. Use the MaxResults parameter to limit the number of items returned. If there are more results than specified in MaxResults, the value of NextToken in the operation response contains a pagination token for getting the next set of results. To get the next page of results, call GetPersonTracking and populate the NextToken request parameter with the token value returned from the previous call to GetPersonTracking.
   */
  getPersonTracking(params: Rekognition.Types.GetPersonTrackingRequest, callback?: (err: AWSError, data: Rekognition.Types.GetPersonTrackingResponse) => void): Request<Rekognition.Types.GetPersonTrackingResponse, AWSError>;
  /**
   * Gets the person tracking results of a Amazon Rekognition Video analysis started by . The person detection operation is started by a call to StartPersonTracking which returns a job identifier (JobId). When the person detection operation finishes, Amazon Rekognition Video publishes a completion status to the Amazon Simple Notification Service topic registered in the initial call to StartPersonTracking. To get the results of the person tracking operation, first check that the status value published to the Amazon SNS topic is SUCCEEDED. If so, call and pass the job identifier (JobId) from the initial call to StartPersonTracking.  GetPersonTracking returns an array, Persons, of tracked persons and the time(s) they were tracked in the video.    GetPersonTracking only returns the default facial attributes (BoundingBox, Confidence, Landmarks, Pose, and Quality). The other facial attributes listed in the Face object of the following response syntax are not returned.  For more information, see FaceDetail in the Amazon Rekognition Developer Guide.  By default, the array is sorted by the time(s) a person is tracked in the video. You can sort by tracked persons by specifying INDEX for the SortBy input parameter. Use the MaxResults parameter to limit the number of items returned. If there are more results than specified in MaxResults, the value of NextToken in the operation response contains a pagination token for getting the next set of results. To get the next page of results, call GetPersonTracking and populate the NextToken request parameter with the token value returned from the previous call to GetPersonTracking.
   */
  getPersonTracking(callback?: (err: AWSError, data: Rekognition.Types.GetPersonTrackingResponse) => void): Request<Rekognition.Types.GetPersonTrackingResponse, AWSError>;
  /**
   * Detects faces in the input image and adds them to the specified collection.  Amazon Rekognition doesn't save the actual faces that are detected. Instead, the underlying detection algorithm first detects the faces in the input image. For each face, the algorithm extracts facial features into a feature vector, and stores it in the backend database. Amazon Rekognition uses feature vectors when it performs face match and search operations using the and operations. For more information, see Adding Faces to a Collection in the Amazon Rekognition Developer Guide. To get the number of faces in a collection, call .  If you're using version 1.0 of the face detection model, IndexFaces indexes the 15 largest faces in the input image. Later versions of the face detection model index the 100 largest faces in the input image. To determine which version of the model you're using, call and supply the collection ID. You can also get the model version from the value of FaceModelVersion in the response from IndexFaces.  For more information, see Model Versioning in the Amazon Rekognition Developer Guide. If you provide the optional ExternalImageID for the input image you provided, Amazon Rekognition associates this ID with all faces that it detects. When you call the operation, the response returns the external ID. You can use this external image ID to create a client-side index to associate the faces with each image. You can then use the index to find all faces in an image. You can specify the maximum number of faces to index with the MaxFaces input parameter. This is useful when you want to index the largest faces in an image and don't want to index smaller faces, such as those belonging to people standing in the background. The QualityFilter input parameter allows you to filter out detected faces that don’t meet the required quality bar chosen by Amazon Rekognition. The quality bar is based on a variety of common use cases. By default, IndexFaces filters detected faces. You can also explicitly filter detected faces by specifying AUTO for the value of QualityFilter. If you do not want to filter detected faces, specify NONE.   To use quality filtering, you need a collection associated with version 3 of the face model. To get the version of the face model associated with a collection, call .   Information about faces detected in an image, but not indexed, is returned in an array of objects, UnindexedFaces. Faces aren't indexed for reasons such as:   The number of faces detected exceeds the value of the MaxFaces request parameter.   The face is too small compared to the image dimensions.   The face is too blurry.   The image is too dark.   The face has an extreme pose.   In response, the IndexFaces operation returns an array of metadata for all detected faces, FaceRecords. This includes:    The bounding box, BoundingBox, of the detected face.    A confidence value, Confidence, which indicates the confidence that the bounding box contains a face.   A face ID, faceId, assigned by the service for each face that's detected and stored.   An image ID, ImageId, assigned by the service for the input image.   If you request all facial attributes (by using the detectionAttributes parameter), Amazon Rekognition returns detailed facial attributes, such as facial landmarks (for example, location of eye and mouth) and other facial attributes like gender. If you provide the same image, specify the same collection, and use the same external ID in the IndexFaces operation, Amazon Rekognition doesn't save duplicate face metadata.  The input image is passed either as base64-encoded image bytes, or as a reference to an image in an Amazon S3 bucket. If you use the AWS CLI to call Amazon Rekognition operations, passing image bytes isn't supported. The image must be formatted as a PNG or JPEG file.  This operation requires permissions to perform the rekognition:IndexFaces action.
   */
  indexFaces(params: Rekognition.Types.IndexFacesRequest, callback?: (err: AWSError, data: Rekognition.Types.IndexFacesResponse) => void): Request<Rekognition.Types.IndexFacesResponse, AWSError>;
  /**
   * Detects faces in the input image and adds them to the specified collection.  Amazon Rekognition doesn't save the actual faces that are detected. Instead, the underlying detection algorithm first detects the faces in the input image. For each face, the algorithm extracts facial features into a feature vector, and stores it in the backend database. Amazon Rekognition uses feature vectors when it performs face match and search operations using the and operations. For more information, see Adding Faces to a Collection in the Amazon Rekognition Developer Guide. To get the number of faces in a collection, call .  If you're using version 1.0 of the face detection model, IndexFaces indexes the 15 largest faces in the input image. Later versions of the face detection model index the 100 largest faces in the input image. To determine which version of the model you're using, call and supply the collection ID. You can also get the model version from the value of FaceModelVersion in the response from IndexFaces.  For more information, see Model Versioning in the Amazon Rekognition Developer Guide. If you provide the optional ExternalImageID for the input image you provided, Amazon Rekognition associates this ID with all faces that it detects. When you call the operation, the response returns the external ID. You can use this external image ID to create a client-side index to associate the faces with each image. You can then use the index to find all faces in an image. You can specify the maximum number of faces to index with the MaxFaces input parameter. This is useful when you want to index the largest faces in an image and don't want to index smaller faces, such as those belonging to people standing in the background. The QualityFilter input parameter allows you to filter out detected faces that don’t meet the required quality bar chosen by Amazon Rekognition. The quality bar is based on a variety of common use cases. By default, IndexFaces filters detected faces. You can also explicitly filter detected faces by specifying AUTO for the value of QualityFilter. If you do not want to filter detected faces, specify NONE.   To use quality filtering, you need a collection associated with version 3 of the face model. To get the version of the face model associated with a collection, call .   Information about faces detected in an image, but not indexed, is returned in an array of objects, UnindexedFaces. Faces aren't indexed for reasons such as:   The number of faces detected exceeds the value of the MaxFaces request parameter.   The face is too small compared to the image dimensions.   The face is too blurry.   The image is too dark.   The face has an extreme pose.   In response, the IndexFaces operation returns an array of metadata for all detected faces, FaceRecords. This includes:    The bounding box, BoundingBox, of the detected face.    A confidence value, Confidence, which indicates the confidence that the bounding box contains a face.   A face ID, faceId, assigned by the service for each face that's detected and stored.   An image ID, ImageId, assigned by the service for the input image.   If you request all facial attributes (by using the detectionAttributes parameter), Amazon Rekognition returns detailed facial attributes, such as facial landmarks (for example, location of eye and mouth) and other facial attributes like gender. If you provide the same image, specify the same collection, and use the same external ID in the IndexFaces operation, Amazon Rekognition doesn't save duplicate face metadata.  The input image is passed either as base64-encoded image bytes, or as a reference to an image in an Amazon S3 bucket. If you use the AWS CLI to call Amazon Rekognition operations, passing image bytes isn't supported. The image must be formatted as a PNG or JPEG file.  This operation requires permissions to perform the rekognition:IndexFaces action.
   */
  indexFaces(callback?: (err: AWSError, data: Rekognition.Types.IndexFacesResponse) => void): Request<Rekognition.Types.IndexFacesResponse, AWSError>;
  /**
   * Returns list of collection IDs in your account. If the result is truncated, the response also provides a NextToken that you can use in the subsequent request to fetch the next set of collection IDs. For an example, see Listing Collections in the Amazon Rekognition Developer Guide. This operation requires permissions to perform the rekognition:ListCollections action.
   */
  listCollections(params: Rekognition.Types.ListCollectionsRequest, callback?: (err: AWSError, data: Rekognition.Types.ListCollectionsResponse) => void): Request<Rekognition.Types.ListCollectionsResponse, AWSError>;
  /**
   * Returns list of collection IDs in your account. If the result is truncated, the response also provides a NextToken that you can use in the subsequent request to fetch the next set of collection IDs. For an example, see Listing Collections in the Amazon Rekognition Developer Guide. This operation requires permissions to perform the rekognition:ListCollections action.
   */
  listCollections(callback?: (err: AWSError, data: Rekognition.Types.ListCollectionsResponse) => void): Request<Rekognition.Types.ListCollectionsResponse, AWSError>;
  /**
   * Returns metadata for faces in the specified collection. This metadata includes information such as the bounding box coordinates, the confidence (that the bounding box contains a face), and face ID. For an example, see Listing Faces in a Collection in the Amazon Rekognition Developer Guide. This operation requires permissions to perform the rekognition:ListFaces action.
   */
  listFaces(params: Rekognition.Types.ListFacesRequest, callback?: (err: AWSError, data: Rekognition.Types.ListFacesResponse) => void): Request<Rekognition.Types.ListFacesResponse, AWSError>;
  /**
   * Returns metadata for faces in the specified collection. This metadata includes information such as the bounding box coordinates, the confidence (that the bounding box contains a face), and face ID. For an example, see Listing Faces in a Collection in the Amazon Rekognition Developer Guide. This operation requires permissions to perform the rekognition:ListFaces action.
   */
  listFaces(callback?: (err: AWSError, data: Rekognition.Types.ListFacesResponse) => void): Request<Rekognition.Types.ListFacesResponse, AWSError>;
  /**
   * Gets a list of stream processors that you have created with . 
   */
  listStreamProcessors(params: Rekognition.Types.ListStreamProcessorsRequest, callback?: (err: AWSError, data: Rekognition.Types.ListStreamProcessorsResponse) => void): Request<Rekognition.Types.ListStreamProcessorsResponse, AWSError>;
  /**
   * Gets a list of stream processors that you have created with . 
   */
  listStreamProcessors(callback?: (err: AWSError, data: Rekognition.Types.ListStreamProcessorsResponse) => void): Request<Rekognition.Types.ListStreamProcessorsResponse, AWSError>;
  /**
   * Returns an array of celebrities recognized in the input image. For more information, see Recognizing Celebrities in the Amazon Rekognition Developer Guide.   RecognizeCelebrities returns the 100 largest faces in the image. It lists recognized celebrities in the CelebrityFaces array and unrecognized faces in the UnrecognizedFaces array. RecognizeCelebrities doesn't return celebrities whose faces aren't among the largest 100 faces in the image. For each celebrity recognized, RecognizeCelebrities returns a Celebrity object. The Celebrity object contains the celebrity name, ID, URL links to additional information, match confidence, and a ComparedFace object that you can use to locate the celebrity's face on the image. Amazon Rekognition doesn't retain information about which images a celebrity has been recognized in. Your application must store this information and use the Celebrity ID property as a unique identifier for the celebrity. If you don't store the celebrity name or additional information URLs returned by RecognizeCelebrities, you will need the ID to identify the celebrity in a call to the operation. You pass the input image either as base64-encoded image bytes or as a reference to an image in an Amazon S3 bucket. If you use the AWS CLI to call Amazon Rekognition operations, passing image bytes is not supported. The image must be either a PNG or JPEG formatted file.  For an example, see Recognizing Celebrities in an Image in the Amazon Rekognition Developer Guide. This operation requires permissions to perform the rekognition:RecognizeCelebrities operation.
   */
  recognizeCelebrities(params: Rekognition.Types.RecognizeCelebritiesRequest, callback?: (err: AWSError, data: Rekognition.Types.RecognizeCelebritiesResponse) => void): Request<Rekognition.Types.RecognizeCelebritiesResponse, AWSError>;
  /**
   * Returns an array of celebrities recognized in the input image. For more information, see Recognizing Celebrities in the Amazon Rekognition Developer Guide.   RecognizeCelebrities returns the 100 largest faces in the image. It lists recognized celebrities in the CelebrityFaces array and unrecognized faces in the UnrecognizedFaces array. RecognizeCelebrities doesn't return celebrities whose faces aren't among the largest 100 faces in the image. For each celebrity recognized, RecognizeCelebrities returns a Celebrity object. The Celebrity object contains the celebrity name, ID, URL links to additional information, match confidence, and a ComparedFace object that you can use to locate the celebrity's face on the image. Amazon Rekognition doesn't retain information about which images a celebrity has been recognized in. Your application must store this information and use the Celebrity ID property as a unique identifier for the celebrity. If you don't store the celebrity name or additional information URLs returned by RecognizeCelebrities, you will need the ID to identify the celebrity in a call to the operation. You pass the input image either as base64-encoded image bytes or as a reference to an image in an Amazon S3 bucket. If you use the AWS CLI to call Amazon Rekognition operations, passing image bytes is not supported. The image must be either a PNG or JPEG formatted file.  For an example, see Recognizing Celebrities in an Image in the Amazon Rekognition Developer Guide. This operation requires permissions to perform the rekognition:RecognizeCelebrities operation.
   */
  recognizeCelebrities(callback?: (err: AWSError, data: Rekognition.Types.RecognizeCelebritiesResponse) => void): Request<Rekognition.Types.RecognizeCelebritiesResponse, AWSError>;
  /**
   * For a given input face ID, searches for matching faces in the collection the face belongs to. You get a face ID when you add a face to the collection using the IndexFaces operation. The operation compares the features of the input face with faces in the specified collection.   You can also search faces without indexing faces by using the SearchFacesByImage operation.   The operation response returns an array of faces that match, ordered by similarity score with the highest similarity first. More specifically, it is an array of metadata for each face match that is found. Along with the metadata, the response also includes a confidence value for each face match, indicating the confidence that the specific face matches the input face.  For an example, see Searching for a Face Using Its Face ID in the Amazon Rekognition Developer Guide. This operation requires permissions to perform the rekognition:SearchFaces action.
   */
  searchFaces(params: Rekognition.Types.SearchFacesRequest, callback?: (err: AWSError, data: Rekognition.Types.SearchFacesResponse) => void): Request<Rekognition.Types.SearchFacesResponse, AWSError>;
  /**
   * For a given input face ID, searches for matching faces in the collection the face belongs to. You get a face ID when you add a face to the collection using the IndexFaces operation. The operation compares the features of the input face with faces in the specified collection.   You can also search faces without indexing faces by using the SearchFacesByImage operation.   The operation response returns an array of faces that match, ordered by similarity score with the highest similarity first. More specifically, it is an array of metadata for each face match that is found. Along with the metadata, the response also includes a confidence value for each face match, indicating the confidence that the specific face matches the input face.  For an example, see Searching for a Face Using Its Face ID in the Amazon Rekognition Developer Guide. This operation requires permissions to perform the rekognition:SearchFaces action.
   */
  searchFaces(callback?: (err: AWSError, data: Rekognition.Types.SearchFacesResponse) => void): Request<Rekognition.Types.SearchFacesResponse, AWSError>;
  /**
   * For a given input image, first detects the largest face in the image, and then searches the specified collection for matching faces. The operation compares the features of the input face with faces in the specified collection.   To search for all faces in an input image, you might first call the operation, and then use the face IDs returned in subsequent calls to the operation.   You can also call the DetectFaces operation and use the bounding boxes in the response to make face crops, which then you can pass in to the SearchFacesByImage operation.   You pass the input image either as base64-encoded image bytes or as a reference to an image in an Amazon S3 bucket. If you use the AWS CLI to call Amazon Rekognition operations, passing image bytes is not supported. The image must be either a PNG or JPEG formatted file.   The response returns an array of faces that match, ordered by similarity score with the highest similarity first. More specifically, it is an array of metadata for each face match found. Along with the metadata, the response also includes a similarity indicating how similar the face is to the input face. In the response, the operation also returns the bounding box (and a confidence level that the bounding box contains a face) of the face that Amazon Rekognition used for the input image.  For an example, Searching for a Face Using an Image in the Amazon Rekognition Developer Guide. This operation requires permissions to perform the rekognition:SearchFacesByImage action.
   */
  searchFacesByImage(params: Rekognition.Types.SearchFacesByImageRequest, callback?: (err: AWSError, data: Rekognition.Types.SearchFacesByImageResponse) => void): Request<Rekognition.Types.SearchFacesByImageResponse, AWSError>;
  /**
   * For a given input image, first detects the largest face in the image, and then searches the specified collection for matching faces. The operation compares the features of the input face with faces in the specified collection.   To search for all faces in an input image, you might first call the operation, and then use the face IDs returned in subsequent calls to the operation.   You can also call the DetectFaces operation and use the bounding boxes in the response to make face crops, which then you can pass in to the SearchFacesByImage operation.   You pass the input image either as base64-encoded image bytes or as a reference to an image in an Amazon S3 bucket. If you use the AWS CLI to call Amazon Rekognition operations, passing image bytes is not supported. The image must be either a PNG or JPEG formatted file.   The response returns an array of faces that match, ordered by similarity score with the highest similarity first. More specifically, it is an array of metadata for each face match found. Along with the metadata, the response also includes a similarity indicating how similar the face is to the input face. In the response, the operation also returns the bounding box (and a confidence level that the bounding box contains a face) of the face that Amazon Rekognition used for the input image.  For an example, Searching for a Face Using an Image in the Amazon Rekognition Developer Guide. This operation requires permissions to perform the rekognition:SearchFacesByImage action.
   */
  searchFacesByImage(callback?: (err: AWSError, data: Rekognition.Types.SearchFacesByImageResponse) => void): Request<Rekognition.Types.SearchFacesByImageResponse, AWSError>;
  /**
   * Starts asynchronous recognition of celebrities in a stored video. Amazon Rekognition Video can detect celebrities in a video must be stored in an Amazon S3 bucket. Use Video to specify the bucket name and the filename of the video. StartCelebrityRecognition returns a job identifier (JobId) which you use to get the results of the analysis. When celebrity recognition analysis is finished, Amazon Rekognition Video publishes a completion status to the Amazon Simple Notification Service topic that you specify in NotificationChannel. To get the results of the celebrity recognition analysis, first check that the status value published to the Amazon SNS topic is SUCCEEDED. If so, call and pass the job identifier (JobId) from the initial call to StartCelebrityRecognition.  For more information, see Recognizing Celebrities in the Amazon Rekognition Developer Guide.
   */
  startCelebrityRecognition(params: Rekognition.Types.StartCelebrityRecognitionRequest, callback?: (err: AWSError, data: Rekognition.Types.StartCelebrityRecognitionResponse) => void): Request<Rekognition.Types.StartCelebrityRecognitionResponse, AWSError>;
  /**
   * Starts asynchronous recognition of celebrities in a stored video. Amazon Rekognition Video can detect celebrities in a video must be stored in an Amazon S3 bucket. Use Video to specify the bucket name and the filename of the video. StartCelebrityRecognition returns a job identifier (JobId) which you use to get the results of the analysis. When celebrity recognition analysis is finished, Amazon Rekognition Video publishes a completion status to the Amazon Simple Notification Service topic that you specify in NotificationChannel. To get the results of the celebrity recognition analysis, first check that the status value published to the Amazon SNS topic is SUCCEEDED. If so, call and pass the job identifier (JobId) from the initial call to StartCelebrityRecognition.  For more information, see Recognizing Celebrities in the Amazon Rekognition Developer Guide.
   */
  startCelebrityRecognition(callback?: (err: AWSError, data: Rekognition.Types.StartCelebrityRecognitionResponse) => void): Request<Rekognition.Types.StartCelebrityRecognitionResponse, AWSError>;
  /**
   *  Starts asynchronous detection of explicit or suggestive adult content in a stored video. Amazon Rekognition Video can moderate content in a video stored in an Amazon S3 bucket. Use Video to specify the bucket name and the filename of the video. StartContentModeration returns a job identifier (JobId) which you use to get the results of the analysis. When content moderation analysis is finished, Amazon Rekognition Video publishes a completion status to the Amazon Simple Notification Service topic that you specify in NotificationChannel. To get the results of the content moderation analysis, first check that the status value published to the Amazon SNS topic is SUCCEEDED. If so, call and pass the job identifier (JobId) from the initial call to StartContentModeration.  For more information, see Detecting Unsafe Content in the Amazon Rekognition Developer Guide.
   */
  startContentModeration(params: Rekognition.Types.StartContentModerationRequest, callback?: (err: AWSError, data: Rekognition.Types.StartContentModerationResponse) => void): Request<Rekognition.Types.StartContentModerationResponse, AWSError>;
  /**
   *  Starts asynchronous detection of explicit or suggestive adult content in a stored video. Amazon Rekognition Video can moderate content in a video stored in an Amazon S3 bucket. Use Video to specify the bucket name and the filename of the video. StartContentModeration returns a job identifier (JobId) which you use to get the results of the analysis. When content moderation analysis is finished, Amazon Rekognition Video publishes a completion status to the Amazon Simple Notification Service topic that you specify in NotificationChannel. To get the results of the content moderation analysis, first check that the status value published to the Amazon SNS topic is SUCCEEDED. If so, call and pass the job identifier (JobId) from the initial call to StartContentModeration.  For more information, see Detecting Unsafe Content in the Amazon Rekognition Developer Guide.
   */
  startContentModeration(callback?: (err: AWSError, data: Rekognition.Types.StartContentModerationResponse) => void): Request<Rekognition.Types.StartContentModerationResponse, AWSError>;
  /**
   * Starts asynchronous detection of faces in a stored video. Amazon Rekognition Video can detect faces in a video stored in an Amazon S3 bucket. Use Video to specify the bucket name and the filename of the video. StartFaceDetection returns a job identifier (JobId) that you use to get the results of the operation. When face detection is finished, Amazon Rekognition Video publishes a completion status to the Amazon Simple Notification Service topic that you specify in NotificationChannel. To get the results of the label detection operation, first check that the status value published to the Amazon SNS topic is SUCCEEDED. If so, call and pass the job identifier (JobId) from the initial call to StartFaceDetection. For more information, see Detecting Faces in a Stored Video in the Amazon Rekognition Developer Guide.
   */
  startFaceDetection(params: Rekognition.Types.StartFaceDetectionRequest, callback?: (err: AWSError, data: Rekognition.Types.StartFaceDetectionResponse) => void): Request<Rekognition.Types.StartFaceDetectionResponse, AWSError>;
  /**
   * Starts asynchronous detection of faces in a stored video. Amazon Rekognition Video can detect faces in a video stored in an Amazon S3 bucket. Use Video to specify the bucket name and the filename of the video. StartFaceDetection returns a job identifier (JobId) that you use to get the results of the operation. When face detection is finished, Amazon Rekognition Video publishes a completion status to the Amazon Simple Notification Service topic that you specify in NotificationChannel. To get the results of the label detection operation, first check that the status value published to the Amazon SNS topic is SUCCEEDED. If so, call and pass the job identifier (JobId) from the initial call to StartFaceDetection. For more information, see Detecting Faces in a Stored Video in the Amazon Rekognition Developer Guide.
   */
  startFaceDetection(callback?: (err: AWSError, data: Rekognition.Types.StartFaceDetectionResponse) => void): Request<Rekognition.Types.StartFaceDetectionResponse, AWSError>;
  /**
   * Starts the asynchronous search for faces in a collection that match the faces of persons detected in a stored video. The video must be stored in an Amazon S3 bucket. Use Video to specify the bucket name and the filename of the video. StartFaceSearch returns a job identifier (JobId) which you use to get the search results once the search has completed. When searching is finished, Amazon Rekognition Video publishes a completion status to the Amazon Simple Notification Service topic that you specify in NotificationChannel. To get the search results, first check that the status value published to the Amazon SNS topic is SUCCEEDED. If so, call and pass the job identifier (JobId) from the initial call to StartFaceSearch. For more information, see procedure-person-search-videos.
   */
  startFaceSearch(params: Rekognition.Types.StartFaceSearchRequest, callback?: (err: AWSError, data: Rekognition.Types.StartFaceSearchResponse) => void): Request<Rekognition.Types.StartFaceSearchResponse, AWSError>;
  /**
   * Starts the asynchronous search for faces in a collection that match the faces of persons detected in a stored video. The video must be stored in an Amazon S3 bucket. Use Video to specify the bucket name and the filename of the video. StartFaceSearch returns a job identifier (JobId) which you use to get the search results once the search has completed. When searching is finished, Amazon Rekognition Video publishes a completion status to the Amazon Simple Notification Service topic that you specify in NotificationChannel. To get the search results, first check that the status value published to the Amazon SNS topic is SUCCEEDED. If so, call and pass the job identifier (JobId) from the initial call to StartFaceSearch. For more information, see procedure-person-search-videos.
   */
  startFaceSearch(callback?: (err: AWSError, data: Rekognition.Types.StartFaceSearchResponse) => void): Request<Rekognition.Types.StartFaceSearchResponse, AWSError>;
  /**
   * Starts asynchronous detection of labels in a stored video. Amazon Rekognition Video can detect labels in a video. Labels are instances of real-world entities. This includes objects like flower, tree, and table; events like wedding, graduation, and birthday party; concepts like landscape, evening, and nature; and activities like a person getting out of a car or a person skiing. The video must be stored in an Amazon S3 bucket. Use Video to specify the bucket name and the filename of the video. StartLabelDetection returns a job identifier (JobId) which you use to get the results of the operation. When label detection is finished, Amazon Rekognition Video publishes a completion status to the Amazon Simple Notification Service topic that you specify in NotificationChannel. To get the results of the label detection operation, first check that the status value published to the Amazon SNS topic is SUCCEEDED. If so, call and pass the job identifier (JobId) from the initial call to StartLabelDetection. 
   */
  startLabelDetection(params: Rekognition.Types.StartLabelDetectionRequest, callback?: (err: AWSError, data: Rekognition.Types.StartLabelDetectionResponse) => void): Request<Rekognition.Types.StartLabelDetectionResponse, AWSError>;
  /**
   * Starts asynchronous detection of labels in a stored video. Amazon Rekognition Video can detect labels in a video. Labels are instances of real-world entities. This includes objects like flower, tree, and table; events like wedding, graduation, and birthday party; concepts like landscape, evening, and nature; and activities like a person getting out of a car or a person skiing. The video must be stored in an Amazon S3 bucket. Use Video to specify the bucket name and the filename of the video. StartLabelDetection returns a job identifier (JobId) which you use to get the results of the operation. When label detection is finished, Amazon Rekognition Video publishes a completion status to the Amazon Simple Notification Service topic that you specify in NotificationChannel. To get the results of the label detection operation, first check that the status value published to the Amazon SNS topic is SUCCEEDED. If so, call and pass the job identifier (JobId) from the initial call to StartLabelDetection. 
   */
  startLabelDetection(callback?: (err: AWSError, data: Rekognition.Types.StartLabelDetectionResponse) => void): Request<Rekognition.Types.StartLabelDetectionResponse, AWSError>;
  /**
   * Starts the asynchronous tracking of persons in a stored video. Amazon Rekognition Video can track persons in a video stored in an Amazon S3 bucket. Use Video to specify the bucket name and the filename of the video. StartPersonTracking returns a job identifier (JobId) which you use to get the results of the operation. When label detection is finished, Amazon Rekognition publishes a completion status to the Amazon Simple Notification Service topic that you specify in NotificationChannel.  To get the results of the person detection operation, first check that the status value published to the Amazon SNS topic is SUCCEEDED. If so, call and pass the job identifier (JobId) from the initial call to StartPersonTracking.
   */
  startPersonTracking(params: Rekognition.Types.StartPersonTrackingRequest, callback?: (err: AWSError, data: Rekognition.Types.StartPersonTrackingResponse) => void): Request<Rekognition.Types.StartPersonTrackingResponse, AWSError>;
  /**
   * Starts the asynchronous tracking of persons in a stored video. Amazon Rekognition Video can track persons in a video stored in an Amazon S3 bucket. Use Video to specify the bucket name and the filename of the video. StartPersonTracking returns a job identifier (JobId) which you use to get the results of the operation. When label detection is finished, Amazon Rekognition publishes a completion status to the Amazon Simple Notification Service topic that you specify in NotificationChannel.  To get the results of the person detection operation, first check that the status value published to the Amazon SNS topic is SUCCEEDED. If so, call and pass the job identifier (JobId) from the initial call to StartPersonTracking.
   */
  startPersonTracking(callback?: (err: AWSError, data: Rekognition.Types.StartPersonTrackingResponse) => void): Request<Rekognition.Types.StartPersonTrackingResponse, AWSError>;
  /**
   * Starts processing a stream processor. You create a stream processor by calling . To tell StartStreamProcessor which stream processor to start, use the value of the Name field specified in the call to CreateStreamProcessor.
   */
  startStreamProcessor(params: Rekognition.Types.StartStreamProcessorRequest, callback?: (err: AWSError, data: Rekognition.Types.StartStreamProcessorResponse) => void): Request<Rekognition.Types.StartStreamProcessorResponse, AWSError>;
  /**
   * Starts processing a stream processor. You create a stream processor by calling . To tell StartStreamProcessor which stream processor to start, use the value of the Name field specified in the call to CreateStreamProcessor.
   */
  startStreamProcessor(callback?: (err: AWSError, data: Rekognition.Types.StartStreamProcessorResponse) => void): Request<Rekognition.Types.StartStreamProcessorResponse, AWSError>;
  /**
   * Stops a running stream processor that was created by .
   */
  stopStreamProcessor(params: Rekognition.Types.StopStreamProcessorRequest, callback?: (err: AWSError, data: Rekognition.Types.StopStreamProcessorResponse) => void): Request<Rekognition.Types.StopStreamProcessorResponse, AWSError>;
  /**
   * Stops a running stream processor that was created by .
   */
  stopStreamProcessor(callback?: (err: AWSError, data: Rekognition.Types.StopStreamProcessorResponse) => void): Request<Rekognition.Types.StopStreamProcessorResponse, AWSError>;
}
declare namespace Rekognition {
  export interface AgeRange {
    /**
     * The lowest estimated age.
     */
    Low?: UInteger;
    /**
     * The highest estimated age.
     */
    High?: UInteger;
  }
  export type Attribute = "DEFAULT"|"ALL"|string;
  export type Attributes = Attribute[];
  export interface Beard {
    /**
     * Boolean value that indicates whether the face has beard or not.
     */
    Value?: Boolean;
    /**
     * Level of confidence in the determination.
     */
    Confidence?: Percent;
  }
  export type Boolean = boolean;
  export interface BoundingBox {
    /**
     * Width of the bounding box as a ratio of the overall image width.
     */
    Width?: Float;
    /**
     * Height of the bounding box as a ratio of the overall image height.
     */
    Height?: Float;
    /**
     * Left coordinate of the bounding box as a ratio of overall image width.
     */
    Left?: Float;
    /**
     * Top coordinate of the bounding box as a ratio of overall image height.
     */
    Top?: Float;
  }
  export interface Celebrity {
    /**
     * An array of URLs pointing to additional information about the celebrity. If there is no additional information about the celebrity, this list is empty.
     */
    Urls?: Urls;
    /**
     * The name of the celebrity.
     */
    Name?: String;
    /**
     * A unique identifier for the celebrity. 
     */
    Id?: RekognitionUniqueId;
    /**
     * Provides information about the celebrity's face, such as its location on the image.
     */
    Face?: ComparedFace;
    /**
     * The confidence, in percentage, that Amazon Rekognition has that the recognized face is the celebrity.
     */
    MatchConfidence?: Percent;
  }
  export interface CelebrityDetail {
    /**
     * An array of URLs pointing to additional celebrity information. 
     */
    Urls?: Urls;
    /**
     * The name of the celebrity.
     */
    Name?: String;
    /**
     * The unique identifier for the celebrity. 
     */
    Id?: RekognitionUniqueId;
    /**
     * The confidence, in percentage, that Amazon Rekognition has that the recognized face is the celebrity. 
     */
    Confidence?: Percent;
    /**
     * Bounding box around the body of a celebrity.
     */
    BoundingBox?: BoundingBox;
    /**
     * Face details for the recognized celebrity.
     */
    Face?: FaceDetail;
  }
  export type CelebrityList = Celebrity[];
  export interface CelebrityRecognition {
    /**
     * The time, in milliseconds from the start of the video, that the celebrity was recognized.
     */
    Timestamp?: Timestamp;
    /**
     * Information about a recognized celebrity.
     */
    Celebrity?: CelebrityDetail;
  }
  export type CelebrityRecognitionSortBy = "ID"|"TIMESTAMP"|string;
  export type CelebrityRecognitions = CelebrityRecognition[];
  export type ClientRequestToken = string;
  export type CollectionId = string;
  export type CollectionIdList = CollectionId[];
  export interface CompareFacesMatch {
    /**
     * Level of confidence that the faces match.
     */
    Similarity?: Percent;
    /**
     * Provides face metadata (bounding box and confidence that the bounding box actually contains a face).
     */
    Face?: ComparedFace;
  }
  export type CompareFacesMatchList = CompareFacesMatch[];
  export interface CompareFacesRequest {
    /**
     * The input image as base64-encoded bytes or an S3 object. If you use the AWS CLI to call Amazon Rekognition operations, passing base64-encoded image bytes is not supported. 
     */
    SourceImage: Image;
    /**
     * The target image as base64-encoded bytes or an S3 object. If you use the AWS CLI to call Amazon Rekognition operations, passing base64-encoded image bytes is not supported. 
     */
    TargetImage: Image;
    /**
     * The minimum level of confidence in the face matches that a match must meet to be included in the FaceMatches array.
     */
    SimilarityThreshold?: Percent;
  }
  export interface CompareFacesResponse {
    /**
     * The face in the source image that was used for comparison.
     */
    SourceImageFace?: ComparedSourceImageFace;
    /**
     * An array of faces in the target image that match the source image face. Each CompareFacesMatch object provides the bounding box, the confidence level that the bounding box contains a face, and the similarity score for the face in the bounding box and the face in the source image.
     */
    FaceMatches?: CompareFacesMatchList;
    /**
     * An array of faces in the target image that did not match the source image face.
     */
    UnmatchedFaces?: CompareFacesUnmatchList;
    /**
     *  The orientation of the source image (counterclockwise direction). If your application displays the source image, you can use this value to correct image orientation. The bounding box coordinates returned in SourceImageFace represent the location of the face before the image orientation is corrected.   If the source image is in .jpeg format, it might contain exchangeable image (Exif) metadata that includes the image's orientation. If the Exif metadata for the source image populates the orientation field, the value of OrientationCorrection is null. The SourceImageFace bounding box coordinates represent the location of the face after Exif metadata is used to correct the orientation. Images in .png format don't contain Exif metadata. 
     */
    SourceImageOrientationCorrection?: OrientationCorrection;
    /**
     *  The orientation of the target image (in counterclockwise direction). If your application displays the target image, you can use this value to correct the orientation of the image. The bounding box coordinates returned in FaceMatches and UnmatchedFaces represent face locations before the image orientation is corrected.   If the target image is in .jpg format, it might contain Exif metadata that includes the orientation of the image. If the Exif metadata for the target image populates the orientation field, the value of OrientationCorrection is null. The bounding box coordinates in FaceMatches and UnmatchedFaces represent the location of the face after Exif metadata is used to correct the orientation. Images in .png format don't contain Exif metadata. 
     */
    TargetImageOrientationCorrection?: OrientationCorrection;
  }
  export type CompareFacesUnmatchList = ComparedFace[];
  export interface ComparedFace {
    /**
     * Bounding box of the face.
     */
    BoundingBox?: BoundingBox;
    /**
     * Level of confidence that what the bounding box contains is a face.
     */
    Confidence?: Percent;
    /**
     * An array of facial landmarks.
     */
    Landmarks?: Landmarks;
    /**
     * Indicates the pose of the face as determined by its pitch, roll, and yaw.
     */
    Pose?: Pose;
    /**
     * Identifies face image brightness and sharpness. 
     */
    Quality?: ImageQuality;
  }
  export type ComparedFaceList = ComparedFace[];
  export interface ComparedSourceImageFace {
    /**
     * Bounding box of the face.
     */
    BoundingBox?: BoundingBox;
    /**
     * Confidence level that the selected bounding box contains a face.
     */
    Confidence?: Percent;
  }
  export interface ContentModerationDetection {
    /**
     * Time, in milliseconds from the beginning of the video, that the moderation label was detected.
     */
    Timestamp?: Timestamp;
    /**
     * The moderation label detected by in the stored video.
     */
    ModerationLabel?: ModerationLabel;
  }
  export type ContentModerationDetections = ContentModerationDetection[];
  export type ContentModerationSortBy = "NAME"|"TIMESTAMP"|string;
  export interface CreateCollectionRequest {
    /**
     * ID for the collection that you are creating.
     */
    CollectionId: CollectionId;
  }
  export interface CreateCollectionResponse {
    /**
     * HTTP status code indicating the result of the operation.
     */
    StatusCode?: UInteger;
    /**
     * Amazon Resource Name (ARN) of the collection. You can use this to manage permissions on your resources. 
     */
    CollectionArn?: String;
    /**
     * Version number of the face detection model associated with the collection you are creating.
     */
    FaceModelVersion?: String;
  }
  export interface CreateStreamProcessorRequest {
    /**
     * Kinesis video stream stream that provides the source streaming video. If you are using the AWS CLI, the parameter name is StreamProcessorInput.
     */
    Input: StreamProcessorInput;
    /**
     * Kinesis data stream stream to which Amazon Rekognition Video puts the analysis results. If you are using the AWS CLI, the parameter name is StreamProcessorOutput.
     */
    Output: StreamProcessorOutput;
    /**
     * An identifier you assign to the stream processor. You can use Name to manage the stream processor. For example, you can get the current status of the stream processor by calling . Name is idempotent. 
     */
    Name: StreamProcessorName;
    /**
     * Face recognition input parameters to be used by the stream processor. Includes the collection to use for face recognition and the face attributes to detect.
     */
    Settings: StreamProcessorSettings;
    /**
     * ARN of the IAM role that allows access to the stream processor.
     */
    RoleArn: RoleArn;
  }
  export interface CreateStreamProcessorResponse {
    /**
     * ARN for the newly create stream processor.
     */
    StreamProcessorArn?: StreamProcessorArn;
  }
  export type DateTime = Date;
  export type Degree = number;
  export interface DeleteCollectionRequest {
    /**
     * ID of the collection to delete.
     */
    CollectionId: CollectionId;
  }
  export interface DeleteCollectionResponse {
    /**
     * HTTP status code that indicates the result of the operation.
     */
    StatusCode?: UInteger;
  }
  export interface DeleteFacesRequest {
    /**
     * Collection from which to remove the specific faces.
     */
    CollectionId: CollectionId;
    /**
     * An array of face IDs to delete.
     */
    FaceIds: FaceIdList;
  }
  export interface DeleteFacesResponse {
    /**
     * An array of strings (face IDs) of the faces that were deleted.
     */
    DeletedFaces?: FaceIdList;
  }
  export interface DeleteStreamProcessorRequest {
    /**
     * The name of the stream processor you want to delete.
     */
    Name: StreamProcessorName;
  }
  export interface DeleteStreamProcessorResponse {
  }
  export interface DescribeCollectionRequest {
    /**
     * The ID of the collection to describe.
     */
    CollectionId: CollectionId;
  }
  export interface DescribeCollectionResponse {
    /**
     * The number of faces that are indexed into the collection. To index faces into a collection, use .
     */
    FaceCount?: ULong;
    /**
     * The version of the face model that's used by the collection for face detection. For more information, see Model Versioning in the Amazon Rekognition Developer Guide.
     */
    FaceModelVersion?: String;
    /**
     * The Amazon Resource Name (ARN) of the collection.
     */
    CollectionARN?: String;
    /**
     * The number of milliseconds since the Unix epoch time until the creation of the collection. The Unix epoch time is 00:00:00 Coordinated Universal Time (UTC), Thursday, 1 January 1970.
     */
    CreationTimestamp?: DateTime;
  }
  export interface DescribeStreamProcessorRequest {
    /**
     * Name of the stream processor for which you want information.
     */
    Name: StreamProcessorName;
  }
  export interface DescribeStreamProcessorResponse {
    /**
     * Name of the stream processor. 
     */
    Name?: StreamProcessorName;
    /**
     * ARN of the stream processor.
     */
    StreamProcessorArn?: StreamProcessorArn;
    /**
     * Current status of the stream processor.
     */
    Status?: StreamProcessorStatus;
    /**
     * Detailed status message about the stream processor.
     */
    StatusMessage?: String;
    /**
     * Date and time the stream processor was created
     */
    CreationTimestamp?: DateTime;
    /**
     * The time, in Unix format, the stream processor was last updated. For example, when the stream processor moves from a running state to a failed state, or when the user starts or stops the stream processor.
     */
    LastUpdateTimestamp?: DateTime;
    /**
     * Kinesis video stream that provides the source streaming video.
     */
    Input?: StreamProcessorInput;
    /**
     * Kinesis data stream to which Amazon Rekognition Video puts the analysis results.
     */
    Output?: StreamProcessorOutput;
    /**
     * ARN of the IAM role that allows access to the stream processor.
     */
    RoleArn?: RoleArn;
    /**
     * Face recognition input parameters that are being used by the stream processor. Includes the collection to use for face recognition and the face attributes to detect.
     */
    Settings?: StreamProcessorSettings;
  }
  export interface DetectFacesRequest {
    /**
     * The input image as base64-encoded bytes or an S3 object. If you use the AWS CLI to call Amazon Rekognition operations, passing base64-encoded image bytes is not supported. 
     */
    Image: Image;
    /**
     * An array of facial attributes you want to be returned. This can be the default list of attributes or all attributes. If you don't specify a value for Attributes or if you specify ["DEFAULT"], the API returns the following subset of facial attributes: BoundingBox, Confidence, Pose, Quality, and Landmarks. If you provide ["ALL"], all facial attributes are returned, but the operation takes longer to complete. If you provide both, ["ALL", "DEFAULT"], the service uses a logical AND operator to determine which attributes to return (in this case, all attributes). 
     */
    Attributes?: Attributes;
  }
  export interface DetectFacesResponse {
    /**
     * Details of each face found in the image. 
     */
    FaceDetails?: FaceDetailList;
    /**
     *  The orientation of the input image (counter-clockwise direction). If your application displays the image, you can use this value to correct image orientation. The bounding box coordinates returned in FaceDetails represent face locations before the image orientation is corrected.   If the input image is in .jpeg format, it might contain exchangeable image (Exif) metadata that includes the image's orientation. If so, and the Exif metadata for the input image populates the orientation field, the value of OrientationCorrection is null. The FaceDetails bounding box coordinates represent face locations after Exif metadata is used to correct the image orientation. Images in .png format don't contain Exif metadata. 
     */
    OrientationCorrection?: OrientationCorrection;
  }
  export interface DetectLabelsRequest {
    /**
     * The input image as base64-encoded bytes or an S3 object. If you use the AWS CLI to call Amazon Rekognition operations, passing base64-encoded image bytes is not supported. 
     */
    Image: Image;
    /**
     * Maximum number of labels you want the service to return in the response. The service returns the specified number of highest confidence labels. 
     */
    MaxLabels?: UInteger;
    /**
     * Specifies the minimum confidence level for the labels to return. Amazon Rekognition doesn't return any labels with confidence lower than this specified value. If MinConfidence is not specified, the operation returns labels with a confidence values greater than or equal to 50 percent.
     */
    MinConfidence?: Percent;
  }
  export interface DetectLabelsResponse {
    /**
     * An array of labels for the real-world objects detected. 
     */
    Labels?: Labels;
    /**
     *  The orientation of the input image (counter-clockwise direction). If your application displays the image, you can use this value to correct the orientation. If Amazon Rekognition detects that the input image was rotated (for example, by 90 degrees), it first corrects the orientation before detecting the labels.   If the input image Exif metadata populates the orientation field, Amazon Rekognition does not perform orientation correction and the value of OrientationCorrection will be null. 
     */
    OrientationCorrection?: OrientationCorrection;
  }
  export interface DetectModerationLabelsRequest {
    /**
     * The input image as base64-encoded bytes or an S3 object. If you use the AWS CLI to call Amazon Rekognition operations, passing base64-encoded image bytes is not supported. 
     */
    Image: Image;
    /**
     * Specifies the minimum confidence level for the labels to return. Amazon Rekognition doesn't return any labels with a confidence level lower than this specified value. If you don't specify MinConfidence, the operation returns labels with confidence values greater than or equal to 50 percent.
     */
    MinConfidence?: Percent;
  }
  export interface DetectModerationLabelsResponse {
    /**
     * Array of detected Moderation labels and the time, in millseconds from the start of the video, they were detected.
     */
    ModerationLabels?: ModerationLabels;
  }
  export interface DetectTextRequest {
    /**
     * The input image as base64-encoded bytes or an Amazon S3 object. If you use the AWS CLI to call Amazon Rekognition operations, you can't pass image bytes. 
     */
    Image: Image;
  }
  export interface DetectTextResponse {
    /**
     * An array of text that was detected in the input image.
     */
    TextDetections?: TextDetectionList;
  }
  export interface Emotion {
    /**
     * Type of emotion detected.
     */
    Type?: EmotionName;
    /**
     * Level of confidence in the determination.
     */
    Confidence?: Percent;
  }
  export type EmotionName = "HAPPY"|"SAD"|"ANGRY"|"CONFUSED"|"DISGUSTED"|"SURPRISED"|"CALM"|"UNKNOWN"|string;
  export type Emotions = Emotion[];
  export type ExternalImageId = string;
  export interface EyeOpen {
    /**
     * Boolean value that indicates whether the eyes on the face are open.
     */
    Value?: Boolean;
    /**
     * Level of confidence in the determination.
     */
    Confidence?: Percent;
  }
  export interface Eyeglasses {
    /**
     * Boolean value that indicates whether the face is wearing eye glasses or not.
     */
    Value?: Boolean;
    /**
     * Level of confidence in the determination.
     */
    Confidence?: Percent;
  }
  export interface Face {
    /**
     * Unique identifier that Amazon Rekognition assigns to the face.
     */
    FaceId?: FaceId;
    /**
     * Bounding box of the face.
     */
    BoundingBox?: BoundingBox;
    /**
     * Unique identifier that Amazon Rekognition assigns to the input image.
     */
    ImageId?: ImageId;
    /**
     * Identifier that you assign to all the faces in the input image.
     */
    ExternalImageId?: ExternalImageId;
    /**
     * Confidence level that the bounding box contains a face (and not a different object such as a tree).
     */
    Confidence?: Percent;
  }
  export type FaceAttributes = "DEFAULT"|"ALL"|string;
  export interface FaceDetail {
    /**
     * Bounding box of the face. Default attribute.
     */
    BoundingBox?: BoundingBox;
    /**
     * The estimated age range, in years, for the face. Low represents the lowest estimated age and High represents the highest estimated age.
     */
    AgeRange?: AgeRange;
    /**
     * Indicates whether or not the face is smiling, and the confidence level in the determination.
     */
    Smile?: Smile;
    /**
     * Indicates whether or not the face is wearing eye glasses, and the confidence level in the determination.
     */
    Eyeglasses?: Eyeglasses;
    /**
     * Indicates whether or not the face is wearing sunglasses, and the confidence level in the determination.
     */
    Sunglasses?: Sunglasses;
    /**
     * Gender of the face and the confidence level in the determination.
     */
    Gender?: Gender;
    /**
     * Indicates whether or not the face has a beard, and the confidence level in the determination.
     */
    Beard?: Beard;
    /**
     * Indicates whether or not the face has a mustache, and the confidence level in the determination.
     */
    Mustache?: Mustache;
    /**
     * Indicates whether or not the eyes on the face are open, and the confidence level in the determination.
     */
    EyesOpen?: EyeOpen;
    /**
     * Indicates whether or not the mouth on the face is open, and the confidence level in the determination.
     */
    MouthOpen?: MouthOpen;
    /**
     * The emotions detected on the face, and the confidence level in the determination. For example, HAPPY, SAD, and ANGRY. 
     */
    Emotions?: Emotions;
    /**
     * Indicates the location of landmarks on the face. Default attribute.
     */
    Landmarks?: Landmarks;
    /**
     * Indicates the pose of the face as determined by its pitch, roll, and yaw. Default attribute.
     */
    Pose?: Pose;
    /**
     * Identifies image brightness and sharpness. Default attribute.
     */
    Quality?: ImageQuality;
    /**
     * Confidence level that the bounding box contains a face (and not a different object such as a tree). Default attribute.
     */
    Confidence?: Percent;
  }
  export type FaceDetailList = FaceDetail[];
  export interface FaceDetection {
    /**
     * Time, in milliseconds from the start of the video, that the face was detected.
     */
    Timestamp?: Timestamp;
    /**
     * The face properties for the detected face.
     */
    Face?: FaceDetail;
  }
  export type FaceDetections = FaceDetection[];
  export type FaceId = string;
  export type FaceIdList = FaceId[];
  export type FaceList = Face[];
  export interface FaceMatch {
    /**
     * Confidence in the match of this face with the input face.
     */
    Similarity?: Percent;
    /**
     * Describes the face properties such as the bounding box, face ID, image ID of the source image, and external image ID that you assigned.
     */
    Face?: Face;
  }
  export type FaceMatchList = FaceMatch[];
  export type FaceModelVersionList = String[];
  export interface FaceRecord {
    /**
     * Describes the face properties such as the bounding box, face ID, image ID of the input image, and external image ID that you assigned. 
     */
    Face?: Face;
    /**
     * Structure containing attributes of the face that the algorithm detected.
     */
    FaceDetail?: FaceDetail;
  }
  export type FaceRecordList = FaceRecord[];
  export interface FaceSearchSettings {
    /**
     * The ID of a collection that contains faces that you want to search for.
     */
    CollectionId?: CollectionId;
    /**
     * Minimum face match confidence score that must be met to return a result for a recognized face. Default is 70. 0 is the lowest confidence. 100 is the highest confidence.
     */
    FaceMatchThreshold?: Percent;
  }
  export type FaceSearchSortBy = "INDEX"|"TIMESTAMP"|string;
  export type Float = number;
  export interface Gender {
    /**
     * Gender of the face.
     */
    Value?: GenderType;
    /**
     * Level of confidence in the determination.
     */
    Confidence?: Percent;
  }
  export type GenderType = "Male"|"Female"|string;
  export interface Geometry {
    /**
     * An axis-aligned coarse representation of the detected text's location on the image.
     */
    BoundingBox?: BoundingBox;
    /**
     * Within the bounding box, a fine-grained polygon around the detected text.
     */
    Polygon?: Polygon;
  }
  export interface GetCelebrityInfoRequest {
    /**
     * The ID for the celebrity. You get the celebrity ID from a call to the operation, which recognizes celebrities in an image. 
     */
    Id: RekognitionUniqueId;
  }
  export interface GetCelebrityInfoResponse {
    /**
     * An array of URLs pointing to additional celebrity information. 
     */
    Urls?: Urls;
    /**
     * The name of the celebrity.
     */
    Name?: String;
  }
  export interface GetCelebrityRecognitionRequest {
    /**
     * Job identifier for the required celebrity recognition analysis. You can get the job identifer from a call to StartCelebrityRecognition.
     */
    JobId: JobId;
    /**
     * Maximum number of results to return per paginated call. The largest value you can specify is 1000. If you specify a value greater than 1000, a maximum of 1000 results is returned. The default value is 1000.
     */
    MaxResults?: MaxResults;
    /**
     * If the previous response was incomplete (because there is more recognized celebrities to retrieve), Amazon Rekognition Video returns a pagination token in the response. You can use this pagination token to retrieve the next set of celebrities. 
     */
    NextToken?: PaginationToken;
    /**
     * Sort to use for celebrities returned in Celebrities field. Specify ID to sort by the celebrity identifier, specify TIMESTAMP to sort by the time the celebrity was recognized.
     */
    SortBy?: CelebrityRecognitionSortBy;
  }
  export interface GetCelebrityRecognitionResponse {
    /**
     * The current status of the celebrity recognition job.
     */
    JobStatus?: VideoJobStatus;
    /**
     * If the job fails, StatusMessage provides a descriptive error message.
     */
    StatusMessage?: StatusMessage;
    /**
     * Information about a video that Amazon Rekognition Video analyzed. Videometadata is returned in every page of paginated responses from a Amazon Rekognition Video operation.
     */
    VideoMetadata?: VideoMetadata;
    /**
     * If the response is truncated, Amazon Rekognition Video returns this token that you can use in the subsequent request to retrieve the next set of celebrities.
     */
    NextToken?: PaginationToken;
    /**
     * Array of celebrities recognized in the video.
     */
    Celebrities?: CelebrityRecognitions;
  }
  export interface GetContentModerationRequest {
    /**
     * The identifier for the content moderation job. Use JobId to identify the job in a subsequent call to GetContentModeration.
     */
    JobId: JobId;
    /**
     * Maximum number of results to return per paginated call. The largest value you can specify is 1000. If you specify a value greater than 1000, a maximum of 1000 results is returned. The default value is 1000.
     */
    MaxResults?: MaxResults;
    /**
     * If the previous response was incomplete (because there is more data to retrieve), Amazon Rekognition returns a pagination token in the response. You can use this pagination token to retrieve the next set of content moderation labels.
     */
    NextToken?: PaginationToken;
    /**
     * Sort to use for elements in the ModerationLabelDetections array. Use TIMESTAMP to sort array elements by the time labels are detected. Use NAME to alphabetically group elements for a label together. Within each label group, the array element are sorted by detection confidence. The default sort is by TIMESTAMP.
     */
    SortBy?: ContentModerationSortBy;
  }
  export interface GetContentModerationResponse {
    /**
     * The current status of the content moderation job.
     */
    JobStatus?: VideoJobStatus;
    /**
     * If the job fails, StatusMessage provides a descriptive error message.
     */
    StatusMessage?: StatusMessage;
    /**
     * Information about a video that Amazon Rekognition analyzed. Videometadata is returned in every page of paginated responses from GetContentModeration. 
     */
    VideoMetadata?: VideoMetadata;
    /**
     * The detected moderation labels and the time(s) they were detected.
     */
    ModerationLabels?: ContentModerationDetections;
    /**
     * If the response is truncated, Amazon Rekognition Video returns this token that you can use in the subsequent request to retrieve the next set of moderation labels. 
     */
    NextToken?: PaginationToken;
  }
  export interface GetFaceDetectionRequest {
    /**
     * Unique identifier for the face detection job. The JobId is returned from StartFaceDetection.
     */
    JobId: JobId;
    /**
     * Maximum number of results to return per paginated call. The largest value you can specify is 1000. If you specify a value greater than 1000, a maximum of 1000 results is returned. The default value is 1000.
     */
    MaxResults?: MaxResults;
    /**
     * If the previous response was incomplete (because there are more faces to retrieve), Amazon Rekognition Video returns a pagination token in the response. You can use this pagination token to retrieve the next set of faces.
     */
    NextToken?: PaginationToken;
  }
  export interface GetFaceDetectionResponse {
    /**
     * The current status of the face detection job.
     */
    JobStatus?: VideoJobStatus;
    /**
     * If the job fails, StatusMessage provides a descriptive error message.
     */
    StatusMessage?: StatusMessage;
    /**
     * Information about a video that Amazon Rekognition Video analyzed. Videometadata is returned in every page of paginated responses from a Amazon Rekognition video operation.
     */
    VideoMetadata?: VideoMetadata;
    /**
     * If the response is truncated, Amazon Rekognition returns this token that you can use in the subsequent request to retrieve the next set of faces. 
     */
    NextToken?: PaginationToken;
    /**
     * An array of faces detected in the video. Each element contains a detected face's details and the time, in milliseconds from the start of the video, the face was detected. 
     */
    Faces?: FaceDetections;
  }
  export interface GetFaceSearchRequest {
    /**
     * The job identifer for the search request. You get the job identifier from an initial call to StartFaceSearch.
     */
    JobId: JobId;
    /**
     * Maximum number of results to return per paginated call. The largest value you can specify is 1000. If you specify a value greater than 1000, a maximum of 1000 results is returned. The default value is 1000.
     */
    MaxResults?: MaxResults;
    /**
     * If the previous response was incomplete (because there is more search results to retrieve), Amazon Rekognition Video returns a pagination token in the response. You can use this pagination token to retrieve the next set of search results. 
     */
    NextToken?: PaginationToken;
    /**
     * Sort to use for grouping faces in the response. Use TIMESTAMP to group faces by the time that they are recognized. Use INDEX to sort by recognized faces. 
     */
    SortBy?: FaceSearchSortBy;
  }
  export interface GetFaceSearchResponse {
    /**
     * The current status of the face search job.
     */
    JobStatus?: VideoJobStatus;
    /**
     * If the job fails, StatusMessage provides a descriptive error message.
     */
    StatusMessage?: StatusMessage;
    /**
     * If the response is truncated, Amazon Rekognition Video returns this token that you can use in the subsequent request to retrieve the next set of search results. 
     */
    NextToken?: PaginationToken;
    /**
     * Information about a video that Amazon Rekognition analyzed. Videometadata is returned in every page of paginated responses from a Amazon Rekognition Video operation. 
     */
    VideoMetadata?: VideoMetadata;
    /**
     * An array of persons, , in the video whose face(s) match the face(s) in an Amazon Rekognition collection. It also includes time information for when persons are matched in the video. You specify the input collection in an initial call to StartFaceSearch. Each Persons element includes a time the person was matched, face match details (FaceMatches) for matching faces in the collection, and person information (Person) for the matched person. 
     */
    Persons?: PersonMatches;
  }
  export interface GetLabelDetectionRequest {
    /**
     * Job identifier for the label detection operation for which you want results returned. You get the job identifer from an initial call to StartlabelDetection.
     */
    JobId: JobId;
    /**
     * Maximum number of results to return per paginated call. The largest value you can specify is 1000. If you specify a value greater than 1000, a maximum of 1000 results is returned. The default value is 1000.
     */
    MaxResults?: MaxResults;
    /**
     * If the previous response was incomplete (because there are more labels to retrieve), Amazon Rekognition Video returns a pagination token in the response. You can use this pagination token to retrieve the next set of labels. 
     */
    NextToken?: PaginationToken;
    /**
     * Sort to use for elements in the Labels array. Use TIMESTAMP to sort array elements by the time labels are detected. Use NAME to alphabetically group elements for a label together. Within each label group, the array element are sorted by detection confidence. The default sort is by TIMESTAMP.
     */
    SortBy?: LabelDetectionSortBy;
  }
  export interface GetLabelDetectionResponse {
    /**
     * The current status of the label detection job.
     */
    JobStatus?: VideoJobStatus;
    /**
     * If the job fails, StatusMessage provides a descriptive error message.
     */
    StatusMessage?: StatusMessage;
    /**
     * Information about a video that Amazon Rekognition Video analyzed. Videometadata is returned in every page of paginated responses from a Amazon Rekognition video operation.
     */
    VideoMetadata?: VideoMetadata;
    /**
     * If the response is truncated, Amazon Rekognition Video returns this token that you can use in the subsequent request to retrieve the next set of labels.
     */
    NextToken?: PaginationToken;
    /**
     * An array of labels detected in the video. Each element contains the detected label and the time, in milliseconds from the start of the video, that the label was detected. 
     */
    Labels?: LabelDetections;
  }
  export interface GetPersonTrackingRequest {
    /**
     * The identifier for a job that tracks persons in a video. You get the JobId from a call to StartPersonTracking. 
     */
    JobId: JobId;
    /**
     * Maximum number of results to return per paginated call. The largest value you can specify is 1000. If you specify a value greater than 1000, a maximum of 1000 results is returned. The default value is 1000.
     */
    MaxResults?: MaxResults;
    /**
     * If the previous response was incomplete (because there are more persons to retrieve), Amazon Rekognition Video returns a pagination token in the response. You can use this pagination token to retrieve the next set of persons. 
     */
    NextToken?: PaginationToken;
    /**
     * Sort to use for elements in the Persons array. Use TIMESTAMP to sort array elements by the time persons are detected. Use INDEX to sort by the tracked persons. If you sort by INDEX, the array elements for each person are sorted by detection confidence. The default sort is by TIMESTAMP.
     */
    SortBy?: PersonTrackingSortBy;
  }
  export interface GetPersonTrackingResponse {
    /**
     * The current status of the person tracking job.
     */
    JobStatus?: VideoJobStatus;
    /**
     * If the job fails, StatusMessage provides a descriptive error message.
     */
    StatusMessage?: StatusMessage;
    /**
     * Information about a video that Amazon Rekognition Video analyzed. Videometadata is returned in every page of paginated responses from a Amazon Rekognition Video operation.
     */
    VideoMetadata?: VideoMetadata;
    /**
     * If the response is truncated, Amazon Rekognition Video returns this token that you can use in the subsequent request to retrieve the next set of persons. 
     */
    NextToken?: PaginationToken;
    /**
     * An array of the persons detected in the video and the times they are tracked throughout the video. An array element will exist for each time the person is tracked. 
     */
    Persons?: PersonDetections;
  }
  export interface Image {
    /**
     * Blob of image bytes up to 5 MBs.
     */
    Bytes?: ImageBlob;
    /**
     * Identifies an S3 object as the image source.
     */
    S3Object?: S3Object;
  }
  export type ImageBlob = Buffer|Uint8Array|Blob|string;
  export type ImageId = string;
  export interface ImageQuality {
    /**
     * Value representing brightness of the face. The service returns a value between 0 and 100 (inclusive). A higher value indicates a brighter face image.
     */
    Brightness?: Float;
    /**
     * Value representing sharpness of the face. The service returns a value between 0 and 100 (inclusive). A higher value indicates a sharper face image.
     */
    Sharpness?: Float;
  }
  export interface IndexFacesRequest {
    /**
     * The ID of an existing collection to which you want to add the faces that are detected in the input images.
     */
    CollectionId: CollectionId;
    /**
     * The input image as base64-encoded bytes or an S3 object. If you use the AWS CLI to call Amazon Rekognition operations, passing base64-encoded image bytes isn't supported. 
     */
    Image: Image;
    /**
     * The ID you want to assign to all the faces detected in the image.
     */
    ExternalImageId?: ExternalImageId;
    /**
     * An array of facial attributes that you want to be returned. This can be the default list of attributes or all attributes. If you don't specify a value for Attributes or if you specify ["DEFAULT"], the API returns the following subset of facial attributes: BoundingBox, Confidence, Pose, Quality, and Landmarks. If you provide ["ALL"], all facial attributes are returned, but the operation takes longer to complete. If you provide both, ["ALL", "DEFAULT"], the service uses a logical AND operator to determine which attributes to return (in this case, all attributes). 
     */
    DetectionAttributes?: Attributes;
    /**
     * The maximum number of faces to index. The value of MaxFaces must be greater than or equal to 1. IndexFaces returns no more than 100 detected faces in an image, even if you specify a larger value for MaxFaces. If IndexFaces detects more faces than the value of MaxFaces, the faces with the lowest quality are filtered out first. If there are still more faces than the value of MaxFaces, the faces with the smallest bounding boxes are filtered out (up to the number that's needed to satisfy the value of MaxFaces). Information about the unindexed faces is available in the UnindexedFaces array.  The faces that are returned by IndexFaces are sorted by the largest face bounding box size to the smallest size, in descending order.  MaxFaces can be used with a collection associated with any version of the face model.
     */
    MaxFaces?: MaxFacesToIndex;
    /**
     * A filter that specifies how much filtering is done to identify faces that are detected with low quality. Filtered faces aren't indexed. If you specify AUTO, filtering prioritizes the identification of faces that don’t meet the required quality bar chosen by Amazon Rekognition. The quality bar is based on a variety of common use cases. Low-quality detections can occur for a number of reasons. Some examples are an object that's misidentified as a face, a face that's too blurry, or a face with a pose that's too extreme to use. If you specify NONE, no filtering is performed. The default value is AUTO. To use quality filtering, the collection you are using must be associated with version 3 of the face model.
     */
    QualityFilter?: QualityFilter;
  }
  export interface IndexFacesResponse {
    /**
     * An array of faces detected and added to the collection. For more information, see Searching Faces in a Collection in the Amazon Rekognition Developer Guide. 
     */
    FaceRecords?: FaceRecordList;
    /**
     * The orientation of the input image (counterclockwise direction). If your application displays the image, you can use this value to correct image orientation. The bounding box coordinates returned in FaceRecords represent face locations before the image orientation is corrected.   If the input image is in jpeg format, it might contain exchangeable image (Exif) metadata. If so, and the Exif metadata populates the orientation field, the value of OrientationCorrection is null. The bounding box coordinates in FaceRecords represent face locations after Exif metadata is used to correct the image orientation. Images in .png format don't contain Exif metadata. 
     */
    OrientationCorrection?: OrientationCorrection;
    /**
     * The version number of the face detection model that's associated with the input collection (CollectionId).
     */
    FaceModelVersion?: String;
    /**
     * An array of faces that were detected in the image but weren't indexed. They weren't indexed because the quality filter identified them as low quality, or the MaxFaces request parameter filtered them out. To use the quality filter, you specify the QualityFilter request parameter.
     */
    UnindexedFaces?: UnindexedFaces;
  }
  export type JobId = string;
  export type JobTag = string;
  export type KinesisDataArn = string;
  export interface KinesisDataStream {
    /**
     * ARN of the output Amazon Kinesis Data Streams stream.
     */
    Arn?: KinesisDataArn;
  }
  export type KinesisVideoArn = string;
  export interface KinesisVideoStream {
    /**
     * ARN of the Kinesis video stream stream that streams the source video.
     */
    Arn?: KinesisVideoArn;
  }
  export interface Label {
    /**
     * The name (label) of the object.
     */
    Name?: String;
    /**
     * Level of confidence.
     */
    Confidence?: Percent;
  }
  export interface LabelDetection {
    /**
     * Time, in milliseconds from the start of the video, that the label was detected.
     */
    Timestamp?: Timestamp;
    /**
     * Details about the detected label.
     */
    Label?: Label;
  }
  export type LabelDetectionSortBy = "NAME"|"TIMESTAMP"|string;
  export type LabelDetections = LabelDetection[];
  export type Labels = Label[];
  export interface Landmark {
    /**
     * Type of landmark.
     */
    Type?: LandmarkType;
    /**
     * The x-coordinate from the top left of the landmark expressed as the ratio of the width of the image. For example, if the image is 700 x 200 and the x-coordinate of the landmark is at 350 pixels, this value is 0.5. 
     */
    X?: Float;
    /**
     * The y-coordinate from the top left of the landmark expressed as the ratio of the height of the image. For example, if the image is 700 x 200 and the y-coordinate of the landmark is at 100 pixels, this value is 0.5.
     */
    Y?: Float;
  }
  export type LandmarkType = "eyeLeft"|"eyeRight"|"nose"|"mouthLeft"|"mouthRight"|"leftEyeBrowLeft"|"leftEyeBrowRight"|"leftEyeBrowUp"|"rightEyeBrowLeft"|"rightEyeBrowRight"|"rightEyeBrowUp"|"leftEyeLeft"|"leftEyeRight"|"leftEyeUp"|"leftEyeDown"|"rightEyeLeft"|"rightEyeRight"|"rightEyeUp"|"rightEyeDown"|"noseLeft"|"noseRight"|"mouthUp"|"mouthDown"|"leftPupil"|"rightPupil"|string;
  export type Landmarks = Landmark[];
  export interface ListCollectionsRequest {
    /**
     * Pagination token from the previous response.
     */
    NextToken?: PaginationToken;
    /**
     * Maximum number of collection IDs to return. 
     */
    MaxResults?: PageSize;
  }
  export interface ListCollectionsResponse {
    /**
     * An array of collection IDs.
     */
    CollectionIds?: CollectionIdList;
    /**
     * If the result is truncated, the response provides a NextToken that you can use in the subsequent request to fetch the next set of collection IDs.
     */
    NextToken?: PaginationToken;
    /**
     * Version numbers of the face detection models associated with the collections in the array CollectionIds. For example, the value of FaceModelVersions[2] is the version number for the face detection model used by the collection in CollectionId[2].
     */
    FaceModelVersions?: FaceModelVersionList;
  }
  export interface ListFacesRequest {
    /**
     * ID of the collection from which to list the faces.
     */
    CollectionId: CollectionId;
    /**
     * If the previous response was incomplete (because there is more data to retrieve), Amazon Rekognition returns a pagination token in the response. You can use this pagination token to retrieve the next set of faces.
     */
    NextToken?: PaginationToken;
    /**
     * Maximum number of faces to return.
     */
    MaxResults?: PageSize;
  }
  export interface ListFacesResponse {
    /**
     * An array of Face objects. 
     */
    Faces?: FaceList;
    /**
     * If the response is truncated, Amazon Rekognition returns this token that you can use in the subsequent request to retrieve the next set of faces.
     */
    NextToken?: String;
    /**
     * Version number of the face detection model associated with the input collection (CollectionId).
     */
    FaceModelVersion?: String;
  }
  export interface ListStreamProcessorsRequest {
    /**
     * If the previous response was incomplete (because there are more stream processors to retrieve), Amazon Rekognition Video returns a pagination token in the response. You can use this pagination token to retrieve the next set of stream processors. 
     */
    NextToken?: PaginationToken;
    /**
     * Maximum number of stream processors you want Amazon Rekognition Video to return in the response. The default is 1000. 
     */
    MaxResults?: MaxResults;
  }
  export interface ListStreamProcessorsResponse {
    /**
     * If the response is truncated, Amazon Rekognition Video returns this token that you can use in the subsequent request to retrieve the next set of stream processors. 
     */
    NextToken?: PaginationToken;
    /**
     * List of stream processors that you have created.
     */
    StreamProcessors?: StreamProcessorList;
  }
  export type MaxFaces = number;
  export type MaxFacesToIndex = number;
  export type MaxResults = number;
  export interface ModerationLabel {
    /**
     * Specifies the confidence that Amazon Rekognition has that the label has been correctly identified. If you don't specify the MinConfidence parameter in the call to DetectModerationLabels, the operation returns labels with a confidence value greater than or equal to 50 percent.
     */
    Confidence?: Percent;
    /**
     * The label name for the type of content detected in the image.
     */
    Name?: String;
    /**
     * The name for the parent label. Labels at the top level of the hierarchy have the parent label "".
     */
    ParentName?: String;
  }
  export type ModerationLabels = ModerationLabel[];
  export interface MouthOpen {
    /**
     * Boolean value that indicates whether the mouth on the face is open or not.
     */
    Value?: Boolean;
    /**
     * Level of confidence in the determination.
     */
    Confidence?: Percent;
  }
  export interface Mustache {
    /**
     * Boolean value that indicates whether the face has mustache or not.
     */
    Value?: Boolean;
    /**
     * Level of confidence in the determination.
     */
    Confidence?: Percent;
  }
  export interface NotificationChannel {
    /**
     * The Amazon SNS topic to which Amazon Rekognition to posts the completion status.
     */
    SNSTopicArn: SNSTopicArn;
    /**
     * The ARN of an IAM role that gives Amazon Rekognition publishing permissions to the Amazon SNS topic. 
     */
    RoleArn: RoleArn;
  }
  export type OrientationCorrection = "ROTATE_0"|"ROTATE_90"|"ROTATE_180"|"ROTATE_270"|string;
  export type PageSize = number;
  export type PaginationToken = string;
  export type Percent = number;
  export interface PersonDetail {
    /**
     * Identifier for the person detected person within a video. Use to keep track of the person throughout the video. The identifier is not stored by Amazon Rekognition.
     */
    Index?: PersonIndex;
    /**
     * Bounding box around the detected person.
     */
    BoundingBox?: BoundingBox;
    /**
     * Face details for the detected person.
     */
    Face?: FaceDetail;
  }
  export interface PersonDetection {
    /**
     * The time, in milliseconds from the start of the video, that the person was tracked.
     */
    Timestamp?: Timestamp;
    /**
     * Details about a person tracked in a video.
     */
    Person?: PersonDetail;
  }
  export type PersonDetections = PersonDetection[];
  export type PersonIndex = number;
  export interface PersonMatch {
    /**
     * The time, in milliseconds from the beginning of the video, that the person was matched in the video.
     */
    Timestamp?: Timestamp;
    /**
     * Information about the matched person.
     */
    Person?: PersonDetail;
    /**
     * Information about the faces in the input collection that match the face of a person in the video.
     */
    FaceMatches?: FaceMatchList;
  }
  export type PersonMatches = PersonMatch[];
  export type PersonTrackingSortBy = "INDEX"|"TIMESTAMP"|string;
  export interface Point {
    /**
     * The value of the X coordinate for a point on a Polygon.
     */
    X?: Float;
    /**
     * The value of the Y coordinate for a point on a Polygon.
     */
    Y?: Float;
  }
  export type Polygon = Point[];
  export interface Pose {
    /**
     * Value representing the face rotation on the roll axis.
     */
    Roll?: Degree;
    /**
     * Value representing the face rotation on the yaw axis.
     */
    Yaw?: Degree;
    /**
     * Value representing the face rotation on the pitch axis.
     */
    Pitch?: Degree;
  }
  export type QualityFilter = "NONE"|"AUTO"|string;
  export type Reason = "EXCEEDS_MAX_FACES"|"EXTREME_POSE"|"LOW_BRIGHTNESS"|"LOW_SHARPNESS"|"LOW_CONFIDENCE"|"SMALL_BOUNDING_BOX"|string;
  export type Reasons = Reason[];
  export interface RecognizeCelebritiesRequest {
    /**
     * The input image as base64-encoded bytes or an S3 object. If you use the AWS CLI to call Amazon Rekognition operations, passing base64-encoded image bytes is not supported. 
     */
    Image: Image;
  }
  export interface RecognizeCelebritiesResponse {
    /**
     * Details about each celebrity found in the image. Amazon Rekognition can detect a maximum of 15 celebrities in an image.
     */
    CelebrityFaces?: CelebrityList;
    /**
     * Details about each unrecognized face in the image.
     */
    UnrecognizedFaces?: ComparedFaceList;
    /**
     * The orientation of the input image (counterclockwise direction). If your application displays the image, you can use this value to correct the orientation. The bounding box coordinates returned in CelebrityFaces and UnrecognizedFaces represent face locations before the image orientation is corrected.   If the input image is in .jpeg format, it might contain exchangeable image (Exif) metadata that includes the image's orientation. If so, and the Exif metadata for the input image populates the orientation field, the value of OrientationCorrection is null. The CelebrityFaces and UnrecognizedFaces bounding box coordinates represent face locations after Exif metadata is used to correct the image orientation. Images in .png format don't contain Exif metadata.  
     */
    OrientationCorrection?: OrientationCorrection;
  }
  export type RekognitionUniqueId = string;
  export type RoleArn = string;
  export type S3Bucket = string;
  export interface S3Object {
    /**
     * Name of the S3 bucket.
     */
    Bucket?: S3Bucket;
    /**
     * S3 object key name.
     */
    Name?: S3ObjectName;
    /**
     * If the bucket is versioning enabled, you can specify the object version. 
     */
    Version?: S3ObjectVersion;
  }
  export type S3ObjectName = string;
  export type S3ObjectVersion = string;
  export type SNSTopicArn = string;
  export interface SearchFacesByImageRequest {
    /**
     * ID of the collection to search.
     */
    CollectionId: CollectionId;
    /**
     * The input image as base64-encoded bytes or an S3 object. If you use the AWS CLI to call Amazon Rekognition operations, passing base64-encoded image bytes is not supported. 
     */
    Image: Image;
    /**
     * Maximum number of faces to return. The operation returns the maximum number of faces with the highest confidence in the match.
     */
    MaxFaces?: MaxFaces;
    /**
     * (Optional) Specifies the minimum confidence in the face match to return. For example, don't return any matches where confidence in matches is less than 70%.
     */
    FaceMatchThreshold?: Percent;
  }
  export interface SearchFacesByImageResponse {
    /**
     * The bounding box around the face in the input image that Amazon Rekognition used for the search.
     */
    SearchedFaceBoundingBox?: BoundingBox;
    /**
     * The level of confidence that the searchedFaceBoundingBox, contains a face.
     */
    SearchedFaceConfidence?: Percent;
    /**
     * An array of faces that match the input face, along with the confidence in the match.
     */
    FaceMatches?: FaceMatchList;
    /**
     * Version number of the face detection model associated with the input collection (CollectionId).
     */
    FaceModelVersion?: String;
  }
  export interface SearchFacesRequest {
    /**
     * ID of the collection the face belongs to.
     */
    CollectionId: CollectionId;
    /**
     * ID of a face to find matches for in the collection.
     */
    FaceId: FaceId;
    /**
     * Maximum number of faces to return. The operation returns the maximum number of faces with the highest confidence in the match.
     */
    MaxFaces?: MaxFaces;
    /**
     * Optional value specifying the minimum confidence in the face match to return. For example, don't return any matches where confidence in matches is less than 70%.
     */
    FaceMatchThreshold?: Percent;
  }
  export interface SearchFacesResponse {
    /**
     * ID of the face that was searched for matches in a collection.
     */
    SearchedFaceId?: FaceId;
    /**
     * An array of faces that matched the input face, along with the confidence in the match.
     */
    FaceMatches?: FaceMatchList;
    /**
     * Version number of the face detection model associated with the input collection (CollectionId).
     */
    FaceModelVersion?: String;
  }
  export interface Smile {
    /**
     * Boolean value that indicates whether the face is smiling or not.
     */
    Value?: Boolean;
    /**
     * Level of confidence in the determination.
     */
    Confidence?: Percent;
  }
  export interface StartCelebrityRecognitionRequest {
    /**
     * The video in which you want to recognize celebrities. The video must be stored in an Amazon S3 bucket.
     */
    Video: Video;
    /**
     * Idempotent token used to identify the start request. If you use the same token with multiple StartCelebrityRecognition requests, the same JobId is returned. Use ClientRequestToken to prevent the same job from being accidently started more than once. 
     */
    ClientRequestToken?: ClientRequestToken;
    /**
     * The Amazon SNS topic ARN that you want Amazon Rekognition Video to publish the completion status of the celebrity recognition analysis to.
     */
    NotificationChannel?: NotificationChannel;
    /**
     * Unique identifier you specify to identify the job in the completion status published to the Amazon Simple Notification Service topic. 
     */
    JobTag?: JobTag;
  }
  export interface StartCelebrityRecognitionResponse {
    /**
     * The identifier for the celebrity recognition analysis job. Use JobId to identify the job in a subsequent call to GetCelebrityRecognition.
     */
    JobId?: JobId;
  }
  export interface StartContentModerationRequest {
    /**
     * The video in which you want to moderate content. The video must be stored in an Amazon S3 bucket.
     */
    Video: Video;
    /**
     * Specifies the minimum confidence that Amazon Rekognition must have in order to return a moderated content label. Confidence represents how certain Amazon Rekognition is that the moderated content is correctly identified. 0 is the lowest confidence. 100 is the highest confidence. Amazon Rekognition doesn't return any moderated content labels with a confidence level lower than this specified value.
     */
    MinConfidence?: Percent;
    /**
     * Idempotent token used to identify the start request. If you use the same token with multiple StartContentModeration requests, the same JobId is returned. Use ClientRequestToken to prevent the same job from being accidently started more than once. 
     */
    ClientRequestToken?: ClientRequestToken;
    /**
     * The Amazon SNS topic ARN that you want Amazon Rekognition Video to publish the completion status of the content moderation analysis to.
     */
    NotificationChannel?: NotificationChannel;
    /**
     * Unique identifier you specify to identify the job in the completion status published to the Amazon Simple Notification Service topic. 
     */
    JobTag?: JobTag;
  }
  export interface StartContentModerationResponse {
    /**
     * The identifier for the content moderation analysis job. Use JobId to identify the job in a subsequent call to GetContentModeration.
     */
    JobId?: JobId;
  }
  export interface StartFaceDetectionRequest {
    /**
     * The video in which you want to detect faces. The video must be stored in an Amazon S3 bucket.
     */
    Video: Video;
    /**
     * Idempotent token used to identify the start request. If you use the same token with multiple StartFaceDetection requests, the same JobId is returned. Use ClientRequestToken to prevent the same job from being accidently started more than once. 
     */
    ClientRequestToken?: ClientRequestToken;
    /**
     * The ARN of the Amazon SNS topic to which you want Amazon Rekognition Video to publish the completion status of the face detection operation.
     */
    NotificationChannel?: NotificationChannel;
    /**
     * The face attributes you want returned.  DEFAULT - The following subset of facial attributes are returned: BoundingBox, Confidence, Pose, Quality and Landmarks.   ALL - All facial attributes are returned.
     */
    FaceAttributes?: FaceAttributes;
    /**
     * Unique identifier you specify to identify the job in the completion status published to the Amazon Simple Notification Service topic. 
     */
    JobTag?: JobTag;
  }
  export interface StartFaceDetectionResponse {
    /**
     * The identifier for the face detection job. Use JobId to identify the job in a subsequent call to GetFaceDetection.
     */
    JobId?: JobId;
  }
  export interface StartFaceSearchRequest {
    /**
     * The video you want to search. The video must be stored in an Amazon S3 bucket. 
     */
    Video: Video;
    /**
     * Idempotent token used to identify the start request. If you use the same token with multiple StartFaceSearch requests, the same JobId is returned. Use ClientRequestToken to prevent the same job from being accidently started more than once. 
     */
    ClientRequestToken?: ClientRequestToken;
    /**
     * The minimum confidence in the person match to return. For example, don't return any matches where confidence in matches is less than 70%. 
     */
    FaceMatchThreshold?: Percent;
    /**
     * ID of the collection that contains the faces you want to search for.
     */
    CollectionId: CollectionId;
    /**
     * The ARN of the Amazon SNS topic to which you want Amazon Rekognition Video to publish the completion status of the search. 
     */
    NotificationChannel?: NotificationChannel;
    /**
     * Unique identifier you specify to identify the job in the completion status published to the Amazon Simple Notification Service topic. 
     */
    JobTag?: JobTag;
  }
  export interface StartFaceSearchResponse {
    /**
     * The identifier for the search job. Use JobId to identify the job in a subsequent call to GetFaceSearch. 
     */
    JobId?: JobId;
  }
  export interface StartLabelDetectionRequest {
    /**
     * The video in which you want to detect labels. The video must be stored in an Amazon S3 bucket.
     */
    Video: Video;
    /**
     * Idempotent token used to identify the start request. If you use the same token with multiple StartLabelDetection requests, the same JobId is returned. Use ClientRequestToken to prevent the same job from being accidently started more than once. 
     */
    ClientRequestToken?: ClientRequestToken;
    /**
     * Specifies the minimum confidence that Amazon Rekognition Video must have in order to return a detected label. Confidence represents how certain Amazon Rekognition is that a label is correctly identified.0 is the lowest confidence. 100 is the highest confidence. Amazon Rekognition Video doesn't return any labels with a confidence level lower than this specified value. If you don't specify MinConfidence, the operation returns labels with confidence values greater than or equal to 50 percent.
     */
    MinConfidence?: Percent;
    /**
     * The Amazon SNS topic ARN you want Amazon Rekognition Video to publish the completion status of the label detection operation to. 
     */
    NotificationChannel?: NotificationChannel;
    /**
     * Unique identifier you specify to identify the job in the completion status published to the Amazon Simple Notification Service topic. 
     */
    JobTag?: JobTag;
  }
  export interface StartLabelDetectionResponse {
    /**
     * The identifier for the label detection job. Use JobId to identify the job in a subsequent call to GetLabelDetection. 
     */
    JobId?: JobId;
  }
  export interface StartPersonTrackingRequest {
    /**
     * The video in which you want to detect people. The video must be stored in an Amazon S3 bucket.
     */
    Video: Video;
    /**
     * Idempotent token used to identify the start request. If you use the same token with multiple StartPersonTracking requests, the same JobId is returned. Use ClientRequestToken to prevent the same job from being accidently started more than once. 
     */
    ClientRequestToken?: ClientRequestToken;
    /**
     * The Amazon SNS topic ARN you want Amazon Rekognition Video to publish the completion status of the people detection operation to.
     */
    NotificationChannel?: NotificationChannel;
    /**
     * Unique identifier you specify to identify the job in the completion status published to the Amazon Simple Notification Service topic. 
     */
    JobTag?: JobTag;
  }
  export interface StartPersonTrackingResponse {
    /**
     * The identifier for the person detection job. Use JobId to identify the job in a subsequent call to GetPersonTracking.
     */
    JobId?: JobId;
  }
  export interface StartStreamProcessorRequest {
    /**
     * The name of the stream processor to start processing.
     */
    Name: StreamProcessorName;
  }
  export interface StartStreamProcessorResponse {
  }
  export type StatusMessage = string;
  export interface StopStreamProcessorRequest {
    /**
     * The name of a stream processor created by .
     */
    Name: StreamProcessorName;
  }
  export interface StopStreamProcessorResponse {
  }
  export interface StreamProcessor {
    /**
     * Name of the Amazon Rekognition stream processor. 
     */
    Name?: StreamProcessorName;
    /**
     * Current status of the Amazon Rekognition stream processor.
     */
    Status?: StreamProcessorStatus;
  }
  export type StreamProcessorArn = string;
  export interface StreamProcessorInput {
    /**
     * The Kinesis video stream input stream for the source streaming video.
     */
    KinesisVideoStream?: KinesisVideoStream;
  }
  export type StreamProcessorList = StreamProcessor[];
  export type StreamProcessorName = string;
  export interface StreamProcessorOutput {
    /**
     * The Amazon Kinesis Data Streams stream to which the Amazon Rekognition stream processor streams the analysis results.
     */
    KinesisDataStream?: KinesisDataStream;
  }
  export interface StreamProcessorSettings {
    /**
     * Face search settings to use on a streaming video. 
     */
    FaceSearch?: FaceSearchSettings;
  }
  export type StreamProcessorStatus = "STOPPED"|"STARTING"|"RUNNING"|"FAILED"|"STOPPING"|string;
  export type String = string;
  export interface Sunglasses {
    /**
     * Boolean value that indicates whether the face is wearing sunglasses or not.
     */
    Value?: Boolean;
    /**
     * Level of confidence in the determination.
     */
    Confidence?: Percent;
  }
  export interface TextDetection {
    /**
     * The word or line of text recognized by Amazon Rekognition. 
     */
    DetectedText?: String;
    /**
     * The type of text that was detected.
     */
    Type?: TextTypes;
    /**
     * The identifier for the detected text. The identifier is only unique for a single call to DetectText. 
     */
    Id?: UInteger;
    /**
     * The Parent identifier for the detected text identified by the value of ID. If the type of detected text is LINE, the value of ParentId is Null. 
     */
    ParentId?: UInteger;
    /**
     * The confidence that Amazon Rekognition has in the accuracy of the detected text and the accuracy of the geometry points around the detected text.
     */
    Confidence?: Percent;
    /**
     * The location of the detected text on the image. Includes an axis aligned coarse bounding box surrounding the text and a finer grain polygon for more accurate spatial information.
     */
    Geometry?: Geometry;
  }
  export type TextDetectionList = TextDetection[];
  export type TextTypes = "LINE"|"WORD"|string;
  export type Timestamp = number;
  export type UInteger = number;
  export type ULong = number;
  export interface UnindexedFace {
    /**
     * An array of reasons that specify why a face wasn't indexed.    EXTREME_POSE - The face is at a pose that can't be detected. For example, the head is turned too far away from the camera.   EXCEEDS_MAX_FACES - The number of faces detected is already higher than that specified by the MaxFaces input parameter for IndexFaces.   LOW_BRIGHTNESS - The image is too dark.   LOW_SHARPNESS - The image is too blurry.   LOW_CONFIDENCE - The face was detected with a low confidence.   SMALL_BOUNDING_BOX - The bounding box around the face is too small.  
     */
    Reasons?: Reasons;
    /**
     * The structure that contains attributes of a face that IndexFacesdetected, but didn't index. 
     */
    FaceDetail?: FaceDetail;
  }
  export type UnindexedFaces = UnindexedFace[];
  export type Url = string;
  export type Urls = Url[];
  export interface Video {
    /**
     * The Amazon S3 bucket name and file name for the video.
     */
    S3Object?: S3Object;
  }
  export type VideoJobStatus = "IN_PROGRESS"|"SUCCEEDED"|"FAILED"|string;
  export interface VideoMetadata {
    /**
     * Type of compression used in the analyzed video. 
     */
    Codec?: String;
    /**
     * Length of the video in milliseconds.
     */
    DurationMillis?: ULong;
    /**
     * Format of the analyzed video. Possible values are MP4, MOV and AVI. 
     */
    Format?: String;
    /**
     * Number of frames per second in the video.
     */
    FrameRate?: Float;
    /**
     * Vertical pixel dimension of the video.
     */
    FrameHeight?: ULong;
    /**
     * Horizontal pixel dimension of the video.
     */
    FrameWidth?: ULong;
  }
  /**
   * A string in YYYY-MM-DD format that represents the latest possible API version that can be used in this service. Specify 'latest' to use the latest possible version.
   */
  export type apiVersion = "2016-06-27"|"latest"|string;
  export interface ClientApiVersions {
    /**
     * A string in YYYY-MM-DD format that represents the latest possible API version that can be used in this service. Specify 'latest' to use the latest possible version.
     */
    apiVersion?: apiVersion;
  }
  export type ClientConfiguration = ServiceConfigurationOptions & ClientApiVersions;
  /**
   * Contains interfaces for use with the Rekognition client.
   */
  export import Types = Rekognition;
}
export = Rekognition;
