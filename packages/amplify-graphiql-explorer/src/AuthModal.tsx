import React, { Component } from 'react';
import { Button, Form, Modal, Dropdown, Input } from 'semantic-ui-react';
import { decode, sign } from 'jsonwebtoken';

enum AUTH_MODE {
  API_KEY = 'API_KEY',
  AMAZON_COGNITO_USER_POOLS = 'AMAZON_COGNITO_USER_POOLS',
}

type State = {
  currentToken?: string;
  authMode: string;
  userName?: string;
  userGroups: string[];
  email?: string;
  issuer?: string;
  apiKey?: string;
  possibleGroups: string[];
  isOpen: boolean;
};

type Props = {
  onClose: Function;
  authMode: string;
  currentToken?: string;
  apiKey?: string;
};
export class AuthModal extends Component<Props, State> {
  state = {
    currentToken: '',
    authMode: AUTH_MODE.AMAZON_COGNITO_USER_POOLS,
    userName: '',
    issuer: '',
    userGroups: [],
    apiKey: '',
    possibleGroups: [],
    email: '',
    isOpen: true,
  };

  constructor(props, ...args) {
    super(props, ...args);
    let state = {};
    if (props.authMode === AUTH_MODE.API_KEY) {
      state = {
        apiKey: this.props.apiKey,
      };
    } else {
      const decodedToken = this.parseJWTToken(this.props.currentToken) || {};
      state = {
        userName: decodedToken['cognito:username'] || '',
        userGroups: decodedToken['cognito:groups'] || [],
        issuer: decodedToken['iss'],
        email: decodedToken['email'],
        possibleGroups: decodedToken['cognito:groups'] || [],
      };
    }

    this.state = {
      ...this.state,
      ...state,
      currentToken: this.props.currentToken || '',
    };
    this.onClose = this.onClose.bind(this);
    this.changeAuthMode = this.changeAuthMode.bind(this);
    this.onGroupChange = this.onGroupChange.bind(this);
    this.onGroupAdd = this.onGroupAdd.bind(this);
    this.onGenerate = this.onGenerate.bind(this);
    this.changeAPIKey = this.changeAPIKey.bind(this);
    this.changeEmail = this.changeEmail.bind(this);
    this.changeUserName = this.changeUserName.bind(this);
  }

  onClose() {
    const result = {
      authMode: this.props.authMode,
      apiKey: this.props.authMode === AUTH_MODE.API_KEY ? this.state.apiKey : null,
      jwtToken:
        this.props.authMode === AUTH_MODE.AMAZON_COGNITO_USER_POOLS
          ? this.state.currentToken
          : null,
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

  changeAuthMode(ev, data) {
    this.setState({
      authMode: data.value,
    });
  }

  changeUserName(ev, data) {
    this.setState({
      userName: data.value,
    });
  }

  changeEmail(ev, data) {
    this.setState({
      email: data.value,
    });
  }
  changeAPIKey(ev, data) {
    this.setState({
      apiKey: data.value,
    });
  }

  render() {
    let formContent;
    let actionText = '';
    if (this.props.authMode === AUTH_MODE.API_KEY) {
      actionText = 'Save';
      formContent = (
        <>
          <Form.Field>
            <label>ApiKey</label>
            <Input placeholder='APIKey' value={this.state.apiKey} onChange={this.changeAPIKey} />
          </Form.Field>
        </>
      );
    } else if (this.props.authMode === AUTH_MODE.AMAZON_COGNITO_USER_POOLS) {
      actionText = 'Generate Token';
      formContent = (
        <>
          <Form.Field>
            <label>Username</label>
            <Input
              placeholder='User Name'
              value={this.state.userName}
              onChange={this.changeUserName}
            />
          </Form.Field>
          <Form.Field>
            <label>Groups</label>
            <Dropdown
              placeholder='Choose cognito user groups'
              search
              options={this.state.possibleGroups.map(g => ({
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
            <Input placeholder='Email' value={this.state.email} onChange={this.changeEmail} />
          </Form.Field>
        </>
      );
    }

    return (
      <Modal onClose={this.onClose} onActionClick={this.onGenerate} open={this.state.isOpen}>
        <Modal.Header>Auth Options</Modal.Header>
        <Modal.Content>
          <Modal.Description>
            <Form>{formContent}</Form>
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
  onGenerate() {
    const newState = {
      isOpen: false,
    };
    if (this.props.authMode !== AUTH_MODE.API_KEY) {
      newState['currentToken'] = this.generateJWTToken();
    }
    this.setState(newState, () => {
      this.onClose();
    });
  }

  generateJWTToken() {
    const tokenPayload = {
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
    };
    tokenPayload['cognito:username'] = this.state.userName;
    tokenPayload['cognito:groups'] = this.state.userGroups;
    tokenPayload['auth_time'] = Math.floor(Date.now() / 1000); // In seconds

    const token = sign(tokenPayload, 'open-secrete');

    return token;
  }
  parseJWTToken(token) {
    const decodedToken = decode(token);
    return decodedToken;
  }
}
