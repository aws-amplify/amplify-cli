import { isValidNumber } from 'libphonenumber-js';
import * as net from 'net';

const TIME_REGEX = /^([01][0-9]|2[0-3]):([0-5][0-9]):([0-5][0-9])(\.\d{1,})?(([Z])|([+|-]([01][0-9]|2[0-3]):[0-5][0-9]))$/;
const RFC_3339_REGEX_DATE = /^(\d{4}-(0[1-9]|1[012])-(0[1-9]|[12][0-9]|3[01]))$/;
const RFC_3339_REGEX_DATE_TIME =
  /^(\d{4}-(0[1-9]|1[012])-(0[1-9]|[12][0-9]|3[01])T([01][0-9]|2[0-3]):([0-5][0-9]):([0-5][0-9]|60))(\.\d{1,})?(([Z])|([+|-]([01][0-9]|2[0-3]):[0-5][0-9]))$/;
const EMAIL_ADDRESS_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
const BOOL_REGEX = /^(true|false)$/i;

const validateString = (x: string) => x === x.toString();
const validateInt = (x: string) => !Number.isNaN(parseInt(x, 10));
const validateFloat = (x: string) => !Number.isNaN(parseFloat(x));
const validateAwsDate = (x: string) => validateDate(x);
const validateAwsTime = (x: string) => validateTime(x);
const validateAwsDateTime = (x: string) => validateDateTime(x);
const validateAwsTimestamp = (x: string) => !Number.isNaN(parseInt(x, 10));
const validateAwsPhone = (x: string) => isValidNumber(x);

const validateTime = (time: string): boolean => {
  return TIME_REGEX.test(time);
};

const leapYear = (year: number): boolean => {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
};

const validateDate = (date: string): boolean => {
  if (!RFC_3339_REGEX_DATE.test(date)) {
    return false;
  }

  // Verify the correct number of days for
  // the month contained in the date-string.
  const year = Number(date.slice(0, 4));
  const month = Number(date.slice(5, 2));
  const day = Number(date.slice(8, 2));

  switch (month) {
    case 2: // February
      if (leapYear(year) && day > 29) {
        return false;
      } else if (!leapYear(year) && day > 28) {
        return false;
      }
      return true;
    case 4: // April
    case 6: // June
    case 9: // September
    case 11: // November
      if (day > 30) {
        return false;
      }
      break;
  }

  return true;
};

const validateDateTime = (dateTime: string): boolean => {
  // Validate the structure of the date-string
  if (!RFC_3339_REGEX_DATE_TIME.test(dateTime)) {
    return false;
  }

  // Check if it is a correct date using the javascript Date parse() method.
  const t = Date.parse(dateTime);
  if (Number.isNaN(t)) {
    return false;
  }
  // Split the date-time-string up into the string-date and time-string part.
  // and check whether these parts are RFC 3339 compliant.
  const index = dateTime.indexOf('T');
  const date = dateTime.slice(0, index);
  const time = dateTime.slice(index + 1);
  return validateDate(date) && validateTime(time);
};

const validateBoolean = (x: string): boolean => {
  return BOOL_REGEX.test(x);
};

const validateJson = (x: string) => {
  try {
    JSON.parse(x);
    return true;
  } catch (e) {
    return false;
  }
};

const validateAwsEmail = (x: string): boolean => {
  return EMAIL_ADDRESS_REGEX.test(x);
};

const validateAwsUrl = (x: string) => {
  try {
    new URL(x);
    return true;
  } catch (e) {
    return false;
  }
};

const validateAwsIpAddress = (x: string) => {
  return net.isIP(x) !== 0;
};

interface Indexable {
  [key: string]: any;
}

export class TypeValidators implements Indexable {
  [key: string]: any;
  ID = validateString;
  String = validateString;
  Int = validateInt;
  Float = validateFloat;
  Boolean = validateBoolean;
  AWSJSON = validateJson;
  AWSDate = validateAwsDate;
  AWSTime = validateAwsTime;
  AWSDateTime = validateAwsDateTime;
  AWSTimestamp = validateAwsTimestamp;
  AWSEmail = validateAwsEmail;
  AWSURL = validateAwsUrl;
  AWSPhone = validateAwsPhone;
  AWSIPAddress = validateAwsIpAddress;
}
