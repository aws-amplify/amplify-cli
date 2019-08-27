import { isCI } from "../utils";
import * as nexpect from 'nexpect';
import { getCLIPath } from '../utils/index';

// add convert resource
export function addConvert(
  cwd: string,
  settings: any,
  verbose: boolean = !isCI()
  ) {
      const resourceName = 'convertTest1';
      return new Promise((resolve, reject) => {
        nexpect
        .spawn(getCLIPath(), ['predictions', 'add'], { cwd, stripColors: true, verbose } )
        .wait('Please select from one of the categories below')
        // j = down arrow
        .sendline('j')
        .sendline('\r')
        .wait('What would you like to convert?')
        .sendline('\r')
        .wait('Provide a friendly name for your resource')
        .sendline(`${resourceName}\r`)
        .wait('What is the source language?')
        .sendline('\r')
        .wait('What is the target language?')
        .sendline('\r')
        .wait('Who should have access?')
        .sendline('j')
        .sendline('\r')
        .sendEof()
        // .send
        .run(function(err: Error) {
          if (!err) {
            resolve(resourceName);
          } else {
            reject(err);
          }
        })
    })
}

// add identify test
export function addIdentifyCollection(
    cwd: string,
    settings: any,
    verbose: boolean = !isCI()
    ) {
        const resourceName = 'identifyCollectionTest1';
        return new Promise((resolve, reject) => {
          nexpect
          .spawn(getCLIPath(), ['predictions', 'add'], { cwd, stripColors: true, verbose } )
          .wait('Please select from one of the categories below')
          // j = down arrow
          // .sendline('j')
          .sendline('\r')
          .wait('What would you like to identify?')
          .sendline('j')
          .sendline('\r')
          .wait('Provide a friendly name for your resource')
          .sendline(`${resourceName}\r`)
          .wait('Would you like use the default configuration?')
          .sendline('j')
          .sendline('\r')
          .wait('Would you like to enable celebrity detection?')
          .sendline('y\r')
          .wait('Would you like to identify entities from a collection of images?')
          .sendline('y\r')
          .wait('How many entities would you like to identify?')
          .sendline('\r')
          .wait('Would you like to allow users to add images to this collection?')
          .sendline('y\r')
          .wait('Who should have access?')
          .sendline('j\r')
          .wait('The CLI would be provisioning an S3 bucket')
          .sendline('\r')
          .sendEof()
          // .send
          .run(function(err: Error) {
            if (!err) {
              resolve(resourceName);
            } else {
              reject(err);
            }
          })
      })
}

// add interpret resource
export function addInterpret(
  cwd: string,
  settings: any,
  verbose: boolean = !isCI()
  ) {
    const resourceName = 'interpretTest1';
      return new Promise((resolve, reject) => {
        nexpect
        .spawn(getCLIPath(), ['add', 'predictions'], { cwd, stripColors: true, verbose } )
        .wait('Please select from one of the categories below')
        // j = down arrow
        .sendline('jj')
        .wait('What would you like to interpret?')
        .sendline('\r')
        .wait('Provide a friendly name for your resource')
        .sendline(`${resourceName}\r`)
        .wait('What kind of interpretation would you like?')
        .sendline('k')
        .wait('Who should have access?')
        .sendline('j')
        .sendEof()
        .run(function(err: Error) {
          if (!err) {
            resolve(resourceName);
          } else {
            reject(err);
          }
        })
    })
}
