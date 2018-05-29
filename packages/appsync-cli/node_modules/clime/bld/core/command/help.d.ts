/// <reference types="node" />
import { Command } from '.';
import { Printable } from '../object';
export interface HelpBuildingContext {
    label: string;
    dir: string;
}
export interface HelpInfoBuildPathOptions {
    sequence: string[];
    contexts: HelpBuildingContext[];
    description?: string;
}
export declare type HelpInfoBuildOptions = typeof Command | HelpInfoBuildPathOptions;
export interface SubcommandHelpItem {
    name: string;
    aliases: string[];
    brief: string | undefined;
    group: number;
    overridden?: boolean;
}
export declare class HelpInfo implements Printable {
    private texts;
    readonly text: string;
    buildTextForSubCommands(contexts: HelpBuildingContext[]): Promise<void>;
    print(stdout: NodeJS.WritableStream, stderr: NodeJS.WritableStream): void;
    private buildDescription(description);
    private buildSubcommandsUsage(sequence);
    private buildTextsForParamsAndOptions(TargetCommand);
}
