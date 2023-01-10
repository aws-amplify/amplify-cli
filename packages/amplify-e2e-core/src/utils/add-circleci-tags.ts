import { stateManager } from 'amplify-cli-core';
import * as fs from 'fs-extra';
import * as path from 'path';
import { sleep } from './sleep';

declare global {
  /* eslint-disable @typescript-eslint/no-namespace */
  namespace NodeJS {
    interface Global {
      getTestName?: () => string;
      getHookName?: () => string;
      getDescibeBlocks?: () => string[];
    }
  }
  /* eslint-enable */
}

export const addCircleCITags = async (projectPath: string): Promise<void> => {
  if (process.env && process.env['CIRCLECI']) {
    // await staggerInitCalls(projectPath);

    const tags = stateManager.getProjectTags(projectPath);

    const addTagIfNotExist = (key: string, value: string): void => {
      if (!tags.find(t => t.Key === key)) {
        tags.push({
          Key: key,
          Value: value,
        });
      }
    };

    addTagIfNotExist('circleci', sanitizeTagValue(process.env['CIRCLECI'] || 'N/A'));
    addTagIfNotExist('circleci:branch', sanitizeTagValue(process.env['CIRCLE_BRANCH'] || 'N/A'));
    addTagIfNotExist('circleci:sha1', sanitizeTagValue(process.env['CIRCLE_SHA1'] || 'N/A'));
    addTagIfNotExist('circleci:workflow_id', sanitizeTagValue(process.env['CIRCLE_WORKFLOW_ID'] || 'N/A'));
    addTagIfNotExist('circleci:build_id', sanitizeTagValue(process.env['CIRCLE_BUILD_NUM'] || 'N/A'));
    addTagIfNotExist('circleci:build_url', sanitizeTagValue(process.env['CIRCLE_BUILD_URL'] || 'N/A'));
    addTagIfNotExist('circleci:job', sanitizeTagValue(process.env['CIRCLE_JOB'] || 'N/A'));
    addTagIfNotExist('circleci:create_time', new Date().toISOString());
    // exposed by custom CLI test environment
    if (global.getTestName) {
      addTagIfNotExist('jest:test_name', sanitizeTagValue(global.getTestName().substr(0, 255) || 'N/A'));
    }
    if (global.getHookName) {
      addTagIfNotExist('jest:hook_name', sanitizeTagValue(global.getHookName().substr(0, 255) || 'N/A'));
    }
    if (global.getDescibeBlocks) {
      global.getDescibeBlocks().forEach((blockName, i) => {
        addTagIfNotExist(`jest:describe_${i + 1}`, sanitizeTagValue(blockName.substr(0, 255) || 'N/A'));
      });
    }

    stateManager.setProjectFileTags(projectPath, tags);
  }
};

export function sanitizeTagValue(value: string): string {
  return value.replace(/[^ a-z0-9_.:/=+\-@]/gi, '');
}

/**
 * Jest runs tests that start at the same time, which can lead to issues 
 * when running amplify init on 4 tests simultaneously.
 * 
 * We need a way to stagger the tests while still taking advantage of Jest-Workers,
 * so the individual tests need a way to communicate with each other & offset their
 * start times.
 * 
 * We can't use the CLI's process to do this either, because the Node.js context 
 * will be unique for each test.
 * 
 * Solution: we can use the file system to create a mutex, and allow the tests
 * to communicate their start times with each other.
 * 
 * @param projectPath 
 */
const staggerInitCalls = async (projectPath: string) => {
  const lock = path.join(projectPath, '..', 'init-lock.txt');
  // one test will create the lock first, 15 seconds should be enough to allow 1 test to do this first without collision risk
  const initialDelay = Math.floor(Math.random() * 15 * 1000);
  await sleep(initialDelay);
  while(true){
    if(fs.existsSync(lock)) {
      await sleep(1 * 1000);// wait
      // console.log("waiting to start");
      continue;
    } else {
      // create a lock file
      try {
        fs.writeFileSync(lock, '');
        console.log("holding lock file", lock);
        await sleep(15 * 1000); // hold the lock for 15 seconds
        fs.unlinkSync(lock);
        break;
      } catch (e){
        // some other test created it first
      }
    }
  }
  console.log("init called:", new Date().toISOString());
}