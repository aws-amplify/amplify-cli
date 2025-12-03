Dhyan

`amplify init`

<img width="465" height="302" alt="Screenshot 2025-11-19 at 2 33 20 PM" src="https://github.com/user-attachments/assets/285f3cb5-3995-465f-a2cd-99b17b0403e4" />



`amplify add auth`

<img width="535" height="331" alt="Screenshot 2025-11-19 at 3 46 51 PM" src="https://github.com/user-attachments/assets/489eedec-e7ed-4c20-b72d-2b42dbb94d0f" />

Follow it up by adding social provider config secrets. For reference - https://docs.amplify.aws/gen1/react/build-a-backend/auth/add-social-provider/

Make sure to configure your redirect urls properly

`amplify update auth`
<img width="998" height="431" alt="Screenshot 2025-11-21 at 10 30 34 AM" src="https://github.com/user-attachments/assets/460c3236-b26e-4b43-bf56-b64ccc109c9e" />


All the defaults on amplify push

Note: Facebook login will not currently work since it does not accept email and user pools have email as a required attribute (which cannot be changed). We need to request specific email permissiom from facebook to make it work (which is out of the scope of the app currently)



`amplify add api`

<img width="1022" height="487" alt="Screenshot 2025-11-19 at 5 18 48 PM" src="https://github.com/user-attachments/assets/143b12cb-64b0-49a7-a2d6-2d18662769b4" />

All the defaults on amplify push


`amplify add storage`

<img width="970" height="233" alt="Screenshot 2025-11-20 at 4 54 28 PM" src="https://github.com/user-attachments/assets/6bb57493-fd2a-45e3-9947-d6ea49eb845a" />



`amplify add functions`

<img width="806" height="450" alt="Screenshot 2025-12-03 at 1 04 07 PM" src="https://github.com/user-attachments/assets/9e796d8e-6c21-4b0c-8cf4-17f197a9ee4b" />


Now, manually replace the following files in your backend:

schema.graphql
```graphql
# User Profile
type UserProfile @model @auth(rules: [
  { allow: owner },
  { allow: groups, groups: ["Admin"] }
]) {
  id: ID!
  username: String!
  email: String
  displayName: String
  avatar: String
  
  # Relationships (Gen 2 ready)
  mediaItems: [MediaItem] @hasMany(indexName: "byOwner", fields: ["id"])
  collections: [Collection] @hasMany(indexName: "byOwner", fields: ["id"])
}

# Media Items (photos, videos, documents)
type MediaItem @model @auth(rules: [
  { allow: owner },
  { allow: groups, groups: ["Admin"] }
]) {
  id: ID!
  title: String!
  description: String
  fileUrl: String!
  thumbnailUrl: String
  fileType: MediaType!
  fileSize: Int
  mimeType: String
  tags: [String]
  isPrivate: Boolean!
  uploadedAt: AWSDateTime!
  
  # Foreign keys (Gen 2 ready)
  userProfileId: ID! @index(name: "byOwner")
  collectionId: ID @index(name: "byCollection")
  
  # Relationships
  owner: UserProfile @belongsTo(fields: ["userProfileId"])
  collection: Collection @belongsTo(fields: ["collectionId"])
  sharedItems: [SharedItem] @hasMany(indexName: "byMediaItem", fields: ["id"])
}

# Collections/Albums
type Collection @model @auth(rules: [
  { allow: owner },
  { allow: groups, groups: ["Admin"] }
]) {
  id: ID!
  name: String!
  description: String
  coverImage: String
  isPrivate: Boolean!
  
  # Foreign keys (Gen 2 ready)
  userProfileId: ID! @index(name: "byOwner")
  
  # Relationships
  owner: UserProfile @belongsTo(fields: ["userProfileId"])
  mediaItems: [MediaItem] @hasMany(indexName: "byCollection", fields: ["id"])
}

# Sharing functionality
type SharedItem @model @auth(rules: [
  { allow: owner },
  { allow: private, operations: [read] }
]) {
  id: ID!
  permissions: SharePermission!
  expiresAt: AWSDateTime
  sharedWithEmail: String!
  sharedAt: AWSDateTime!
  
  # Foreign keys (Gen 2 ready)
  mediaItemId: ID! @index(name: "byMediaItem")
  
  # Relationships
  mediaItem: MediaItem @belongsTo(fields: ["mediaItemId"])
}

# Quick Notes
type Note @model @auth(rules: [
  { allow: owner },
  { allow: groups, groups: ["Admin"] }
]) {
  id: ID!
  title: String!
  content: String
  tags: [String]
  isPinned: Boolean
}

# Enums
enum MediaType {
  IMAGE
  VIDEO
  AUDIO
  DOCUMENT
  OTHER
}

enum SharePermission {
  VIEW
  DOWNLOAD
  EDIT
}
```

Function

