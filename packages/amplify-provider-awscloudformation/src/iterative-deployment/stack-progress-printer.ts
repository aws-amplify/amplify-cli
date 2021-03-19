import { StackEvent, StackEvents } from 'aws-sdk/clients/cloudformation';
import { IStackProgressPrinter } from './stack-event-monitor';
import columnify from 'columnify';
import chalk from 'chalk';
import ora, { Ora } from 'ora';

const CFN_SUCCESS_STATUS = ['UPDATE_COMPLETE', 'CREATE_COMPLETE', 'DELETE_COMPLETE', 'DELETE_SKIPPED'];

const CNF_ERROR_STATUS = ['CREATE_FAILED', 'DELETE_FAILED', 'UPDATE_FAILED'];
export class StackProgressPrinter implements IStackProgressPrinter {
  private events: StackEvents = [];
  private isRunning: boolean = true;
  private spinner: Ora = ora('Deploying');
  addActivity = (event: StackEvent) => {
    this.events.push(event);
  };
  print = () => {
    // CFN sorts the events by descending
    this.events = this.events.reverse();
    if (this.events.length > 0 && this.isRunning) {
      console.log('\n');
      const COLUMNS = ['ResourceStatus', 'LogicalResourceId', 'ResourceType', 'Timestamp', 'ResourceStatusReason'];

      const e = this.events.map(ev => {
        const res: Record<string, string> = {};
        const { ResourceStatus: resourceStatus } = ev;

        let colorFn = chalk.reset;
        if (CNF_ERROR_STATUS.includes(resourceStatus!)) {
          colorFn = chalk.red;
        } else if (CFN_SUCCESS_STATUS.includes(resourceStatus!)) {
          colorFn = chalk.green;
        }

        Object.entries(ev)
          .filter(([name, value]) => COLUMNS.includes(name))
          .forEach(([name, value]) => {
            res[name] = colorFn(value);
          });

        return res;
      });
      console.log(
        columnify(e, {
          columns: COLUMNS,
          showHeaders: false,
        }),
      );
      this.events = [];
    }
  };
  start = () => {
    this.isRunning = true;
  };
  stop = () => {
    this.spinner.stop();
  };
}
