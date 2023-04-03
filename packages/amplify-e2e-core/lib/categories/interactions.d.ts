export declare const addSampleInteraction: (cwd: string) => Promise<void>;
export declare const addInteractionsWithBotFromScratch: (cwd: string, settings: {
    intentName: string;
    slotName: string;
    slotType: string;
    slotDescription: string;
    slotValue: string;
}) => Promise<void>;
export declare const updateInteractions: (cwd: string, settings: {
    slotName: string;
}) => Promise<void>;
