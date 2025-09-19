import { MultiProgressBar } from '@aws-amplify/amplify-prompts';
import type { StackEvent } from '@aws-sdk/client-cloudformation';
import chalk from 'chalk';
import columnify from 'columnify';
import {
  CFN_SUCCESS_STATUS,
  CNF_ERROR_STATUS,
  createItemFormatter,
  createProgressBarFormatter,
  EventMap,
} from '../utils/progress-bar-helpers';
import { IStackProgressPrinter } from './stack-event-monitor';

/**
 * Iterative deployment stack printer.
 */
export class StackProgressPrinter implements IStackProgressPrinter {
  private events: StackEvent[] = [];
  private progressBars: MultiProgressBar;
  private eventMap: EventMap;
  private categoriesPrinted: string[] = [];

  constructor(eventMap: EventMap) {
    // Initialize the progress bar and event map.
    this.progressBars = new MultiProgressBar({
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

  addActivity = (event: StackEvent): void => {
    this.events.push(event);
    if (this.progressBars.isTTY()) {
      // Create a bar only if corresponding resources events trigger.
      const progressBarsConfigs = [];
      const item = this.eventMap.rootResources.find((it) => it.key === event.LogicalResourceId);
      if (!this.categoriesPrinted.includes('projectBar') && (event.LogicalResourceId === this.eventMap.rootStackName || item)) {
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
        const categoryItem = this.eventMap.categories.find((it) => it.name === category);
        if (categoryItem) {
          progressBarsConfigs.push({
            name: categoryItem.name,
            value: 0,
            total: categoryItem.size,
            payload: {
              progressName: categoryItem?.name,
              envName: this.eventMap.envName,
            },
          });
          this.categoriesPrinted.push(category);
        }
      }
      this.progressBars.create(progressBarsConfigs);
    }
  };

  updateIndexInHeader = (currentIndex: number, totalIndices: number): void => {
    this.progressBars.updatePrefixText(
      `Deploying iterative update ${currentIndex} of ${totalIndices} into ${this.eventMap.envName} environment. This will take a few minutes.`,
    );
  };

  print = (): void => {
    if (this.progressBars.isTTY()) {
      this.printEventProgress();
    } else {
      this.printDefaultLogs();
    }
  };

  printEventProgress = (): void => {
    if (this.events.length > 0) {
      this.events = this.events.reverse();
      this.events.forEach((event) => {
        const finishStatus = CFN_SUCCESS_STATUS.includes(event.ResourceStatus);
        const updateObj = {
          name: event.LogicalResourceId,
          payload: {
            LogicalResourceId: event.LogicalResourceId,
            ResourceType: event.ResourceType,
            ResourceStatus: event.ResourceStatus,
            Timestamp: event.Timestamp.toString(),
          },
        };
        const item = this.eventMap.rootResources.find((it) => it.key === event.LogicalResourceId);
        if (event.LogicalResourceId === this.eventMap.rootStackName || item) {
          // If the root resource for a category has already finished, then we do not have to wait for all events under it.
          if (finishStatus && item && item.category) {
            this.progressBars.finishBar(item.category);
          }
          this.progressBars.updateBar('projectBar', updateObj);
        } else if (this.eventMap.eventToCategories) {
          const category = this.eventMap.eventToCategories.get(event.LogicalResourceId);
          if (category) {
            this.progressBars.updateBar(category, updateObj);
          }
        }
      });
      this.events = [];
    }
  };

  printDefaultLogs = (): void => {
    // CFN sorts the events by descending
    this.events = this.events.reverse();
    if (this.events.length > 0) {
      console.log('\n');
      const COLUMNS = ['ResourceStatus', 'LogicalResourceId', 'ResourceType', 'Timestamp', 'ResourceStatusReason'];

      const e = this.events.map((ev) => {
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

  finishBars = (): void => {
    this.progressBars.finishAllBars();
  };

  stopBars = (): void => {
    this.progressBars.stop();
  };

  isRunning = (): boolean => this.progressBars.getBarCount() !== 0;
}
