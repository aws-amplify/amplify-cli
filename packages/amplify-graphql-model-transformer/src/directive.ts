/**
 * SubscriptionLevel
 */
export enum SubscriptionLevel {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  off = 'off',
  // eslint-disable-next-line @typescript-eslint/naming-convention
  public = 'public',
  // eslint-disable-next-line @typescript-eslint/naming-convention
  on = 'on',
}

/**
 * ModelDirectiveConfiguration
 */
export type ModelDirectiveConfiguration = {
  queries?: Partial<{
    get: Partial<string>;
    list: Partial<string>;
    sync: Partial<string>;
  }>;
  mutations: Partial<{
    create: Partial<string>;
    update: Partial<string>;
    delete: Partial<string>;
  }>;
  subscriptions: Partial<{
    onCreate: Partial<string>[];
    onUpdate: Partial<string>[];
    onDelete: Partial<string>[];
    level: SubscriptionLevel;
  }>;
  timestamps: Partial<{
    createdAt: Partial<string>;
    updatedAt: Partial<string>;
  }>;
};
