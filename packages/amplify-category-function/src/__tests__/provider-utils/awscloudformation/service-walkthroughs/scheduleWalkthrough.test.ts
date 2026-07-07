import { isValidCronExpression } from '../../../../provider-utils/awscloudformation/service-walkthroughs/scheduleWalkthrough';
jest.setTimeout(2000000);

describe('check non valid crons', () => {
  it('ranndom', () => {
    expect(isValidCronExpression('foo bar * ')).toBeFalsy();
  });
  it('minutes Invalid', () => {
    expect(isValidCronExpression('10 75 10 ? * *')).toBeFalsy();
    expect(isValidCronExpression('10 / 10 ? * *')).toBeFalsy();
    expect(isValidCronExpression('10 /70 10 ? * *')).toBeFalsy();
    expect(isValidCronExpression('10 FOO 10 ? * *')).toBeFalsy();
    expect(isValidCronExpression('10 1,FOO,2 10 ? * *')).toBeFalsy();
    expect(isValidCronExpression('10 1,10-100 10 ? * *')).toBeFalsy();
    expect(isValidCronExpression('10 10-100 10 ? * *')).toBeFalsy();
    expect(isValidCronExpression('10 ? 10 ? * *')).toBeFalsy();
    expect(isValidCronExpression('10 W 10 ? * *')).toBeFalsy();
    expect(isValidCronExpression('10 1,W 10 ? * *')).toBeFalsy();
    expect(isValidCronExpression('10 # 10 ? * *')).toBeFalsy();
    expect(isValidCronExpression('15 1,# 10 ? * *')).toBeFalsy();
  });

  it('Hours Invalid', () => {
    expect(isValidCronExpression('10 15 30 ? * *')).toBeFalsy();
    expect(isValidCronExpression('10 15 / ? * *')).toBeFalsy();
    expect(isValidCronExpression('10 15 /25 ? * *')).toBeFalsy();
    expect(isValidCronExpression('10 15 FOO ? * *')).toBeFalsy();
    expect(isValidCronExpression('0 15 1,FOO,2 ? * *')).toBeFalsy();
    expect(isValidCronExpression('10 15 10-100 ? * *')).toBeFalsy();
    expect(isValidCronExpression('10 15 1,10-100 ? * *')).toBeFalsy();
    expect(isValidCronExpression('10 15 ? ? * *')).toBeFalsy();
    expect(isValidCronExpression('10 15 W ? * *')).toBeFalsy();
    expect(isValidCronExpression('10 15 1,W ? * *')).toBeFalsy();
    expect(isValidCronExpression('10 15 # ? * *')).toBeFalsy();
    expect(isValidCronExpression('15 15 1,# ? * *')).toBeFalsy();
  });

  it('days of month invalid', () => {
    expect(isValidCronExpression('10 15 10 0 * ?')).toBeFalsy();
    expect(isValidCronExpression('10 15 10 / * ?')).toBeFalsy();
    expect(isValidCronExpression('10 15 10 /32 * ?')).toBeFalsy();
    expect(isValidCronExpression('10 15 10 ?FOO * *')).toBeFalsy();
    expect(isValidCronExpression('10 15 10 FOO * ?')).toBeFalsy();
    expect(isValidCronExpression('10 15 10 1,FOO,2 * ?')).toBeFalsy();
    expect(isValidCronExpression('10 15 10 10-100 * ?')).toBeFalsy();
    expect(isValidCronExpression('10 15 10 W * ?')).toBeFalsy();
    expect(isValidCronExpression('10 15 10 1,W * ?')).toBeFalsy();
    expect(isValidCronExpression('10 15 10 L-32 * ?')).toBeFalsy();
  });

  it(' months invalid', () => {
    expect(isValidCronExpression('10 15 10 * 0 ?')).toBeFalsy();
    expect(isValidCronExpression('10 15 10 * / ?')).toBeFalsy();
    expect(isValidCronExpression('10 15 10 * /13 ?')).toBeFalsy();
    expect(isValidCronExpression('15 10 * FOO ? *')).toBeFalsy();
    expect(isValidCronExpression('10 15 10 * 1,FOO,2 ?')).toBeFalsy();
    expect(isValidCronExpression('10 15 10 * JAN-FOO ?')).toBeFalsy();
    expect(isValidCronExpression('10 15 10 * 1-30 ?')).toBeFalsy();
    expect(isValidCronExpression('10 15 10 * JAN-3 ?')).toBeFalsy();
    expect(isValidCronExpression('10 15 10 * ? ?')).toBeFalsy();
    expect(isValidCronExpression('10 15 10 * 1,? ?')).toBeFalsy();
    expect(isValidCronExpression('10 15 10 * W ?')).toBeFalsy();
    expect(isValidCronExpression('10 15 10 * 1,W ?')).toBeFalsy();
  });
  it(' days of week invalid', () => {
    expect(isValidCronExpression('0 15 10 ? * 9')).toBeFalsy();
    expect(isValidCronExpression('0 15 10 ? * /')).toBeFalsy();
    expect(isValidCronExpression('0 15 10 ? * /8')).toBeFalsy();
    expect(isValidCronExpression('0 15 10 ? * FOO')).toBeFalsy();
    expect(isValidCronExpression('0 15 10 ? * 1-9')).toBeFalsy();
    expect(isValidCronExpression('0 15 10 ? * MON-FOO')).toBeFalsy();
    expect(isValidCronExpression('0 15 10 ? * MON#6')).toBeFalsy();
    expect(isValidCronExpression('0 15 10 ? * L6')).toBeFalsy();
    expect(isValidCronExpression('0 15 10 ? * 6#6')).toBeFalsy();
    expect(isValidCronExpression('0 15 10 ? * #3#4 2005')).toBeFalsy();
  });
});