GraphQL Schema
```graphql
# User Profile
type UserProfile @model @auth(rules: [
  { allow: owner },
  { allow: groups, groups: ["Admin"] }
]) {
  id: ID!
  username: String!
  email: String
  displayName: String
  avatar: String
  
  # Relationships (Gen 2 ready)
  mediaItems: [MediaItem] @hasMany(indexName: "byOwner", fields: ["id"])
  collections: [Collection] @hasMany(indexName: "byOwner", fields: ["id"])
}

# Media Items (photos, videos, documents)
type MediaItem @model @auth(rules: [
  { allow: owner },
  { allow: groups, groups: ["Admin"] }
]) {
  id: ID!
  title: String!
  description: String
  fileUrl: String!
  thumbnailUrl: String
  fileType: MediaType!
  fileSize: Int
  mimeType: String
  tags: [String]
  isPrivate: Boolean!
  uploadedAt: AWSDateTime!
  
  # Foreign keys (Gen 2 ready)
  userProfileId: ID! @index(name: "byOwner")
  collectionId: ID @index(name: "byCollection")
  
  # Relationships
  owner: UserProfile @belongsTo(fields: ["userProfileId"])
  collection: Collection @belongsTo(fields: ["collectionId"])
  sharedItems: [SharedItem] @hasMany(indexName: "byMediaItem", fields: ["id"])
}

# Collections/Albums
type Collection @model @auth(rules: [
  { allow: owner },
  { allow: groups, groups: ["Admin"] }
]) {
  id: ID!
  name: String!
  description: String
  coverImage: String
  isPrivate: Boolean!
  
  # Foreign keys (Gen 2 ready)
  userProfileId: ID! @index(name: "byOwner")
  
  # Relationships
  owner: UserProfile @belongsTo(fields: ["userProfileId"])
  mediaItems: [MediaItem] @hasMany(indexName: "byCollection", fields: ["id"])
}

# Sharing functionality
type SharedItem @model @auth(rules: [
  { allow: owner },
  { allow: private, operations: [read] }
]) {
  id: ID!
  permissions: SharePermission!
  expiresAt: AWSDateTime
  sharedWithEmail: String!
  sharedAt: AWSDateTime!
  
  # Foreign keys (Gen 2 ready)
  mediaItemId: ID! @index(name: "byMediaItem")
  
  # Relationships
  mediaItem: MediaItem @belongsTo(fields: ["mediaItemId"])
}

# Quick Notes
type Note @model @auth(rules: [
  { allow: owner },
  { allow: groups, groups: ["Admin"] }
]) {
  id: ID!
  title: String!
  content: String
  tags: [String]
  isPinned: Boolean
}

# Enums
enum MediaType {
  IMAGE
  VIDEO
  AUDIO
  DOCUMENT
  OTHER
}

enum SharePermission {
  VIEW
  DOWNLOAD
  EDIT
}```


Function
amplify-migration-apps/app-3/personal-media-vault/personal-media-vault/amplify/backend/function/thumbnailgen/src/index.js

```javascript
const { S3Client, GetObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3');

const s3 = new S3Client({ region: process.env.AWS_REGION });

/**
 * @type {import('@types/aws-lambda').S3Handler}
 */
exports.handler = async (event) => {
    console.log(`EVENT: ${JSON.stringify(event)}`);

    for (const record of event.Records) {
        const bucket = record.s3.bucket.name;
        const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));

        // Skip if already a thumbnail
        if (key.includes('/thumbnails/')) {
            continue;
        }

        // Only process image files
        if (!key.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
            continue;
        }

        try {
            // Get file metadata
            const getCommand = new GetObjectCommand({ Bucket: bucket, Key: key });
            const fileData = await s3.send(getCommand);
            
            console.log(`Processing image: ${key}`);
            console.log(`File size: ${fileData.ContentLength} bytes`);
            console.log(`Content type: ${fileData.ContentType}`);
            
            // Create a simple text file as "thumbnail" for now
            const thumbnailKey = key.replace(/^(.+)\/([^/]+)$/, '$1/thumbnails/$2') + '.txt';
            const thumbnailContent = `Thumbnail info for: ${key}\nSize: ${fileData.ContentLength} bytes\nType: ${fileData.ContentType}`;
            
            const putCommand = new PutObjectCommand({
                Bucket: bucket,
                Key: thumbnailKey,
                Body: thumbnailContent,
                ContentType: 'text/plain'
            });
            await s3.send(putCommand);
            
            console.log(`Thumbnail info created: ${thumbnailKey}`);
            
        } catch (error) {
            console.error(`Error processing ${key}:`, error);
        }
    }

    return { statusCode: 200, body: 'Thumbnails processed' };
};
```

amplify-migration-apps/app-3/personal-media-vault/personal-media-vault/amplify/backend/function/thumbnailgen/src/package.json
```javascript
{
  "name": "thumbnailgen",
  "version": "2.0.0",
  "description": "Lambda function generated by Amplify",
  "main": "index.js",
  "license": "Apache-2.0",
  "dependencies": {
    "@aws-sdk/client-s3": "^3.0.0"
  },
  "devDependencies": {
    "@types/aws-lambda": "^8.10.92"
  }
}
```
