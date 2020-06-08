import {layerMetadataFactory} from '../../../../provider-utils/awscloudformation/utils/layerParams';

const layerObj1 = {
    runtimes: [
        {
            name: "Java",
            value: "java",
            cloudTemplateValue: "java11",
            defaultHandler: "example.LambdaRequestHandler::handleRequest",
            layerExecutablePath: "bin/java/lib/"
        }
    ],
    layerVersionsMap: 
    {
        1: 
        [
            {
              type : "Permissions.public"
            }
        ],
        2: 
        [
          {
            type : "Permissions.awsOrg",
            orgs : [" o-dsjnkdjs"," o-sdnckjsd"]

          },
          {
            type : "Permissions.awsAccounts",
            accounts : ["11111111111","222222222"]
          }
        ],
        3: 
        [
          {
            type : "Permissions.private"
          }
        ]
    }
}

const layerObj2 = {
    runtimes: [
        {
            name: "Java",
            value: "java",
            cloudTemplateValue: "java11",
            defaultHandler: "example.LambdaRequestHandler::handleRequest",
            layerExecutablePath: "bin/java/lib/"
        }
    ],
    layerVersionsMap: 
    {
    }
}

describe('layer metadata Factory Function', () => {

  it('getversion permissions happy case 1', () => {
        layerMetadataFactory(layerObj1).listVersions().forEach(version => {
        expect(layerMetadataFactory(layerObj1).getVersion(version).permissions).toMatchSnapshot();
      });
  });
  it('getversion permissions happy case 2', () => {
        layerMetadataFactory(layerObj2).listVersions().forEach(version => {
        expect(layerMetadataFactory(layerObj2).getVersion(version).permissions).toMatchSnapshot();
      });
  });

  it('Listversion happy case 1', () => {
    expect(layerMetadataFactory(layerObj1).listVersions()).toMatchSnapshot();
  });

  it('Listversion happy case 2', () => {
    expect(layerMetadataFactory(layerObj2).listVersions()).toMatchSnapshot()
  });
});
