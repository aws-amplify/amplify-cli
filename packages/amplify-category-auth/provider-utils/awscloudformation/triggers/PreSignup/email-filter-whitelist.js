exports.handler = (event, context, callback) => {
  // whitelisted domains
  const wld = process.env.DOMAINWHITELIST.split(',').map(d => d.trim());

  const { email } = event.request.userAttributes;
  const domain = email.substring(email.indexOf('@') + 1);

  if (!wld.includes(domain)) {
    callback(new Error(`Invalid email domain: ${domain}`), event);
  } else {
    callback(null, event);
  }
};
