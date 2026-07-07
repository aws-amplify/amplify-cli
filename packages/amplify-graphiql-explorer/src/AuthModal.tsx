import React, { Component } from 'react';
import { Button, Form, Modal, Dropdown, Input, TextArea, Label } from 'semantic-ui-react';
import { generateToken, parse } from './utils/jwt';

export enum AUTH_MODE {
  API_KEY = 'API_KEY',
  AMAZON_COGNITO_USER_POOLS = 'AMAZON_COGNITO_USER_POOLS',
  OPENID_CONNECT = 'OPENID_CONNECT',
  AWS_IAM = 'AWS_IAM',
}

type State = {
  currentCognitoToken?: string;
  currentOIDCToken: string;
  currentOIDCTokenDecoded?: string;
  currentAuthMode: AUTH_MODE;
  userName?: string;
  userGroups: string[];
  email?: string;
  additionalFields?: string;
  issuer?: string;
  apiKey?: string;
  possibleGroups: string[];
  isOpen: boolean;
  supportedAuthModes: AUTH_MODE[];
  oidcTokenError: string;
  iamRole: 'auth' | 'unAuth';
};

type Props = {
  onClose: Function;
  authModes: AUTH_MODE[];
  selectedAuthMode: AUTH_MODE;
  currentCognitoToken?: string;
  currentOIDCToken?: string;
  iamRole?: 'Auth' | 'UnAuth';
  apiKey?: string;
};
export class AuthModal extends Component<Props, State> {
  state: State = {
    currentCognitoToken: '',
    currentOIDCTokenDecoded: '',
    currentOIDCToken: '',
    userName: '',
    issuer: '',
    userGroups: [],
    apiKey: '',
    possibleGroups: [],
    email: '',
    supportedAuthModes: [AUTH_MODE.API_KEY],
    isOpen: true,
    currentAuthMode: AUTH_MODE.API_KEY,
    oidcTokenError: '',
    iamRole: 'auth',
  };

  constructor(props) {
    super(props);

    const decodedToken = this.parseJWTToken(this.props.currentCognitoToken) || {};
    let state = {
      userName: decodedToken['cognito:username'] || '',
      userGroups: decodedToken['cognito:groups'] || [],
      issuer: decodedToken['iss'],
      email: decodedToken['email'],
      possibleGroups: decodedToken['cognito:groups'] || [],
    };

    const jwtFieldsToFilter = [
      'cognito:username',
      'cognito:groups',
      'iss',
      'email',
      'sub',
      'aud',
      'exp',
      'event_id',
      'iat',
      'algorithm',
      'auth_time',
    ];
    const additionalFields = Object.keys(decodedToken)
      .filter((k) => !jwtFieldsToFilter.includes(k))
      .reduce((acc, k) => ({ ...acc, [k]: decodedToken[k] }), {});

    this.state = {
      ...this.state,
      ...state,
      additionalFields: JSON.stringify(additionalFields, null, 4),
      currentCognitoToken: this.props.currentCognitoToken || '',
      currentOIDCToken: this.props.currentOIDCToken || '',
      currentOIDCTokenDecoded: JSON.stringify(this.parseJWTToken(this.props.currentOIDCToken), null, 4) || '',
      apiKey: props.apiKey || '',
      supportedAuthModes: this.props.authModes,
      currentAuthMode: props.selectedAuthMode,
      iamRole: props.iamRole || 'Auth',
    };

    this.onClose = this.onClose.bind(this);
    this.onGroupChange = this.onGroupChange.bind(this);
    this.onGroupAdd = this.onGroupAdd.bind(this);
    this.onGenerate = this.onGenerate.bind(this);
    this.changeAPIKey = this.changeAPIKey.bind(this);
    this.changeEmail = this.changeEmail.bind(this);
    this.onUserNameChange = this.onUserNameChange.bind(this);
    this.onOIDCTokenChange = this.onOIDCTokenChange.bind(this);
    this.onAuthModeChange = this.onAuthModeChange.bind(this);
  }

  onClose() {
    const result = {
      authMode: this.state.currentAuthMode,
      apiKey: this.state.currentAuthMode === AUTH_MODE.API_KEY ? this.state.apiKey : null,
      cognitoToken: this.state.currentAuthMode === AUTH_MODE.AMAZON_COGNITO_USER_POOLS ? this.state.currentCognitoToken : null,
      OIDCToken: this.state.currentAuthMode === AUTH_MODE.OPENID_CONNECT ? this.state.currentOIDCToken : null,
      // We have no data for IAM to store, so we just store a constant string for now
      iam: this.state.currentAuthMode === AUTH_MODE.AWS_IAM ? 'AWS4-HMAC-SHA256 IAMAuthorized' : null,
      iamRole: this.state.iamRole,
    };

    if (this.props.onClose) {
      this.props.onClose(result);
    }
  }
  onGroupChange(ev, data) {
    this.setState({
      userGroups: data.value,
    });
  }
  onGroupAdd(ev, data) {
    this.setState({
      possibleGroups: [...this.state.possibleGroups, data.value],
    });
  }

  onUserNameChange(ev, data) {
    this.setState({
      userName: data.value,
    });
  }

  onOIDCTokenChange(ev, data) {
    this.setState({
      currentOIDCTokenDecoded: data.value,
    });
  }

  onAuthModeChange(ev, data) {
    this.setState({
      currentAuthMode: data.value,
    });
  }

  onIAMRoleChange(ev, data) {
    this.setState({
      iamRole: data.value,
    });
  }

  changeEmail(ev, data) {
    this.setState({
      email: data.value,
    });
  }

  onAdditionalFieldChange = (ev, data) => {
    this.setState({
      additionalFields: data.value,
    });
  };

