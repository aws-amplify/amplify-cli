/**
 * Used to record the amount of time a code path took
 */
export class Timer {
  private startTime: number | undefined;
  /**
   * Start the timer
   */
  start(): void {
    if (this.startTime) {
      throw new Error('Timer has already been started and cannot be restarted');
    }
    this.startTime = Date.now();
  }

  /**
   * Stop the timer
   */
  stop(): number {
    if (!this.startTime) {
      throw new Error('Timer is not running');
    }
    return Date.now() - this.startTime;
  }
}
