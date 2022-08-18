import { AmplifyTerminal as Terminal, StringObj } from './terminal';

/**
 * Type for Bar configurations options
 */
export type BarOptions = {
    // Custom formatter functions for main progress bar and item's underneath it
    progressBarFormatter: (payload: ProgressPayload, value: number, total: number) => string,
    itemFormatter: (payload: ItemPayload) => { renderString: string, color: string },
    // Indicates if the progress bar is part of a multiBar or standalone
    loneWolf: boolean,
    hideCursor: boolean,
    // Specify characters for a completed/incomplete bar
    barCompleteChar: string,
    barIncompleteChar : string,
    barSize: number,
    // status which indicates item completion/failure
    itemCompleteStatus: string[],
    itemFailedStatus: string[],
    // Text which appear on top of the progress bar indicating current status along with a spinner.
    prefixText: string,
    successText: string,
    failureText: string
}

/**
 * Type for main progress bar payload
 */
export type ProgressPayload = {
    progressName: string,
    envName: string
}

/**
 * Type for progress bar item payload
 */
export type ItemPayload = {
    LogicalResourceId: string,
    ResourceType: string,
    ResourceStatus: string,
    Timestamp: Date | string,
}

type Item = {
    name: string,
    status: string,
    renderString: string,
    color: string,
    finished: boolean
}

const DEFAULT_BAR_SIZE = 40;

/**
 * Progress bar instance
 */
export class ProgressBar {
    private value: number;
    private total: number;
    private terminal: Terminal;
    private payload!: ProgressPayload;
    private isActive: boolean;
    private options: BarOptions;
    private lastDrawnTime: number;
    private items: Item[];

    barCompleteString: string;
    barIncompleteString: string;
    barSize: number;

    constructor(options: BarOptions) {
      this.terminal = new Terminal();
      this.value = 0;
      this.total = 1;
      this.options = options;
      this.items = [];
      this.isActive = false;
      this.lastDrawnTime = 0;
      this.barSize = options.barSize || DEFAULT_BAR_SIZE;

      this.barCompleteString = (new Array(this.barSize + 1).join(options.barCompleteChar || '='));
      this.barIncompleteString = (new Array(this.barSize + 1).join(options.barIncompleteChar || '-'));
    }

    /**
     * Create bar strings according to progress using the complete and incomplete bar string.
     */
    createBarString() : string {
      const completeSize = Math.round((this.value / this.total) * this.barSize);
      const incompleteSize = this.barSize - completeSize;

      // generate bar string by stripping the pre-rendered strings
      const bar = this.barCompleteString.slice(0, completeSize)
                + this.barIncompleteString.slice(0, incompleteSize);

      return ` [ ${bar} ] ${this.value}/${this.total}`;
    }

    /**
     * Render strings are made by concatenating the progress bar strings with the item strings.
     */
    getRenderStrings() : StringObj[] {
      let finalStrings : StringObj[] = [];
      const progressBar = this.options.progressBarFormatter.call(this, this.payload, this.value, this.total) + this.createBarString();
      finalStrings.push({
        renderString: progressBar,
        color: '',
      });
      finalStrings = this.items.reduce((prev, _current) => prev.concat({
        renderString: `\t${_current.renderString}`,
        color: `${_current.color}`,
      }), finalStrings);
      return finalStrings;
    }

    /**
     * Return current value.
     */
    getValue() : number {
      return this.value;
    }

    /**
     * Render function
     */
    render() : void {
      const stringsToRender = this.getRenderStrings();
      this.terminal.writeLines(stringsToRender);
    }

    /**
     * Checks if progress bar finished.
     */
    isFinished() : boolean {
      return this.value === this.total;
    }

    /**
     * Checks if progress bar failed.
     */
    isFailed() : boolean {
      return this.items.some(item => this.options.itemFailedStatus.includes(item.status));
    }

    /**
     * Starts a progress bar and calls render function.
     */
    start(total: number, startValue: number, payload: ProgressPayload) : void {
      this.value = startValue || 0;
      this.total = total >= 0 ? total : this.total;

      this.payload = payload || {};
      this.lastDrawnTime = Date.now();

      this.isActive = true;

      if (this.options.loneWolf) {
        if (this.options.hideCursor === true) {
          this.terminal.cursor(false);
        }
        this.render();
      }
    }

    /**
     * Stops the progress bar
     */
    stop() : void {
      this.isActive = false;
      if (this.options.loneWolf) {
        if (this.options.hideCursor) {
          this.terminal.cursor(true);
        }
      }
    }

    /**
     * Checks if item exists
     */
    hasItem(name: string) : boolean {
      return !!this.getItem(name);
    }

    /**
     * Returns item if it exists
     */
    getItem(name: string) : Item | undefined {
      return this.items.find(item => item.name === name);
    }

    /**
     * Add a new item
     */
    addItem(name: string, itemPayload: ItemPayload) : void {
      const status = itemPayload.ResourceStatus;
      this.items.push({
        name,
        status,
        ...this.options.itemFormatter.call(this, itemPayload),
        finished: this.options.itemCompleteStatus.includes(status),
      });
      if (this.options.loneWolf) {
        this.render();
      }
    }

    /**
     * Updates an item if it exists.
     */
    updateItem(name: string, newPayload: ItemPayload) : void {
      const newItemsSet = this.items.map(item => {
        let obj = null;
        if (item.name === name) {
          obj = {
            name: item.name,
            status: newPayload.ResourceStatus,
            // Do not update if item has already finished (CloudFormation nuance)
            finished: item.finished || this.options.itemCompleteStatus.includes(newPayload.ResourceStatus),
            ...this.options.itemFormatter.call(this, newPayload),
          };
        }
        return obj || item;
      });
      this.items = newItemsSet;
      if (this.options.loneWolf) {
        this.render();
      }
    }

    /**
     * Increments the progress bar
     */
    increment(value = 1) : void {
      this.value += value;
      if (this.options.loneWolf) {
        this.render();
      }
    }

    /**
     * Finishes the progress bar
     */
    finish() : void {
      const diff = this.total - this.value;
      this.increment(diff);
    }
}
