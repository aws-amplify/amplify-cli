jest.mock('child_process', () => ({ execSync: jest.fn() }));
const fs = require('fs-extra'); 
const p12decoder = require('../../lib/p12decoder'); 

describe('p12decoder', () => {
    const info = { 
        P12FilePath: 'mockFilePath', 
        P12FilePassword: 'mockFilePassword'
    };

    const mockCertificate = `
    -----BEGIN CERTIFICATE-----
    mockCertificate
    -----END CERTIFICATE-----
    `;

    beforeAll(() => {
        fs.removeSync = jest.fn(); 
    }); 

    beforeEach(() => { 
    });

    test('private key', () => {
        mockKeyString = `
        -----BEGIN PRIVATE KEY-----
        mockKey
        -----END PRIVATE KEY-----
        `; 
        const mockPemFileContent = `
        ${mockCertificate}
        ${mockKeyString}
        `; 
        fs.readFileSync = jest.fn(()=>{
            return mockPemFileContent; 
        }); 
        const decodedContent = p12decoder.run(info); 
        expect(decodedContent.Certificate).toBeDefined(); 
        expect(decodedContent.PrivateKey).toBeDefined(); 
    });


    test('private RSA key', () => {
        mockKeyString = `
        -----BEGIN RSA PRIVATE KEY-----
        mockRSAKey
        -----END RSA PRIVATE KEY-----
        `;  
        const mockPemFileContent = `
        ${mockCertificate}
        ${mockKeyString}
        `; 
        fs.readFileSync = jest.fn(()=>{
            return mockPemFileContent; 
        }); 
        const decodedContent = p12decoder.run(info); 
        expect(decodedContent.Certificate).toBeDefined(); 
        expect(decodedContent.PrivateKey).toBeDefined(); 
    });


    test('ENCRYPTED private key', () => {
        mockKeyString = `
        -----BEGIN ENCRYPTED PRIVATE KEY-----
        mockEncryptedKey
        -----END ENCRYPTED PRIVATE KEY-----
        `;
        const mockPemFileContent = `
        ${mockCertificate}
        ${mockKeyString}
        `; 
        fs.readFileSync = jest.fn(()=>{
            return mockPemFileContent; 
        }); 
        const decodedContent = p12decoder.run(info); 
        expect(decodedContent.Certificate).toBeDefined(); 
        expect(decodedContent.PrivateKey).toBeDefined(); 
    });
})