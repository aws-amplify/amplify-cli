exports.handler = (event, context, callback) => {
  // blacklisted domains
  const bld = [
    'amazon.com',
  ];

  const { email } = event.request.userAttributes;
  const domain = email.substring(email.indexOf('@') + 1);

  if (bld.includes(domain)) {
    callback(new Error(`Invalid email domain: ${domain}`), event);
  } else {
    callback(null, event);
  }
};
