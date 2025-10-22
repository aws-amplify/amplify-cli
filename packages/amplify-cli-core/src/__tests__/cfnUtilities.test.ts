import * as fs from 'fs-extra';
import { CFNTemplateFormat, JSONUtilities, readCFNTemplate, writeCFNTemplate } from '../..';

jest.mock('fs-extra');

const fs_mock = fs as jest.Mocked<typeof fs>;

fs_mock.existsSync.mockReturnValue(true);
fs_mock.statSync.mockReturnValue({ isFile: true } as unknown as fs.Stats);

const testPath = '/this/is/a/test/path.json';

const testTemplate = {
  test: 'content',
};

const jsonContent = JSONUtilities.stringify(testTemplate) as string;

const yamlContent = 'test: content\n';

type TwoArgReadFile = (p: string, e: string) => Promise<string>;

describe('readCFNTemplate', () => {
  beforeEach(() => jest.clearAllMocks());

  it('throws if specified file does not exist', async () => {
    fs_mock.existsSync.mockReturnValueOnce(false);
    fs_mock.readFileSync.mockReturnValue(jsonContent);

    expect(() => {
      readCFNTemplate(testPath);
    }).toThrow(`No CloudFormation template found at /this/is/a/test/path.json`);

    fs_mock.existsSync.mockReturnValueOnce(true);
    fs_mock.statSync.mockReturnValueOnce({ isFile: false } as unknown as fs.Stats);

    expect(() => {
      readCFNTemplate(testPath);
    }).toThrow(`No CloudFormation template found at /this/is/a/test/path.json`);
  });

  it('returns template with json format', async () => {
    fs_mock.readFileSync.mockReturnValueOnce(jsonContent);

    const result = readCFNTemplate(testPath);

    expect(result.templateFormat).toEqual(CFNTemplateFormat.JSON);
    expect(result.cfnTemplate).toEqual(testTemplate);
  });

  it('returns template with yaml format', async () => {
    fs_mock.readFileSync.mockReturnValueOnce(yamlContent);

    const result = readCFNTemplate(testPath);

    expect(result.templateFormat).toEqual(CFNTemplateFormat.YAML);
    expect(result.cfnTemplate).toEqual(testTemplate);
  });

  it('reads yaml template with nested GetAtt refs', async () => {
    const yamlContent = `
      !GetAtt myResource.output.someProp
    `;

    fs_mock.readFileSync.mockReturnValueOnce(yamlContent);

    const result = readCFNTemplate(testPath);

    expect(result.cfnTemplate).toMatchInlineSnapshot(`
{
  "Fn::GetAtt": [
    "myResource",
    "output.someProp",
  ],
}
`);
  });

  it('casts yaml boolean values to corresponding JavaScript boolean', async () => {
    const yamlContent = `
      someKey: true
      someOtherKey: false
      someStringKey: "true"
    `;

    fs_mock.readFileSync.mockReturnValueOnce(yamlContent);

    const result = readCFNTemplate(testPath);

    expect(result.cfnTemplate).toEqual({
      someKey: true,
      someOtherKey: false,
      someStringKey: 'true',
    });
  });

  it('casts yaml integer and float values to corresponding JavaScript number', async () => {
    const yamlContent = `
      someKey: 1
      someOtherKey: 1.234
      someStringKey: "1.234"
    `;

    fs_mock.readFileSync.mockReturnValueOnce(yamlContent);

    const result = readCFNTemplate(testPath);

    expect(result.cfnTemplate).toEqual({
      someKey: 1,
      someOtherKey: 1.234,
      someStringKey: '1.234',
    });
  });
});

describe('writeCFNTemplate', () => {
  beforeEach(() => jest.clearAllMocks());

  it('creates destination if it does not exist', async () => {
    await writeCFNTemplate(testTemplate, testPath);

    expect(fs_mock.ensureDir.mock.calls[0][0]).toEqual('/this/is/a/test');
  });

  it('writes json templates by default', async () => {
    await writeCFNTemplate(testTemplate, testPath);

    expect(fs_mock.writeFileSync.mock.calls[0][0]).toEqual(testPath);
    expect(fs_mock.writeFileSync.mock.calls[0][1]).toEqual(jsonContent);
  });

  it('writes yaml templates if specified', async () => {
    await writeCFNTemplate(testTemplate, testPath, { templateFormat: CFNTemplateFormat.YAML });

    expect(fs_mock.writeFileSync.mock.calls[0][0]).toEqual(testPath);
    expect(fs_mock.writeFileSync.mock.calls[0][1]).toEqual(yamlContent);
  });
});

describe('roundtrip CFN Templates to object and back', () => {
  beforeEach(() => jest.clearAllMocks());

  it('roundtripped yml input should result in same object', async () => {
    const yamlContent = `
      Properties:
        B64: !Base64 AWS CloudFormation
        SimpleCidr: !Cidr [ "192.168.0.0/24", 6, 5 ]
        NestedCidr: !Select [ 0, !Cidr [ !GetAtt ExampleVpc.CidrBlock, 1, 8 ]]
        And: !And [C1, C2]
        Equals: !Equals [C1, !Ref RefC2]
        Or: !Or [C1, C2]
        Size: !If [CreateLargeSize, 100, 10]
        SizeRef: !If [CreateLargeSize, !Ref Value1, !Ref Value2]
        AutoScalingRollingUpdate:
          !If
            - RollingUpdates
            -
              MaxBatchSize: 2
              MinInstancesInService: 2
              PauseTime: PT0M30S
            - !Ref AWS::NoValue
        Not: !Not [CreateLargeSize, !Ref Value1, !Ref Value2]
        ImageId: !FindInMap
          - RegionMap
          - !Ref AWS::Region
          - HVM64
        GetAtt1: !GetAtt DNSName
        GetAtt2: !GetAtt myELB.DNSName
        GetAtt3: !GetAtt myELB.DNSName.Foo
        GetAZs1: !GetAZs ""
        GetAZs2: !GetAZs
          Ref: AWS::Region
        GetAZs3: !GetAZs us-east-1
        ImportValue1: SomeValue
        ImportValue2:
          - !ImportValue
            Fn::Sub: NetworkStackNameParameter-SecurityGroupID
        Join1: !Join [ ":", [ a, b, c ] ]
        Join2: !Join
          - "-"
          - - "arn:"
            - !Ref AWS::Partition
            - :s3:::elasticbeanstalk-*-
            - !Ref AWS::AccountId
        Select: !Select [ "1", [ "apples", "grapes", "oranges", "mangoes" ] ]
        Split: !Split [ "|" , "a|b|c" ]
        Sub1: !Sub
          - www.\${Domain}
          - { Domain: !Ref RootDomainName }
        Sub2: !Sub "arn:aws:ec2:\${AWS::Region}:\${AWS::AccountId}:vpc/\${vpc}"
        Transform:
          !Transform
            Name: "AWS::Include"
            Parameters:
              Location: Loc
        Ref1: !Ref SomeOtherValue
    `;

    (fs_mock.readFile as unknown as jest.MockedFunction<TwoArgReadFile>).mockResolvedValueOnce(yamlContent);

    const result = readCFNTemplate(testPath);

    await writeCFNTemplate(result.cfnTemplate, testPath, { templateFormat: CFNTemplateFormat.YAML });

    const writtenYaml = fs_mock.writeFileSync.mock.calls[0][1];

    (fs_mock.readFile as unknown as jest.MockedFunction<TwoArgReadFile>).mockResolvedValueOnce(writtenYaml as string);

    const roundtrippedYaml = readCFNTemplate(testPath);

    expect(result).toMatchObject(roundtrippedYaml);
  });
});
