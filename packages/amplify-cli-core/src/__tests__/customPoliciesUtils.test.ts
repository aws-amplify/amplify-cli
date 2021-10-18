import {createDefaultCustomPoliciesFile} from '../customPoliciesUtils'
import { JSONUtilities } from '..';
import { pathManager, PathConstants } from '../state-manager';
import path from 'path';

describe('Custom policies util test', () => {

    jest.mock('../state-manager');

    const testCategoryName = 'function';
    const testResourceName = 'functionTest';
    const expectedFilePath = path.join(__dirname, 'testFiles', 'custom-policies-test', testCategoryName, testResourceName, PathConstants.CustomPoliciesFilename);
    jest.spyOn(pathManager, 'getCustomPoliciesPath').mockReturnValue(expectedFilePath);

    beforeEach(jest.clearAllMocks);

    test('Write default custom policy file to the specified resource name', () => {

        createDefaultCustomPoliciesFile(testCategoryName, testResourceName);
      
        const data = JSONUtilities.readJson(expectedFilePath);
      
        expect(data).toMatchObject([
            {
                Action: [],
                Resource: []
            }
        ]);

    })
})