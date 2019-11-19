const inquirer = require('inquirer');

export const EXPAND = ' >';

export type InquirerOption = {
  name: string;
  value: any;
  short: string;
};

export default inquirer;
