import { APITest } from './api';


export async function start(context) {
    const testApi = new APITest();
    try {
        testApi.start(context);
    } catch(e) {
        console.log(e);
        // Sending term signal so we clean up after ourself
        process.kill(process.pid, 'SIGTERM');
    }

}