describe('valid crons', () => {
  it('valid crons', () => {
    expect(isValidCronExpression('0 15 10 * * ? 2005')).toBeTruthy();
    expect(isValidCronExpression('15 10 ? * FRI#3 2005')).toBeTruthy();
    expect(isValidCronExpression('0 15 10 ? * MON 2005')).toBeTruthy();
    expect(isValidCronExpression('7 15 10 ? JAN MON')).toBeTruthy();
    expect(isValidCronExpression('15 10 ? JAN MON')).toBeTruthy();
    expect(isValidCronExpression('* * * ? * * *')).toBeTruthy();
    expect(isValidCronExpression('* * * * * ? *')).toBeTruthy();
    expect(isValidCronExpression('* * * * ?')).toBeTruthy();
    expect(isValidCronExpression('0-15 15-16 10-11 1-2 JAN-MAR ? 2005-2010')).toBeTruthy();
    expect(isValidCronExpression('0-15 15-16 10-11 ? JAN-MAR MON-FRI 2005-2010')).toBeTruthy();
    expect(isValidCronExpression('0/4 15/3 10/2 ? 1/5 1/3 2005/2')).toBeTruthy();
    expect(isValidCronExpression('0/4 15/3 10/2 1/7 1/5 ? 2005/2')).toBeTruthy();
    expect(isValidCronExpression('/4 /3 /2 /7 /5 ? /2')).toBeTruthy();
    expect(isValidCronExpression('7-15,0/4 4-10,15/3 1-4,10/2 2-3,1/7 2-5,1/5 ? 2001-2004,2005/2')).toBeTruthy();
    expect(isValidCronExpression('7-15,0/4 4-10,15/3 1-4,10/2 ? 2-5,1/5 MON-WED,4/5 2001-2004,2005/2')).toBeTruthy();
    expect(isValidCronExpression('0 15 10 L * ? 2005')).toBeTruthy();
    expect(isValidCronExpression('0 15 10 ? * L 2005')).toBeTruthy();
    expect(isValidCronExpression('0 15 10 ? * 5L 2005')).toBeTruthy();
    expect(isValidCronExpression('0 15 10 ? * THUL 2005')).toBeTruthy();
    expect(isValidCronExpression('0 15 10 10W * ? 2005')).toBeTruthy();
    expect(isValidCronExpression('0 15 10 LW * ? 2005')).toBeTruthy();
    expect(isValidCronExpression('0 15 10 ? * FRI#3 2005')).toBeTruthy();
    expect(isValidCronExpression('15 10 ? * FRI#3 2005')).toBeTruthy();
    expect(isValidCronExpression('15 10 ? * FRI#3')).toBeTruthy();
  });
});
