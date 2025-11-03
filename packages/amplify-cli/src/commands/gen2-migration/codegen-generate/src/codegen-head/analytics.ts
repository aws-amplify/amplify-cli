export type AnalyticsDimensions = Record<string, string | number | boolean>;

export interface Analytics {
  logEvent(eventName: string, dimensions?: AnalyticsDimensions): Promise<void>;
}
export class AppAnalytics implements Analytics {
  constructor(private appId: string) {}
  logEvent = async () => Promise.resolve();
}
