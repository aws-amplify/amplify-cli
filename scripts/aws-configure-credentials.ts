import { join } from 'path';
import * as fs from 'fs';

const AWS_ACCESS_KEY_ID = process.env['AWS_ACCESS_KEY_ID'];
const AWS_SECRET_ACCESS_KEY = process.env['AWS_SECRET_ACCESS_KEY'];
const AWS_SESSION_TOKEN = process.env['AWS_SESSION_TOKEN'];

const credentials_file_contents = `[default]
aws_access_key_id=${AWS_ACCESS_KEY_ID}
aws_secret_access_key=${AWS_SECRET_ACCESS_KEY}
aws_session_token=${AWS_SESSION_TOKEN}

`;

const config_file_contents = `[default]
region=us-west-2

`;

fs.writeFileSync(join('/', 'root', '.aws', 'credentials'), credentials_file_contents);
fs.writeFileSync(join('/', 'root', '.aws', 'config'), config_file_contents);
