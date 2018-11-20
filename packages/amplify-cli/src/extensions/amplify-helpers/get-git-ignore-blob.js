const os = require('os');

function getGitIgnoreBlob() {
  const toAppend = `${os.EOL + os.EOL
  }amplify/\\#current-cloud-backend${os.EOL
  }amplify/.config/local-*${os.EOL
  }amplify/backend/amplify-meta.json${os.EOL
  }aws-exports.js${os.EOL
  }awsconfiguration.json`;

  return toAppend;
}

module.exports = {
  getGitIgnoreBlob,
};
