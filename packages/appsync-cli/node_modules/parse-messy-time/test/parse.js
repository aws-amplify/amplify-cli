var parse = require('../');
var months = require('months');
var test = require('tape');
var strftime = require('strftime');

test('parse dates', function (t) {
    var tomorrow = new Date((new Date).valueOf() + 24*60*60*1000);
    
    // Tue Apr 14 2015 09:46:01 GMT-0700 (PDT)
    var optsd = { now: new Date(1429029961000) };
    
    t.equal(strftime('%T', parse('11am')), '11:00:00');
    t.equal(strftime('%T', parse('11pm')), '23:00:00');
    t.equal(strftime('%T', parse('12:30am')), '00:30:00');
    t.equal(strftime('%T', parse('12:30pm')), '12:30:00');
    t.equal(
        strftime('%F %T', parse('tomorrow at 7')),
        strftime('%F 07:00:00', tomorrow)
    );
    t.equal(
        strftime('%F %T', parse('aug 25 2015 5pm')),
        '2015-08-25 17:00:00'
    );
    t.equal(
        strftime('%F %T', parse('this friday', {
            now: new Date(1429029961000)
        })),
        '2015-04-17 00:00:00'
    );
    t.equal(
        strftime('%F %T', parse('friday', {
            now: new Date(1429029961000)
        })),
        '2015-04-17 00:00:00'
    );
    t.equal(
        strftime('%F %T', parse('this friday', {
            now: new Date(1429721563259)
        })),
        '2015-04-24 00:00:00'
    );
    t.equal(
        strftime('%F %T', parse('monday', {
            now: new Date(1429032952407)
        })),
        '2015-04-20 00:00:00'
    );
    t.equal(
        strftime('%F %T', parse('next friday', {
            now: new Date(1429721563259)
        })),
        '2015-05-01 00:00:00'
    );
    t.equal(
        strftime('%F %T', parse('next monday', {
            now: new Date(1429033187172)
        })),
        '2015-04-27 00:00:00'
    );
    t.equal(
        strftime('%F %T', parse('last monday', {
            now: new Date(1429033187172)
        })),
        '2015-04-13 00:00:00'
    );
    t.equal(
        strftime('%F %T', parse('last tuesday', {
            now: new Date(1429033187172)
        })),
        '2015-04-07 00:00:00'
    );
    t.equal(
        strftime('%F %T', parse('oct 22nd 1987')),
        '1987-10-22 00:00:00'
    );
    t.equal(
        strftime('%F %T', parse('3pm oct 22nd 1987')),
        '1987-10-22 15:00:00'
    );
    t.equal(
        strftime('%F %T', parse('oct 22nd 1987 6am')),
        '1987-10-22 06:00:00'
    );
    t.equal(
        strftime('%F %T', parse('the 22nd of october, 1987 at 7pm')),
        '1987-10-22 19:00:00'
    );
    t.equal(
        strftime('%F', parse('4th of july', optsd)),
        '2015-07-04'
    );
    t.equal(
        strftime('%F %T', parse('9pm on the 4th of july', optsd)),
        '2015-07-04 21:00:00'
    );
    t.equal(
        strftime('%F %T', parse('in 12 minutes', optsd)),
        '2015-04-14 09:58:01',
        'in 12 minutes'
    );
    t.equal(
        strftime('%F %T', parse('in 2 hours', optsd)),
        '2015-04-14 11:46:01',
        'in 2 hours'
    );
    t.equal(
        strftime('%F %T', parse('in 31 hours', optsd)),
        '2015-04-15 16:46:01',
        'in 31 hours'
    );
    t.equal(
        strftime('%F %T', parse('in 20 hours 40 minutes', optsd)),
        '2015-04-15 06:26:01',
        'in 20 hours 40 minutes'
    );
    t.equal(
        strftime('%F %T', parse('in 20 hours and 40 minutes', optsd)),
        '2015-04-15 06:26:01',
        'in 20 hours and 40 minutes'
    );
    t.equal(
        strftime('%F %T', parse('in 20.2h', optsd)),
        '2015-04-15 05:58:01',
        'in 20.2h'
    );
    t.equal(
        strftime('%F %T', parse('in 5 weeks', optsd)),
        '2015-05-19 09:46:01',
        'in 5 weeks'
    );
    t.equal(
        strftime('%F %T', parse('in 2 years', optsd)),
        '2017-04-14 09:46:01',
        'in 2 years'
    );
    t.equal(
        strftime('%F %T', parse('in 2 years and 5 weeks', optsd)),
        '2017-05-19 09:46:01',
        'in 2 years and 5 weeks'
    );
    t.equal(
        strftime('%F %T', parse('in 1.5 weeks', optsd)),
        '2015-04-24 09:46:01',
        'in 1.5 weeks'
    );
    t.equal(
        strftime('%F %T', parse('2 days ago', optsd)),
        '2015-04-12 09:46:01',
        '2 days ago'
    );
    t.equal(
        strftime('%F %T', parse('2 days and 6 hours ago', optsd)),
        '2015-04-12 03:46:01',
        '2 days and 6 hours ago'
    );
    t.equal(
        strftime('%F %T', parse('1 month ago', optsd)),
        '2015-03-14 09:46:01',
        '1 month ago'
    );
    t.equal(
        strftime('%F %T', parse('yesterday', optsd)),
        '2015-04-13 00:00:00',
        'yesterday'
    );
    t.equal(
        strftime('%F %T', parse('yesterday at 8am', optsd)),
        '2015-04-13 08:00:00',
        'yesterday'
    );
    t.equal(
        strftime('%F %T', parse('today at 8am', optsd)),
        '2015-04-14 08:00:00',
        'today at 8am'
    );
    t.equal(
        strftime('%F %T', parse('now', optsd)),
        '2015-04-14 09:46:01',
        'now'
    );
    t.equal(
        strftime('%F %T', parse('14 days ago', optsd)),
        '2015-03-31 09:46:01',
        '14 days ago'
    );
    t.equal(
        strftime('%F %T', parse('2015-10-31', optsd)),
        '2015-10-31 00:00:00',
        'YYYY-MM-DD'
    );
    t.equal(
        strftime('%F %T', parse('2015-10-31 20:30', optsd)),
        '2015-10-31 20:30:00',
        'YYYY-MM-DD HH:MM'
    );
    t.equal(
        strftime('%F %T', parse('2015-10-31 8:30pm', optsd)),
        '2015-10-31 20:30:00',
        'YYYY-MM-DD informal'
    );
    t.equal(
        strftime('%F', parse('sunday may 22nd', optsd)),
        '2015-05-22',
        'sunday may 22nd'
    );
    t.equal(
        strftime('%F', parse('sunday may 22nd 2016', optsd)),
        '2016-05-22',
        'sunday may 22nd 2016'
    );
    t.equal(
        strftime('%F', parse('jan 15', optsd)),
        '2016-01-15',
        'jan 15'
    );
    t.equal(
        strftime('%F', parse('apr 1', optsd)),
        '2015-04-01',
        'apr 1'
    );
    t.equal(
        strftime('%F', parse('this sunday', {
            now: new Date('2016-05-31 00:00')
        })),
        '2016-06-05',
        'this sunday'
    );
    t.equal(
        strftime('%F', parse('the 1st', optsd)),
        '2015-04-01',
        'the 1st'
    );
    t.equal(
        strftime('%F', parse('the 2nd', optsd)),
        '2015-04-02',
        'the 2nd'
    );
    t.equal(
        strftime('%F', parse('the 3rd', optsd)),
        '2015-04-03',
        'the 3rd'
    );
    t.equal(
        strftime('%F', parse('the 4th', optsd)),
        '2015-04-04',
        'the 4th'
    );
    t.equal(
        strftime('%F', parse('the 10th', optsd)),
        '2015-04-10',
        'the 10th'
    );
    t.equal(
        strftime('%F %T', parse('tomorrow at noon', optsd)),
        '2015-04-15 12:00:00',
        'tomorrow at noon'
    );
    t.equal(
        strftime('%F %T', parse('in 6 days at midnight', optsd)),
        '2015-04-20 00:00:00',
        'in 6 days at midnight'
    );
    t.end();
});
