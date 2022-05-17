/**
 * Class to record duration of interactions
 */
export class Stopwatch {
    private _currentState : StopwatchState = StopwatchState.IDLE
    private _slices: Slice [] = []

    start = (): void => {
      this._currentState = StopwatchState.RUNNING;
      const now = Date.now();
      this._slices.push({
        start: now,
      });
    }

    /**
     * stops the time and reset
     */
    stop = () : void => {
      this._currentState = StopwatchState.IDLE;
      this._slices.length = 0;
    }

    /**
     * pauses the time call start to resume
     */
    pause = (): void => {
      if (this._currentState === StopwatchState.IDLE) {
        throw new Error('Cannot pause no timer running');
      }

      if (this._currentState === StopwatchState.PAUSED) {
        throw new Error('Cannot pause already paused');
      }

      this._currentState = StopwatchState.PAUSED;
      if (this._slices.length < 1) {
        throw new Error('');
      }
      const latestItem = this._slices[this._slices.length - 1];


      latestItem.stop = Date.now();
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
enum StopwatchState {
    IDLE,
    RUNNING,
    PAUSED,
}
