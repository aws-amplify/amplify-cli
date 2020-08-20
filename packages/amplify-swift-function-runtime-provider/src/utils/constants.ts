import { SemVer, coerce } from 'semver';

export const SWIFT_MIN_VERSION = <SemVer>coerce('5.3');
export const BUILD_TOOL_INFO_MSG = 'Scripts to build and deploy Swift Package Manager projects on AWS Lambda';
