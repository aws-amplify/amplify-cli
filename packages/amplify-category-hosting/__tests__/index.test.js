jest.mock('promise-sequential');

const inquirer = require('inquirer');
const mockirer = require('mockirer');
const sequential = require('promise-sequential');

const categoryManager = require('../lib/category-manager');

const indexModule = require('../index');

describe('index', () => {
    const mockContext = {}; 
    const S3AndCloudFront = 'S3AndCloudFront'; 
    const AnotherHostingService = 'AnotherHostingService';

    const mockAvailableServices = []; 
    let mockDisabledServices = []; 
    let mockEnabledServices = []; 

    const mockAnswers = {
        selectedServices: []
    }; 

    beforeAll(() => {
        categoryManager.getCategoryStatus = jest.fn(()=>{
            return {
                availableServices: mockAvailableServices,
                enabledServices: mockEnabledServices,
                disabledServices: mockDisabledServices
            }
        }); 
        categoryManager.runServiceAction = jest.fn(); 
        categoryManager.migrate = jest.fn(); 
    }); 

    beforeEach(() => {
        mockAvailableServices.length = 0; 
        mockDisabledServices.length = 0; 
        mockEnabledServices.length = 0; 
        mockAnswers.selectedServices.length = 0; 
        mockAnswers.selectedService = undefined; 
        sequential.mockClear(); 
        categoryManager.runServiceAction.mockClear(); 
    });

    test('add', async () => {
        mockAvailableServices.push(S3AndCloudFront);
        mockAvailableServices.push(AnotherHostingService);
        mockDisabledServices.push(S3AndCloudFront);
        mockDisabledServices.push(AnotherHostingService);
        mockAnswers.selectedServices.push(S3AndCloudFront);
        mockirer(inquirer, mockAnswers); 
        await indexModule.add(mockContext); 
        expect(sequential).toBeCalled(); 
    });

    test('add, only one disabled serivce', async () => {
        mockAvailableServices.push(S3AndCloudFront);
        mockDisabledServices.push(S3AndCloudFront);
        await indexModule.add(mockContext); 
        expect(categoryManager.runServiceAction).toBeCalled(); 
        expect(categoryManager.runServiceAction.mock.calls[0][0]).toBe(mockContext); 
        expect(categoryManager.runServiceAction.mock.calls[0][1]).toBe(S3AndCloudFront); 
        expect(categoryManager.runServiceAction.mock.calls[0][2]).toBe('enable'); 
    });

    test('add, no disabled service', async () => {
        mockAvailableServices.push(S3AndCloudFront);
        mockEnabledServices.push(S3AndCloudFront);
        try{
            await indexModule.add(mockContext); 
        }catch(err){
            expect(sequential).not.toBeCalled(); 
            expect(categoryManager.runServiceAction).not.toBeCalled(); 
            expect(err).toBeDefined();
        }
    });

    test('add, no available service', async () => {
        try{
            await indexModule.add(mockContext); 
        }catch(err){
            expect(sequential).not.toBeCalled(); 
            expect(categoryManager.runServiceAction).not.toBeCalled(); 
            expect(err).toBeDefined();
        }
    });

    test('configure', async () => {
        mockAvailableServices.push(S3AndCloudFront);
        mockAvailableServices.push(AnotherHostingService);
        mockEnabledServices.push(S3AndCloudFront);
        mockEnabledServices.push(AnotherHostingService);
        mockAnswers.selectedServices.push(S3AndCloudFront);
        mockirer(inquirer, mockAnswers); 
        await indexModule.configure(mockContext); 
        expect(sequential).toBeCalled(); 
    });

    test('configure, only one enabled serivce', async () => {
        mockAvailableServices.push(S3AndCloudFront);
        mockEnabledServices.push(S3AndCloudFront);
        await indexModule.configure(mockContext); 
        expect(categoryManager.runServiceAction).toBeCalled(); 
        expect(categoryManager.runServiceAction.mock.calls[0][0]).toBe(mockContext); 
        expect(categoryManager.runServiceAction.mock.calls[0][1]).toBe(S3AndCloudFront); 
        expect(categoryManager.runServiceAction.mock.calls[0][2]).toBe('configure'); 
    });

    test('configure, no enabled service', async () => {
        mockAvailableServices.push(S3AndCloudFront);
        try{
            await indexModule.configure(mockContext); 
        }catch(err){
            expect(sequential).not.toBeCalled(); 
            expect(categoryManager.runServiceAction).not.toBeCalled(); 
            expect(err).toBeDefined();
        }
    });

    test('configure, no available service', async () => {
        try{
            await indexModule.configure(mockContext); 
        }catch(err){
            expect(sequential).not.toBeCalled(); 
            expect(categoryManager.runServiceAction).not.toBeCalled(); 
            expect(err).toBeDefined();
        }
    });

    test('publish', async () => {
        mockAvailableServices.push(S3AndCloudFront);
        mockEnabledServices.push(S3AndCloudFront);
        await indexModule.publish(mockContext, S3AndCloudFront); 
        expect(categoryManager.runServiceAction).toBeCalled(); 
        expect(categoryManager.runServiceAction.mock.calls[0][0]).toBe(mockContext); 
        expect(categoryManager.runServiceAction.mock.calls[0][1]).toBe(S3AndCloudFront); 
        expect(categoryManager.runServiceAction.mock.calls[0][2]).toBe('publish'); 
    });

    test('publish, expected service no enabled', async () => {
        mockAvailableServices.push(S3AndCloudFront);
        mockAvailableServices.push(AnotherHostingService);
        mockEnabledServices.push(AnotherHostingService);
        mockDisabledServices.push(S3AndCloudFront);
        try{
            await indexModule.publish(mockContext, S3AndCloudFront); 
        }catch(err){
            expect(categoryManager.runServiceAction).not.toBeCalled(); 
            expect(err).toBeDefined();
        }
    });

    test('publish, no enabled service', async () => {
        mockAvailableServices.push(S3AndCloudFront);
        try{
            await indexModule.publish(mockContext, S3AndCloudFront); 
        }catch(err){
            expect(categoryManager.runServiceAction).not.toBeCalled(); 
            expect(err).toBeDefined();
        }
    });

    test('console', async () => {
        mockAvailableServices.push(S3AndCloudFront);
        mockAvailableServices.push(AnotherHostingService);
        mockEnabledServices.push(S3AndCloudFront);
        mockEnabledServices.push(AnotherHostingService);
        mockAnswers.selectedService = mockEnabledServices[0];
        mockirer(inquirer, mockAnswers); 
        await indexModule.console(mockContext); 
        expect(categoryManager.runServiceAction).toBeCalled(); 
        expect(categoryManager.runServiceAction.mock.calls[0][0]).toBe(mockContext); 
        expect(categoryManager.runServiceAction.mock.calls[0][1]).toBe(mockEnabledServices[0]); 
        expect(categoryManager.runServiceAction.mock.calls[0][2]).toBe('console'); 
    });

    test('console, only one enabled serivce', async () => {
        mockAvailableServices.push(S3AndCloudFront);
        mockEnabledServices.push(S3AndCloudFront);
        await indexModule.console(mockContext); 
        expect(categoryManager.runServiceAction).toBeCalled(); 
        expect(categoryManager.runServiceAction.mock.calls[0][0]).toBe(mockContext); 
        expect(categoryManager.runServiceAction.mock.calls[0][1]).toBe(S3AndCloudFront); 
        expect(categoryManager.runServiceAction.mock.calls[0][2]).toBe('console'); 
    });

    test('console, no enabled service', async () => {
        mockAvailableServices.push(S3AndCloudFront);
        mockDisabledServices.push(S3AndCloudFront);
        try{
            await indexModule.console(mockContext); 
        }catch(err){
            expect(sequential).not.toBeCalled(); 
            expect(categoryManager.runServiceAction).not.toBeCalled(); 
            expect(err).toBeDefined();
        }
    });

    test('console, no available service', async () => {
        try{
            await indexModule.console(mockContext); 
        }catch(err){
            expect(sequential).not.toBeCalled(); 
            expect(categoryManager.runServiceAction).not.toBeCalled(); 
            expect(err).toBeDefined();
        }
    });

    test('migrate', async () => {
        await indexModule.migrate(mockContext); 
        expect(categoryManager.migrate).toBeCalledWith(mockContext); 
    });
})