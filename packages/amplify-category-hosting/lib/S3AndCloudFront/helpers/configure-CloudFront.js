// const config = {
//     "Aliases" : "nice to have",
//     "CacheBehaviors" : "nice to have",
//     "Comment" : String,
//     "CustomErrorResponses" : "nice to have",
//     "DefaultCacheBehavior" : "nice to have",
//     "DefaultRootObject" : String,
//     "Enabled" : Boolean,
//     "HttpVersion" : String,
//     "IPV6Enabled" : Boolean,
//     "Logging" : "nice to have",
//     "Origins" : "nice to have",
//     "PriceClass" : String,
//     "Restrictions" :"nice to have",
//     "ViewerCertificate" : "nice to have",
//     "WebACLId" : String
//  }     

function configure(context){
    console.log('configure cloudfront'); 
    return context; 
}

module.exports = {
    configure
}