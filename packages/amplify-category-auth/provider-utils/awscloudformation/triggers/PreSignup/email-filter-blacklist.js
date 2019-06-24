exports.handler = (event, context, callback) => {
  // blacklisted domains
  const bld = process.env.DOMAINBLACKLIST.split(',').map(d => d.trim());


  const { email } = event.request.userAttributes;
  const domain = email.substring(email.indexOf('@') + 1);

  if (bld.includes(domain)) {
    callback(new Error(`Invalid email domain: ${domain}`), event);
  } else {
    callback(null, event);
  }
};
