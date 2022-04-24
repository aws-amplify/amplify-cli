/**
 * Used to record the amount of time a code path took
 */
export class Timer {
  private startTime: number
  private constructor(readonly initialTime?: number) {
    this.startTime = initialTime ?? Date.now();
  }

  /**
   * Start a new timer instance
   */
  static start(startTime?: number): Timer {
    return new Timer(startTime);
  }

  /**
   * Stop the timer
   */
  stop(): number {
    return Date.now() - this.startTime;
  }
}
