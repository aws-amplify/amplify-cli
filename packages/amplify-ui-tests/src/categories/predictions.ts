import { isCI, getCLIPath } from "../utils";
import * as nexpect from 'nexpect';

export function addIdentityText (
    cwd: string,
    settings: any = {},
    verbose: boolean = !isCI()
) {
    return new Promise((resolve, reject) => {
        nexpect
          .spawn(getCLIPath(), ['add', 'predictions'], {cwd, stripColors: true, verbose})
          .wait('Please select from one of the categories below')
          .sendline('\r')
          .wait('What would you like to identify?')
          .sendline('\r')
          .wait('Provide a friendly name for your resource')
          .sendline('\r')
          .wait('Would you also like to identify documents?')
          .sendline('y\r')
          .wait('Who should have access?')
          .sendline('j\r')
          .run((err: Error) => {
              if (err) {
                  reject(err);
              } else {
                  resolve();
              }
          });
    });
}

export function addConvertWithDefault(
    cwd: string,
    settings: any = {},
    verbose: boolean = !isCI()
) {
    return new Promise((resolve, reject) => {
        nexpect
          .spawn(getCLIPath(), ['add', 'predictions'], {cwd, stripColors: true, verbose})
          .wait('Please select from one of the categories below')
          .sendline('j\r')
          .wait('What would you like to convert?')
          .sendline('\r')
          .wait('Provide a friendly name for your resource')
          .sendline('\r')
          .wait('What is the source language?')
          .sendline('\r')
          .wait('What is the target language?')
          .sendline('\r')
          .wait('Who should have access?')
          .sendline('j\r')
          .run((err: Error) => {
              if (err) {
                  reject(err);
              } else {
                  resolve();
              }
          });
    });
}