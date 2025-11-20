Dhyan

`amplify init`

<img width="465" height="302" alt="Screenshot 2025-11-19 at 2 33 20 PM" src="https://github.com/user-attachments/assets/285f3cb5-3995-465f-a2cd-99b17b0403e4" />



`amplify add auth`

<img width="535" height="331" alt="Screenshot 2025-11-19 at 3 46 51 PM" src="https://github.com/user-attachments/assets/489eedec-e7ed-4c20-b72d-2b42dbb94d0f" />

Follow it up by adding social provider config secrets. For reference - https://docs.amplify.aws/gen1/react/build-a-backend/auth/add-social-provider/

Change these lines in backend/auth/cli-inputs.json to 

"hostedUIProviderMeta": "[{\"ProviderName\":\"Facebook\",\"authorize_scopes\":\"public_profile\",\"AttributeMapping\":{\"username\":\"id\"}},{\"ProviderName\":\"Google\",\"authorize_scopes\":\"openid email profile\",\"AttributeMapping\":{\"email\":\"email\",\"username\":\"sub\"}}]",
    "oAuthMetadata": "{\"AllowedOAuthFlows\":[\"code\"],\"AllowedOAuthScopes\":[\"phone\",\"openid\",\"profile\",\"aws.cognito.signin.user.admin\"],\"CallbackURLs\":[\"http://localhost:3000/\"],\"LogoutURLs\":[\"http://localhost:3000/\"]}",
    
Furthermore, go to console -> cognito -> user pool -> authentication -> social provider -> facebook -> change authorized scopes from email, public profile to just public profile. 

All the defaults on amplify push





`amplify add api`

<img width="1022" height="487" alt="Screenshot 2025-11-19 at 5 18 48 PM" src="https://github.com/user-attachments/assets/143b12cb-64b0-49a7-a2d6-2d18662769b4" />

All the defaults on amplify push


`amplify add storage`

<img width="970" height="233" alt="Screenshot 2025-11-20 at 4 54 28 PM" src="https://github.com/user-attachments/assets/6bb57493-fd2a-45e3-9947-d6ea49eb845a" />



`amplify add functions`

<img width="995" height="602" alt="Screenshot 2025-11-20 at 4 13 45 PM" src="https://github.com/user-attachments/assets/1655fbb7-11ac-48fa-997f-77687f582641" />

Add this to a s3 trigger with dependencies & permissions and push
