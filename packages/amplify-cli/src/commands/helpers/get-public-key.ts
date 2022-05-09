// eslint-disable-next-line spellcheck/spell-checker
const publicKey = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA24uh4/+WYoQYLtqgAP+/
Q1NxJbVIfzIpQ/Y0fOn9T3V7pjsw6elKarq96qfJqmpDJ+dYSkffjnv9m0t4UKtZ
tB38y7KXOMiesg3zaJT5Qxm6r/4xkp7fpggsRzodkYSXjzo1lQlXQVj8wK1erNhU
KJcMrf6XnFMm5oqR7TH15ByUN4zI8ERFUCDa5yzeUi+gZ7JorHE4JNlvRTPxRvnc
EOhg9YCOpcCdrMOCdJzrrjH8Lypd5WiEmPhyN8CHi5pO8NHxzjGovINYhO13Dsh3
GarDU9BBdgDgidIPg2Y9a4XYRLy1gWEvKWVxKdtB6+Tns0kFpkClAeMxHE3Q1EgD
3QIDAQAB
-----END PUBLIC KEY-----`;

/**
 * Return the public key from github API
 * @returns the public key
 */
export const getPublicKey = async (): Promise<string> => publicKey;
