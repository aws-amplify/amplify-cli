// Blank lines at the beginning are intentional
export const s3WrapperCode = `

extension S3Object: AWSS3ObjectProtocol {
  public func getBucketName() -> String {
      return bucket
  }

  public func getKeyName() -> String {
      return key
  }

  public func getRegion() -> String {
      return region
  }
}

extension S3ObjectInput: AWSS3ObjectProtocol, AWSS3InputObjectProtocol {
  public func getLocalSourceFileURL() -> URL? {
      return URL(string: self.localUri)
  }

  public func getMimeType() -> String {
      return self.mimeType
  }

  public func getBucketName() -> String {
      return self.bucket
  }

  public func getKeyName() -> String {
      return self.key
  }

  public func getRegion() -> String {
      return self.region
  }

}

import AWSS3
extension AWSS3PreSignedURLBuilder: AWSS3ObjectPresignedURLGenerator  {
  public func getPresignedURL(s3Object: AWSS3ObjectProtocol) -> URL? {
      let request = AWSS3GetPreSignedURLRequest()
      request.bucket = s3Object.getBucketName()
      request.key = s3Object.getKeyName()
      var url : URL?
      self.getPreSignedURL(request).continueWith { (task) -> Any? in
          url = task.result as URL?
          }.waitUntilFinished()
      return url
  }
}

extension AWSS3TransferUtility: AWSS3ObjectManager {

  public func download(s3Object: AWSS3ObjectProtocol, toURL: URL, completion: @escaping ((Bool, Error?) -> Void)) {

      let completionBlock: AWSS3TransferUtilityDownloadCompletionHandlerBlock = { task, url, data, error  -> Void in
          if let _ = error {
              completion(false, error)
          } else {
              completion(true, nil)
          }
      }
      let _ = self.download(to: toURL, bucket: s3Object.getBucketName(), key: s3Object.getKeyName(), expression: nil, completionHandler: completionBlock)
  }

  public func upload(s3Object: AWSS3ObjectProtocol & AWSS3InputObjectProtocol, completion: @escaping ((_ success: Bool, _ error: Error?) -> Void)) {
      let completionBlock : AWSS3TransferUtilityUploadCompletionHandlerBlock = { task, error  -> Void in
          if let _ = error {
              completion(false, error)
          } else {
              completion(true, nil)
          }
      }
      let _ = self.uploadFile(s3Object.getLocalSourceFileURL()!, bucket: s3Object.getBucketName(), key: s3Object.getKeyName(), contentType: s3Object.getMimeType(), expression: nil, completionHandler: completionBlock).continueWith { (task) -> Any? in
          if let err = task.error {
              completion(false, err)
          }
          return nil
      }
  }
}`;
