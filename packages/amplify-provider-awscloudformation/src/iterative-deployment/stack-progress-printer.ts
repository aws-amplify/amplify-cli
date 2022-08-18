/* eslint-disable spellcheck/spell-checker */
import { StackEvent, StackEvents } from 'aws-sdk/clients/cloudformation';
import columnify from 'columnify';
import chalk from 'chalk';
import { MultiProgressBar } from 'amplify-prompts';
import { IStackProgressPrinter } from './stack-event-monitor';
import {
  createProgressBarFormatter,
  createItemFormatter,
  CFN_SUCCESS_STATUS,
  CNF_ERROR_STATUS,
  EventMap,
} from '../utils/progress-bar-helpers';
/**
 * Iterative deployment stack printer.
 */
export class StackProgressPrinter implements IStackProgressPrinter {
  private events: StackEvents = [];
  private progressBar: MultiProgressBar;
  private eventMap: EventMap;
  private categoriesPrinted: string[] = [];

  constructor(eventMap: EventMap) {
    // Initialize the progress bar and event map.
    this.progressBar = new MultiProgressBar({
      progressBarFormatter: createProgressBarFormatter,
      itemFormatter: createItemFormatter,
      loneWolf: false,
      hideCursor: true,
      barSize: 40,
      itemCompleteStatus: CFN_SUCCESS_STATUS,
      itemFailedStatus: CNF_ERROR_STATUS,
      prefixText: `Deploying resources into ${eventMap.envName} environment. This will take a few minutes.`,
      successText: 'Deployment completed.',
      failureText: 'Deployment failed.',
      barCompleteChar: '=',
      barIncompleteChar: '-',
    });
    this.eventMap = eventMap;
  }

  addActivity = (event: StackEvent) : void => {
    this.events.push(event);
    if (this.progressBar.isTTY()) {
      // Create a bar only if corresponding resources events trigger.
      const progressBarsConfigs = [];
      const item = this.eventMap.rootResources.find(it => it.key === event.LogicalResourceId);
      if (
        !this.categoriesPrinted.includes('projectBar')
        && (event.LogicalResourceId === this.eventMap.rootStackName || item)) {
        progressBarsConfigs.push({
          name: 'projectBar',
          value: 0,
          total: 1 + this.eventMap.rootResources.length,
          payload: {
            progressName: `root stack-${this.eventMap.projectName}`,
            envName: this.eventMap.envName,
          },
        });
        this.categoriesPrinted.push('projectBar');
      }

      const category = this.eventMap.eventToCategories.get(event.LogicalResourceId);
      if (category && !this.categoriesPrinted.includes(category)) {
        const categoryItem = this.eventMap.categories.find(it => it.name === category);
        progressBarsConfigs.push({
          name: categoryItem.name,
          value: 0,
          total: categoryItem.size,
          payload: {
            progressName: categoryItem.name,
            envName: this.eventMap.envName,
          },
        });
        this.categoriesPrinted.push(category);
      }
      this.progressBar.create(progressBarsConfigs);
    }
  };

  print = () : void => {
    if (this.progressBar.isTTY()) {
      this.printEventProgress();
    } else {
      this.printDefaultLogs();
    }
  }

  printEventProgress = () : void => {
    this.events = this.events.reverse();
    if (this.events.length > 0) {
      this.events.forEach(event => {
        const finishStatus = CFN_SUCCESS_STATUS.includes(event.ResourceStatus);
        const updateObj = {
          name: event.LogicalResourceId,
          payload: {
            LogicalResourceId: event.LogicalResourceId,
            ResourceType: event.ResourceType,
            ResourceStatus: event.ResourceStatus,
            Timestamp: event.Timestamp,
          },
        };
        const item = this.eventMap.rootResources.find(it => it.key === event.LogicalResourceId);
        if (event.LogicalResourceId === this.eventMap.rootStackName || item) {
          // If the root resource for a category has already finished, then we do not have to wait for all events under it.
          if (finishStatus && item && item.category) {
            this.progressBar.finishBar(item.category);
          }
          this.progressBar.updateBar('projectBar', updateObj);
        } else if (this.eventMap.eventToCategories) {
          const category = this.eventMap.eventToCategories.get(event.LogicalResourceId);
          if (category) {
            this.progressBar.updateBar(category, updateObj);
          }
        }
      });
      this.events = [];
    }
  }

  printDefaultLogs = () : void => {
    // CFN sorts the events by descending
    this.events = this.events.reverse();
    if (this.events.length > 0) {
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
          .filter(([name]) => COLUMNS.includes(name))
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

  finishBars = () : void => {
    this.progressBar.finishAllBars();
  }

  stopBars = () : void => {
    this.progressBar.stop();
  }

  isRunning = () : boolean => this.progressBar.getBarCount() !== 0;
}
