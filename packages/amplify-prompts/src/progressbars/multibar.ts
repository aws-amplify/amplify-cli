/**
 * This class has been made as generic as possible to suit all use cases.
 * But it is not without influence from the nuances of CloudFormation.
*/
import { AmplifyTerminal as Terminal, StringObj } from './terminal';
import {
  ProgressBar as Bar,
  BarOptions,
  ItemPayload,
  ProgressPayload,
} from './progressbar';

/**
 * Abstraction to create multiple progress bars inside one re writable block.
 */
export class MultiProgressBar {
    private count : number;
    private terminal : Terminal;
    private options : BarOptions;
    private bars : {name: string, bar: Bar}[];
    private lastDrawnTime: number;
    isActive: boolean;
    private refreshRate: number;
    private frameCount : number;
    private frames : string[];
    private timer!: ReturnType<typeof setTimeout>;
    private prefixText : string;
    private updated: boolean;
    private lastDrawnStrings : StringObj[];

    constructor(options : BarOptions) {
      this.terminal = new Terminal();
      this.options = options;
      this.bars = [];

      if (this.options.hideCursor === true) {
        this.terminal.cursor(false);
      }

      this.lastDrawnTime = Date.now();
      this.isActive = false;
      this.count = 0;

      this.frameCount = 0;

      // simulate spinner
      this.frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
      this.prefixText = options.prefixText;
      this.refreshRate = 200;

      // Tracks when an update into one of the the bars happens
      this.updated = false;
      this.lastDrawnStrings = [];
    }

    /**
     * Checks if the environment is tty
     */
    isTTY() : boolean {
      return this.terminal.isTTY();
    }

    /**
     * Writes lines into the re writable block
     */
    writeLines(prefixText: StringObj) : void {
      let barStrings : StringObj[] = [];
      let stringsToRender : StringObj[] = [];
      if (Object.keys(prefixText).length !== 0) {
        stringsToRender.push(prefixText);
      }
      // Only call on the render strings for the individual bar if an update happened.
      if (this.updated) {
        barStrings = this.bars.reduce((prev, _current) => prev.concat(_current.bar.getRenderStrings()), barStrings);
        stringsToRender = stringsToRender.concat(barStrings);
        this.lastDrawnStrings = barStrings;
      } else {
        // Use the cached last drawn strings if no update
        stringsToRender = stringsToRender.concat(this.lastDrawnStrings);
      }
      this.terminal.writeLines(stringsToRender);
    }

    /**
     * Render function which is called repeatedly
     */
    render() : void {
      let initLine = {} as StringObj;
      if (this.timer) {
        clearTimeout(this.timer);
      }
      // Init line is prefix text plus spinner
      if (this.prefixText.length) {
        initLine = {
          renderString: `${this.prefixText} ${this.frames[this.frameCount]}`,
          color: '',
        };
      }
      this.writeLines(initLine);

      this.frameCount = ++this.frameCount % this.frames.length;
      this.lastDrawnTime = Date.now();

      // Enter a newLine in nonTTY mode
      if (!this.isTTY()) {
        this.terminal.newLine();
      }
      // Reset updated flag
      this.updated = false;

      this.timer = setTimeout(this.render.bind(this), this.refreshRate);
    }

    /**
     * Returns bar indexed by name
     */
    getBar(name: string) : { name: string, bar: Bar } | undefined {
      return this.bars.find(obj => obj.name === name);
    }

    /**
     * Updates a progress bar by adding/updating item or increments the bar
     */
    updateBar(name: string, updateObj: { name: string, payload: ItemPayload }) : void {
      const barDetails = this.getBar(name);
      if (!barDetails) {
        return;
      }
      const barToUpdate = barDetails.bar;
      const item = barToUpdate.getItem(updateObj.name);

      let finishedStatus = false;
      let itemFailure = false;

      if (item) {
        finishedStatus = item.finished;
        itemFailure = this.options.itemFailedStatus.includes(item.status);
        // We do not update the item status if it has already failed.
        if (item.status !== updateObj.payload.ResourceStatus && !itemFailure) {
          barToUpdate.updateItem(updateObj.name, updateObj.payload);
          this.updated = true;
        }
      } else {
        barToUpdate.addItem(updateObj.name, updateObj.payload);
        this.updated = true;
      }
      // Since items can have multiple finished states (CloudFormation nuance),
      // we do not increment the progress bar if it has already failed/succeeded.
      if (this.options.itemCompleteStatus.includes(updateObj.payload.ResourceStatus) && !finishedStatus && !itemFailure) {
        barToUpdate.increment();
        this.updated = true;
      }
    }

    /**
     * Increments value of a bar indexed by name
     */
    incrementBar(name: string, value: number) : void {
      const barDetails = this.getBar(name);
      if (!barDetails) {
        return;
      }
      const barToUpdate = barDetails.bar;
      barToUpdate.increment(value);
      this.updated = true;
    }

    /**
     * Finishes a bar indexed by name
     */
    finishBar(name: string) : void {
      const barDetails = this.getBar(name);
      if (!barDetails) {
        return;
      }
      const barToUpdate = barDetails.bar;
      if (!barToUpdate.isFinished() && !barToUpdate.isFailed()) {
        barToUpdate.finish();
        this.updated = true;
      }
    }

    /**
     * Finish all bars
     */
    finishAllBars() : void {
      this.bars.forEach(bar => this.finishBar(bar.name));
    }

    /**
     * Creates a set of progress bars under the multi bar
     */
    create(bars: {
        name: string,
        value: number,
        total: number,
        payload: ProgressPayload
    }[]) : void {
      if (!this.bars.length) {
        this.terminal.newLine();
        if (this.options.hideCursor === true) {
          this.terminal.cursor(false);
        }
        this.isActive = true;
      }
      bars.forEach(config => {
        const newBar = new Bar(this.options);
        newBar.start(config.total, config.value, config.payload);
        this.bars.push({ name: config.name, bar: newBar });
        this.count += 1;
      });
      if (bars.length) {
        this.updated = true;
        this.render();
      }
      this.count += bars.length;
    }

    /**
     * Returns count of progress bars under the multi bar
     */
    getBarCount() : number {
      return this.count;
    }

    /**
     * Stop all progress bars under the multi bar
     */
    stop() : void {
      this.isActive = false;
      clearTimeout(this.timer);

      // Change prefix text according to success/failure
      let initLine : StringObj = {
        renderString: this.options.successText || '',
        color: 'green',
      };
      for (const { bar } of this.bars) {
        if (bar.isFailed()) {
          initLine = {
            renderString: this.options.failureText || '',
            color: 'red',
          };
          break;
        }
      }
      this.writeLines(initLine);

      // Stop each bar and also enter a new line.
      this.bars.forEach(bar => bar.bar.stop());
      this.bars = [];
      this.count = 0;
      if (this.options.hideCursor) {
        this.terminal.cursor(true);
      }
      this.terminal.newLine();
    }
}
