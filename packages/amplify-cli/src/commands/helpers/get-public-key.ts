// eslint-disable-next-line spellcheck/spell-checker
const publicKey = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAxrD6+A/a+HPkIiLE4hta
ArjDmaXGr6jnIxabSCvdvKmq/W0OSkOrX43aB9aN5QgM04/bfnNt+W6JRh7OM2Bi
aBryAuwzupuShiIpdPjONbEumCoRr6r7lHmCnAnwDNDOIie09wJHVRLXFV+tO5zD
meAEn1z/A7pFO/wDBWFziIX4TUC+H5ktb3O4t9H6RvRrvh0ffN1JUPVxtvzWL3B5
5xDBbW0adMH0u4ov6dguICA3Sqo7laQfb9OsMYM5U9ksbLTvj2S5UJGLn3vOQvhL
DbqC7PBRKwh8UDcs6e5iRiOPQQCNVMpAcjj/gzkpGIShXWXmqJK7Nc7hT0ZGR9il
kQIDAQAB
-----END PUBLIC KEY-----`;

/**
 * Return the public key from github API
 * @returns the public key
 */
export const getPublicKey = async (): Promise<string> => publicKey;
