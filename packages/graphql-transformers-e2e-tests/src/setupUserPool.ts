import {
    signupAndAuthenticateUser, createGroup, addUserToGroup,
    configureAmplify
} from './cognitoUtils';

const USERNAME1 = 'user1@test.com'
const USERNAME2 = 'user2@test.com'
const USERNAME3 = 'user3@test.com'
const TMP_PASSWORD = 'Password123!'
const REAL_PASSWORD = 'Password1234!'

const ADMIN_GROUP_NAME = 'Admin';
const DEVS_GROUP_NAME = 'Devs';
const PARTICIPANT_GROUP_NAME = 'Participant';
const WATCHER_GROUP_NAME = 'Watcher';

export async function setupUserPool(
    userPoolId: string,
    userPoolClientId: string
) {
    configureAmplify(userPoolId, userPoolClientId)

    await signupAndAuthenticateUser(userPoolId, USERNAME1, TMP_PASSWORD, REAL_PASSWORD)
    await signupAndAuthenticateUser(userPoolId, USERNAME2, TMP_PASSWORD, REAL_PASSWORD)
    const authRes3: any = await signupAndAuthenticateUser(userPoolId, USERNAME3, TMP_PASSWORD, REAL_PASSWORD)

    await createGroup(userPoolId, ADMIN_GROUP_NAME)
    await createGroup(userPoolId, PARTICIPANT_GROUP_NAME)
    await createGroup(userPoolId, WATCHER_GROUP_NAME)
    await createGroup(userPoolId, DEVS_GROUP_NAME)
    await addUserToGroup(ADMIN_GROUP_NAME, USERNAME1, userPoolId)
    await addUserToGroup(PARTICIPANT_GROUP_NAME, USERNAME1, userPoolId)
    await addUserToGroup(WATCHER_GROUP_NAME, USERNAME1, userPoolId)
    await addUserToGroup(DEVS_GROUP_NAME, USERNAME2, userPoolId)
    const authResAfterGroup: any = await signupAndAuthenticateUser(userPoolId, USERNAME1, TMP_PASSWORD, REAL_PASSWORD)

    const idToken = authResAfterGroup.getIdToken().getJwtToken()

    const accessToken = authResAfterGroup.getAccessToken().getJwtToken()

    const authRes2AfterGroup: any = await signupAndAuthenticateUser(userPoolId, USERNAME2, TMP_PASSWORD, REAL_PASSWORD)
    const idToken2 = authRes2AfterGroup.getIdToken().getJwtToken()
    const idToken3 = authRes3.getIdToken().getJwtToken()
    return [idToken, idToken2, idToken3];
}