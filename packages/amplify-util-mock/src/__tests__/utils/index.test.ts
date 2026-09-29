import { _isUnsupportedJavaVersion, checkJavaHome } from '../../utils';

jest.mock('fs-extra', () => ({
  existsSync: jest.fn().mockReturnValue(true),
}));

type JavaCondition = {
  name: string;
  unsupported: boolean;
  javaOpts: string | null;
  versionString: string | null;
};

describe('isUnsupportedJavaVersion', () => {
  const javas: Array<JavaCondition> = [
    {
      javaOpts: null,
      name: '7u79',
      unsupported: true,
      versionString: `java version "1.7.0_79"
Java(TM) SE Runtime Environment (build 1.7.0_79-b15)
Java HotSpot(TM) 64-Bit Server VM (build 24.79-b02, mixed mode)`,
    },
    {
      javaOpts: null,
      name: '8u131',
      unsupported: false,
      versionString: `java version "1.8.0_131"
Java(TM) SE Runtime Environment (build 1.8.0_131-b11)
Java HotSpot(TM) 64-Bit Server VM (build 25.131-b11, mixed mode)`,
    },
    {
      javaOpts: 'Picked up _JAVA_OPTIONS: -Dfile.encoding=UTF-8',
      name: '8u131',
      unsupported: false,
      versionString: `java version "1.8.0_131"
Java(TM) SE Runtime Environment (build 1.8.0_131-b11)
Java HotSpot(TM) 64-Bit Server VM (build 25.131-b11, mixed mode)`,
    },
    {
      javaOpts: null,
      name: '8.0.265-amzn',
      unsupported: false,
      versionString: `openjdk version "1.8.0_265"
OpenJDK Runtime Environment Corretto-8.265.01.1 (build 1.8.0_265-b01)
OpenJDK 64-Bit Server VM Corretto-8.265.01.1 (build 25.265-b01, mixed mode)`,
    },
    {
      javaOpts: null,
      name: '11.0.0-open',
      unsupported: false,
      versionString: `openjdk version "11" 2018-09-25
OpenJDK Runtime Environment 18.9 (build 11+28)
OpenJDK 64-Bit Server VM 18.9 (build 11+28, mixed mode)`,
    },
    {
      javaOpts: 'Picked up _JAVA_OPTIONS: -Dfile.encoding=UTF-8',
      name: '11.0.0-open',
      unsupported: false,
      versionString: `openjdk version "11" 2018-09-25
OpenJDK Runtime Environment 18.9 (build 11+28)
OpenJDK 64-Bit Server VM 18.9 (build 11+28, mixed mode)`,
    },
    {
      javaOpts: null,
      name: '11.0.0-librca',
      unsupported: false,
      versionString: `openjdk version "11-BellSoft" 2018-09-25
OpenJDK Runtime Environment (build 11-BellSoft+0)
OpenJDK 64-Bit Server VM (build 11-BellSoft+0, mixed mode)`,
    },
    {
      javaOpts: null,
      name: '11.0.3-librca',
      unsupported: false,
      versionString: `openjdk version "11.0.3-BellSoft" 2019-04-16
LibericaJDK Runtime Environment (build 11.0.3-BellSoft+12)
LibericaJDK 64-Bit Server VM (build 11.0.3-BellSoft+12, mixed mode)`,
    },
    {
      javaOpts: null,
      name: 'uninstalled',
      unsupported: true,
      versionString: null,
    },
  ];

  javas.forEach((java) => {
    it(`should return ${java.unsupported} on java ${java.name} with JAVA_OPTS: ${java.javaOpts != null}`, () => {
      const stderr: string = [java.javaOpts, java.versionString].filter((text) => text != null).join('\n');
      const actual = _isUnsupportedJavaVersion(stderr === '' ? null : stderr);
      expect(actual).toBe(java.unsupported);
    });
  });
});

describe('Check JAVA_HOME variable', () => {
  const initialJavaHome = process?.env?.JAVA_HOME;
  afterEach(() => {
    process.env.JAVA_HOME = initialJavaHome;
    jest.clearAllMocks();
  });

  it('Should not throw when JAVA_HOME is set and is valid', () => {
    process.env.JAVA_HOME = 'pathtojdk';
    expect(() => {
      checkJavaHome();
    }).not.toThrow();
  });
});
