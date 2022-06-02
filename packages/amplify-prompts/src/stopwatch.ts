/**
 * Class to record duration of interactions
 */
export class Stopwatch {
    private _slices: Slice [] = []

    start = (): void => {
      const now = Date.now();
      this._slices.push({
        start: now,
      });
    }

    /**
     * stops the time and reset
     */
    stop = () : void => {
      this._slices.length = 0;
    }

    /**
     * pauses the time call start to resume
     */
    pause = (): void => {
      const latestSlice = this._slices[this._slices.length - 1];
      if (!latestSlice) {
        return;
      }

      latestSlice.stop = Date.now();
    }

    /**
     * get the total elapsed time
     */
    getElapsedMilliseconds = (): number => this._slices
      .reduce((accumulator, currentValue) => accumulator + ((currentValue.stop || Date.now()) - currentValue.start), 0);
}

type Slice = {
    start: number;
    stop?: number;
}
