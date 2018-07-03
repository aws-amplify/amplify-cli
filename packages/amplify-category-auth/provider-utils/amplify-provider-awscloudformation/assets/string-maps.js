const authFlowMap = [
  {
    name: "Enable sign-in API for server-based authentication", 
    value: "ADMIN_NO_SRP_AUTH"
  }, {
    name: "Only allow Custom Authentication",
    value: "CUSTOM_AUTH_FLOW_ONLY"
  }, {
    name: "Enable username-password (non-SRP) flow for app-based authentication",
    value: "USER_PASSWORD_AUTH"
  }
]

const authSelections = [
  {
    name: "Identity Pool and User Pool",
    value: "identityPoolAndUserPool"
  }, {
    name: "Identity Pool Only",
    value: "identityPoolOnly"
  }
]

const coreAttributes = [
  {
    name: "Address",
    value: "address"
  },{
    name: "Birthdate",
    value: "birthdate"
  },{
    name: "Email",
    value: "email"
  },{
    name: "Family Name",
    value: "family_name"
  },{
    name: "Given Name",
    value: "given_name"
  },{
    name: "Locale",
    value: "locale"
  },{
    name: "Middle Name",
    value: "middle_name"
  },
  {
    name: "Name",
    value: "name"
  },{
    name: "Nickname",
    value: "nickname"
  },{
    name: "Phone Number",
    value: "phone_number"
  },{
    name: "Preferred Username",
    value: "preferred_username"
  },{
    name: "Picture",
    value: "picture"
  },{
    name: "Profile",
    value: "profile"
  },{
    name: "Updated At",
    value: "updated_at"
  },{
    name: "Website",
    value: "website"
  },{
    name: "Zone Info",
    value: "zoneinfo"
  }
]


const appClientReadAttributes = [
  ...coreAttributes,
  {
    name: "Email Verified?",
    value: "email_verified"
  }, {
    name: "Phone Number Verified?",
    value: "phone_number_verified"
  }
]

const getAllMaps = () => {
  return {
    authFlowMap,
    coreAttributes,
    authSelections,
    appClientReadAttributes
  }
}

module.exports = {
  authFlowMap,
  coreAttributes,
  appClientReadAttributes,
  authSelections,
  getAllMaps
}