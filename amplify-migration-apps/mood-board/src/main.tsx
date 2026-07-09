import React from 'react';
import ReactDOM from 'react-dom/client';
import { Amplify } from 'aws-amplify';
import { parseAmplifyConfig } from 'aws-amplify/utils';
import amplifyconfig from './amplifyconfiguration.json';
import App from './App';
import '@aws-amplify/ui-react/styles.css';

Amplify.configure({
  ...parseAmplifyConfig(amplifyconfig),
  Analytics: {
    Kinesis: {
      region: 'us-east-1',
      bufferSize: 1000,
      flushSize: 100,
      flushInterval: 5000,
      resendLimit: 5,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
