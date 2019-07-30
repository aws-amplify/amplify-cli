import initProjectWithProfile, { initIosProject, initAndroidProject } from "../init/initProjectHelper";
import { addAuthWithDefault, signUpNewUser } from "../categories/auth";
import { amplifyPushApi, amplifyPush, getProjectMeta } from "../init";
import { addStorageWithDefault } from "../categories/storage";
import { addApiWithSimpleModel, readSchemaDocument } from "../categories/api";
import { existsSync } from "fs";



async function test(projRoot: string, sdk: string, categories: string[]) {
    let addApi: Boolean = false;
    //check sdk
    if (sdk === 'ios') {
        await initIosProject(projRoot, {}, true);
    } else if (sdk === 'android') {
        await initAndroidProject(projRoot, {}, true);
    } else if (sdk === 'js') {
        await initProjectWithProfile(projRoot, {}, true);
    } else {
        console.log('sdk should be "ios", "android" or "js"');
        return;
    }
    //add categories
    if (categories.includes('auth')) {
        await addAuthWithDefault(projRoot, {}, true);
        if (categories.includes('storage')) {
            await addStorageWithDefault(projRoot, {}, true);
        }
        if (categories.includes('api')) {
            addApi = true;
            await addApiWithSimpleModel(projRoot, {}, true);
        }
    } else {
        console.log('The categories input are invalid');
        return;
    }
    //push resources
    if (addApi) {
        await amplifyPushApi(projRoot, true);
    } else {
        await amplifyPush(projRoot, true);
    }

    console.log('The backend resources are set up successfully.');

    //sign up a new user
    await signUpNewUser(projRoot, {}, true);
}

if (process.argv.length <= 3) {
    console.log(
        'Usage: npm run config <project_root> <sdk> [list: categories], you can add auth,storage and api for your project'
        );
    process.exit(1);
}
const projRoot = process.argv[2];
if (!existsSync(projRoot)) {
    console.log('Project path does not exist.');
    process.exit(1);
}

const sdk = process.argv[3];
const categories = process.argv.slice(4);

test(projRoot, sdk, categories);