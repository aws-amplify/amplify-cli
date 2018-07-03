const authFlowMap = {
  "Enable sign-in API for server-based authentication" : "ADMIN_NO_SRP_AUTH",
  "Only allow Custom Authentication": "CUSTOM_AUTH_FLOW_ONLY",
  "Enable username-password (non-SRP) flow for app-based authentication": "USER_PASSWORD_AUTH"
}	

const coreAttributeMap = {
  "Address": "address",
  "Birthdate": "birthdate",
  "Email": "email",
  "Family Name": "family_name",
  "Given Name" : "given_name",
  "Gender": "gender",
  "Locale": "locale",
  "Middle Name": "middle_name",
  "Name": "name",
  "Nickname": "nickname",
  "Phone Number": "phone_number",
  "Preferred Username": "preferred_username",
  "Picture": "picture",
  "Profile": "profile",
  "Updated At": "updated_at",
  "Website": "website",
  "Zone Info": "zoneinfo",

}

const appClientReadAttributeMap = {
  ...coreAttributeMap,
  "Email Verified?": "email_verified",
  "Phone Number Verified?" : "phone_number_verified"
}

const getAllMaps = () => {
  return {
    authFlowMap,
    coreAttributeMap,
    appClientReadAttributeMap
  }
}

module.exports = {
  authFlowMap,
  coreAttributeMap,
  appClientReadAttributeMap,
  getAllMaps
}