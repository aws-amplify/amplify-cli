import { $TSAny } from 'amplify-cli-core';
import { ListQuestion, ConfirmQuestion, PasswordQuestion } from 'inquirer';
export declare function authTypeQuestion(choices: {
    name: string;
    value: string;
}[]): ListQuestion;
export declare function profileNameQuestion(profiles: string[], defaultProfile: string): ListQuestion;
export declare function accessKeysQuestion(accessKeyDefault: $TSAny, secretAccessKeyDefault: $TSAny, defaultRegion: string, accessKeyValidator: $TSAny, secretAccessKeyValidator: $TSAny, transformer: $TSAny): (PasswordQuestion | ListQuestion)[];
export declare const createConfirmQuestion: ConfirmQuestion;
export declare const removeProjectConfirmQuestion: ConfirmQuestion;
export declare const updateOrRemoveQuestion: ListQuestion;
export declare const retryAuthConfig: ConfirmQuestion;
//# sourceMappingURL=configuration-questions.d.ts.map