  changeAPIKey(ev, data) {
    this.setState({
      apiKey: data.value,
    });
  }

  render() {
    let formContent;
    let actionText = 'Save';
    if (this.state.currentAuthMode === AUTH_MODE.API_KEY) {
      formContent = (
        <>
          <Form.Field>
            <label>ApiKey</label>
            <Input readOnly placeholder="APIKey" value={this.state.apiKey} onChange={this.changeAPIKey} />
          </Form.Field>
        </>
      );
    } else if (this.state.currentAuthMode === AUTH_MODE.AMAZON_COGNITO_USER_POOLS) {
      actionText = 'Generate Token';
      formContent = (
        <>
          <Form.Field>
            <label>Username</label>
            <Input placeholder="User Name" value={this.state.userName} onChange={this.onUserNameChange} />
          </Form.Field>
          <Form.Field>
            <label>Groups</label>
            <Dropdown
              placeholder="Choose cognito user groups"
              search
              options={this.state.possibleGroups.map((g) => ({
                key: g,
                value: g,
                text: g,
              }))}
              selection
              fluid
              multiple
              allowAdditions
              value={this.state.userGroups}
              onAddItem={this.onGroupAdd}
              onChange={this.onGroupChange}
            />
          </Form.Field>
          <Form.Field>
            <label>Email</label>
            <Input placeholder="Email" value={this.state.email} onChange={this.changeEmail} />
          </Form.Field>

          <Form.Field>
            <label>Additional Fields</label>
            <TextArea
              onChange={this.onAdditionalFieldChange}
              rows={10}
              placeholder="Decoded OIDC Token"
              spellCheck="false"
              value={this.state.additionalFields}
            />
          </Form.Field>
        </>
      );
    } else if (this.state.currentAuthMode === AUTH_MODE.OPENID_CONNECT) {
      const errorLabel = this.state.oidcTokenError ? (
        <Label basic color="red" pointing="below">
          {this.state.oidcTokenError}
        </Label>
      ) : null;
      formContent = (
        <>
          <Form.Field>
            <label>Decoded OpenID Connect Token</label>
            {errorLabel}
            <TextArea
              onChange={this.onOIDCTokenChange}
              rows={10}
              placeholder="Decoded OIDC Token"
              spellCheck="false"
              value={this.state.currentOIDCTokenDecoded}
            />
          </Form.Field>
        </>
      );
    } else if (this.state.currentAuthMode === AUTH_MODE.AWS_IAM) {
      formContent = (
        <>
          <label>Role:</label>
          <br />
          <Dropdown
            placeholder="Role"
            selection
            options={[
              { value: 'Auth', text: 'Auth' },
              { value: 'UnAuth', text: 'UnAuth' },
            ]}
            value={this.state.iamRole}
            onChange={this.onIAMRoleChange.bind(this)}
          />
        </>
      );
    }

    const authModeOptions = this.state.supportedAuthModes
      .filter((mode) => mode)
      .map((mode) => ({
        key: mode,
        value: mode,
        text: mode,
      }));

    return (
      <Modal onClose={this.onClose} onActionClick={this.onGenerate} open={this.state.isOpen}>
        <Modal.Header>Auth Options</Modal.Header>
        <Modal.Content>
          <Modal.Description>
            <Dropdown
              placeholder="Auth Mode"
              selection
              options={authModeOptions}
              value={this.state.currentAuthMode}
              onChange={this.onAuthModeChange}
            />
            <div style={{ marginTop: '1em' }}>
              <Form>{formContent}</Form>
            </div>
          </Modal.Description>
        </Modal.Content>
        <Modal.Actions>
          <Button primary onClick={this.onGenerate}>
            {actionText}
          </Button>
        </Modal.Actions>
      </Modal>
    );
  }
  async onGenerate() {
    try {
      const newState = {
        isOpen: false,
      };
      if (this.state.currentAuthMode === AUTH_MODE.AMAZON_COGNITO_USER_POOLS) {
        newState['currentCognitoToken'] = await this.generateCognitoJWTToken();
      } else if (this.state.currentAuthMode === AUTH_MODE.OPENID_CONNECT) {
        newState['currentOIDCToken'] = await this.generateOIDCJWTToken();
      }
      this.setState(newState, () => {
        this.onClose();
      });
    } catch (e) {}
  }

  async generateCognitoJWTToken() {
    let additionalFields;
    try {
      additionalFields = JSON.parse(this.state.additionalFields?.trim() || '{}');
    } catch (e) {
      additionalFields = {};
    }
    const tokenPayload: any = {
      sub: '7d8ca528-4931-4254-9273-ea5ee853f271',
      'cognito:groups': [],
      email_verified: true,
      algorithm: 'HS256',
      iss: 'https://cognito-idp.us-east-1.amazonaws.com/us-east-1_fake_idp',
      phone_number_verified: true,
      'cognito:username': '',
      'cognito:roles': [],
      aud: '2hifa096b3a24mvm3phskuaqi3',
      event_id: '18f4067e-9985-4eae-9f33-f45f495470d0',
      token_use: 'id',
      phone_number: '+12062062016',
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 12,
      email: this.state.email,
      ...additionalFields,
    };
    tokenPayload['cognito:username'] = this.state.userName;
    tokenPayload['cognito:groups'] = this.state.userGroups;
    tokenPayload['auth_time'] = Math.floor(Date.now() / 1000); // In seconds

    const token = await generateToken(tokenPayload);
    return token;
  }

  async generateOIDCJWTToken() {
    const tokenPayload = this.state.currentOIDCTokenDecoded || '';
    try {
      return await generateToken(tokenPayload);
    } catch (e) {
      this.setState({
        oidcTokenError: e.message,
      });
      throw e;
    }
  }
  parseJWTToken(token) {
    return parse(token);
  }
}
