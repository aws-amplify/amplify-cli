export type AnalyticsDimensions = Record<string, string | number | boolean>;

export interface Analytics {
  logEvent(eventName: string, dimensions?: AnalyticsDimensions): Promise<void>;
}
export class DummyAnalytics implements Analytics {
  logEvent = async (_: string, __?: AnalyticsDimensions) => Promise.resolve();
}
