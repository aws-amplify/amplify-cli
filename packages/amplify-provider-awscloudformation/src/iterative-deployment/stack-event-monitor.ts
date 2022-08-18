import { StackEvent } from 'aws-sdk/clients/cloudformation';
import { fileLogger, Logger } from '../utils/aws-logger';
import * as aws from 'aws-sdk';
export interface StackEventMonitorOptions {
  pollDelay: number;
}
export interface IStackProgressPrinter {
  addActivity: (activity: StackEvent) => void;
  print: () => void;
  printEventProgress: () => void;
  printDefaultLogs: () => void;
  finishBars: () => void;
  stopBars: () => void;
  isRunning: () => boolean;
}
export class StackEventMonitor {
  private active = false;
  private tickTimer?: NodeJS.Timeout;
  private options: StackEventMonitorOptions;
  private readPromise?: Promise<any>;
  private startTime: number = Date.now();
  private activity: Record<string, StackEvent> = {};
  private completedStacks: Set<string> = new Set();
  private stacksBeingMonitored: string[] = [this.stackName];
  private lastPolledStackIndex = 0;
  private logger: Logger;

  constructor(
    private cfn: aws.CloudFormation,
    private stackName: string,
    private printerFn: () => void,
    private addEventActivity: (event) => void,
    options?: StackEventMonitor,
  ) {
    this.options = { pollDelay: 5_000, ...options };
    this.logger = fileLogger('stack-event-monitor');
    this.printerFn = printerFn;
  }

  public start() {
    this.active = true;
    this.scheduleNextTick();
    return this;
  }

  public async stop() {
    this.active = false;
    if (this.tickTimer) {
      clearTimeout(this.tickTimer);
    }

    // Do a final poll for all events. This is to handle the situation where DescribeStackStatus
    // already returned an error, but the monitor hasn't seen all the events yet and we'd end
    // up not printing the failure reason to users.
    await this.finalPollToEnd();
  }

  private scheduleNextTick() {
    if (!this.active) {
      return;
    }

    this.tickTimer = setTimeout(() => this.tick(), this.options.pollDelay) as any;
  }

  private async tick() {
    if (!this.active) {
      return;
    }

    try {
      this.readPromise = this.readNewEvents();
      await this.readPromise;
      this.readPromise = undefined;

      // We might have been stop()ped while the network call was in progress.
      if (!this.active) {
        return;
      }

      this.printerFn();
    } catch (e) {
      this.logger('scheduleNextTick', [])(e);
      if (e && e.code !== 'Throttling') e.message = 'Error occurred while monitoring stack:' + e.message;
      throw e;
    }
    this.scheduleNextTick();
  }

  /**
   * Reads all new events from the stack history
   *
   * The events are returned in reverse chronological order; we continue to the next page if we
   * see a next page and the last event in the page is new to us (and within the time window).
   * haven't seen the final event
   */
  private async readNewEvents(): Promise<void> {
    const events: StackEvent[] = [];
    this.lastPolledStackIndex = (this.lastPolledStackIndex + 1) % this.stacksBeingMonitored.length;
    const stackName = this.stacksBeingMonitored[this.lastPolledStackIndex];
    if (!stackName) {
      return;
    }
    try {
      let nextToken: string | undefined;
      let finished = false;
      while (!finished) {
        const response = await this.cfn
          .describeStackEvents({
            StackName: stackName,
            NextToken: nextToken,
          })
          .promise();
        const eventPage = response?.StackEvents ?? [];

        for (const event of eventPage) {
          // Event from before we were interested in 'em
          if (event.Timestamp.valueOf() < this.startTime) {
            finished = true;
            break;
          }

          // Already seen this one
          if (event.EventId in this.activity) {
            finished = true;
            break;
          }

          if (event.ResourceType === 'AWS::CloudFormation::Stack') {
            this.processNestedStack(event);
            // Dont' render info about the stack itself
            continue;
          }

          // Fresh event
          events.push((this.activity[event.EventId] = event));
        }

        // We're also done if there's nothing left to read
        nextToken = response?.NextToken;
        if (nextToken === undefined) {
          finished = true;
        }
      }
    } catch (e) {
      this.logger('readNewEvents', [])(e);
      if (e.code === 'ValidationError' && e.message === `Stack [${this.stackName}] does not exist`) {
        return;
      }
      if (e.code === 'Throttling') {
        // ignore throttling error
      } else {
        throw e;
      }
    }

    events.reverse();
    for (const event of events) {
      this.addEventActivity(event);
    }
  }

  private processNestedStack(event: StackEvent) {
    if (event.ResourceType === 'AWS::CloudFormation::Stack') {
      const physicalResourceId = event.PhysicalResourceId!;
      const idx = this.stacksBeingMonitored.indexOf(physicalResourceId);
      if (idx >= 0 && event.ResourceStatus!.endsWith('_COMPLETE') && physicalResourceId !== this.stackName) {
        this.stacksBeingMonitored.splice(idx, 1);
        this.completedStacks.add(physicalResourceId);
      } else if (!this.completedStacks.has(physicalResourceId)) {
        this.stacksBeingMonitored.push(physicalResourceId);
      }
    }
  }

  /**
   * Perform a final poll to the end and flush out all events to the printer
   *
   * Finish any poll currently in progress, then do a final one until we've
   * reached the last page.
   */
  private async finalPollToEnd() {
    // If we were doing a poll, finish that first. It was started before
    // the moment we were sure we weren't going to get any new events anymore
    // so we need to do a new one anyway. Need to wait for this one though
    // because our state is single-threaded.
    if (this.readPromise) {
      await this.readPromise;
    }

    await this.readNewEvents();

    // Final print
    this.printerFn();
  }
}
