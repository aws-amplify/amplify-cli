var months = [
    'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August',
    'September', 'October', 'November', 'December'
];
var days = [
    'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
];

var hmsre = RegExp(
    '(\\d+\\.?\\d*(?:[:h]\\d+\\.?\\d*(?:[:m]\\d+\\.\\d*s?)?)?)'
);
var tokre = RegExp(
    '\\s+|(\\d+(?:st|th|nd|rd|th))\\b'
    + '|' + hmsre.source + '([A-Za-z]+)'
    + '|([A-Za-z]+)' + hmsre.source
);

module.exports = function (str, opts) {
    if (!opts) opts = {};
    var now = opts.now || new Date;
    if (typeof now === 'number' || typeof now === 'string') now = new Date(now);
    var ago = false;
    var tokens = str.split(tokre).filter(Boolean).map(lc);
    var res = {};
    for (var i = 0; i < tokens.length; i++) {
        var t = tokens[i];
        var next = tokens[i+1];
        var prev = tokens[i-1];
        var m;
        
        if (m = /(\d+)(st|nd|rd|th)/i.exec(t)) {
            if (next === 'of') {
                next = tokens[i+2];
                i++;
            }
            res.date = Number(m[1]);
            if (monthish(next)) {
                res.month = next;
                i++;
            }
        }
        else if ((m = /(\d+)(st|nd|rd|th)?/i.exec(next))
        && monthish(t)) {
            res.month = t;
            res.date = Number(m[1]);
            i++;
            if (/^\d+$/.test(tokens[i+1])) { // year
                res.year = Number(tokens[i+1]);
                i++;
            }
        }
        else if ((m = hmsre.exec(t)) && isunit(next)) {
            if (tokens[i-1] === 'in') {
                for (var j = i; j < tokens.length; j += 2) {
                    if (tokens[j] === 'and') j --;
                    else if ((m = hmsre.exec(tokens[j]))
                    && ishunit(tokens[j+1])) {
                        addu(parseh(tokens[j]), nunit(tokens[j+1]));
                    }
                    else if ((m = /^(\d+\.?\d*)/.exec(tokens[j]))
                    && isdunit(tokens[j+1])) {
                        daddu(Number(m[1]), nunit(tokens[j+1]));
                    }
                    else break;
                }
                i = j;
            }
            else {
                for (var j = i + 2; j < tokens.length; j++) {
                    if (tokens[j] === 'ago') {
                        ago = true;
                        break;
                    }
                }
                if (j === tokens.length) continue;
                
                for (var k = i; k < j; k++) {
                    if ((m = hmsre.exec(tokens[k])) && ishunit(tokens[k+1])) {
                        subu(parseh(tokens[k]), nunit(tokens[k+1]));
                    }
                    else if ((m = /^(\d+\.?\d*)/.exec(tokens[k]))
                    && isdunit(tokens[k+1])) {
                        dsubu(Number(m[1]), nunit(tokens[k+1]));
                    }
                }
                i = j;
            }
        }
        else if (/noon/.test(t)) {
          res.hours = 12
          res.minutes = 0
          res.seconds = 0
        }
        else if (/midnight/.test(t)) {
          res.hours = 0
          res.minutes = 0
          res.seconds = 0
        }
        else if (/\d+[:h]\d+/.test(t) || /^(am|pm)/.test(next)) {
            var hms = parseh(t, next);
            if (hms[0] !== null) res.hours = hms[0];
            if (hms[1] !== null) res.minutes = hms[1];
            if (hms[2] !== null) res.seconds = hms[2];
        }
        else if ((m = /^(\d+)/.exec(t)) && monthish(next)) {
            var x = Number(m[1]);
            if (res.year === undefined && x > 31) res.year = x;
            else if (res.date === undefined) res.date = x;
            if (res.month === undefined) res.month = next;
            i++;
        }
        else if (monthish(t) && (m = /^(\d+)/.exec(next))) {
            var x = Number(m[1]);
            if (res.year === undefined && x > 31) res.year = x;
            else if (res.date === undefined) res.date = x;
            if (res.month === undefined) res.month = t;
            i++;
        }
        else if ((m = /^(\d+)/.exec(t)) && monthish(prev)) {
            var x = Number(m[1]);
            if (res.year === undefined) res.year = x;
            else if (res.hours === undefined) res.hours = x;
        }
        else if (m = /^[`'\u00b4\u2019](\d+)/.exec(t)) {
            res.year = Number(m[1]);
        }
        else if (/^\d{4}[\W_]\d{1,2}[\W_]\d{1,2}/.test(t)) {
            var yms = t.split(/[\W_]/);
            res.year = Number(yms[0]);
            res.month = Number(yms[1]) - 1;
            res.date = Number(yms[2]);
        }
        else if (m = /^(\d+)/.exec(t)) {
            var x = Number(m[1]);
            if (res.hours === undefined && x < 24) res.hours = x;
            else if (res.date === undefined && x <= 31) res.date = x;
            else if (res.year === undefined && x > 31) res.year = x;
            else if (res.year == undefined
            && res.hours !== undefined && res.date !== undefined) {
                res.year = x;
            }
            else if (res.hours === undefined
            && res.date !== undefined && res.year !== undefined) {
                res.hours = x;
            }
            else if (res.date === undefined
            && res.hours !== undefined && res.year !== undefined) {
                res.date = x;
            }
        }
        else if (/^today$/.test(t) && res.date === undefined) {
            res.date = now.getDate();
            res.month = months[now.getMonth()];
            res.year = now.getFullYear();
        }
        else if (/^now$/.test(t) && res.date === undefined) {
            res.hours = now.getHours();
            res.minutes = now.getMinutes();
            res.seconds = now.getSeconds();
            res.date = now.getDate();
            res.month = months[now.getMonth()];
            res.year = now.getFullYear();
        }
        else if (/^to?m+o?r+o?w?/.test(t) && res.date === undefined) {
            var tomorrow = new Date(now.valueOf() + 24*60*60*1000);
            res.date = tomorrow.getDate();
            if (res.month === undefined) {
                res.month = months[tomorrow.getMonth()];
            }
            if (res.year === undefined) {
                res.year = tomorrow.getFullYear();
            }
        }
        else if (/^yesterday/.test(t) && res.date === undefined) {
            var yst = new Date(now.valueOf() - 24*60*60*1000);
            res.date = yst.getDate();
            if (res.month === undefined) {
                res.month = months[yst.getMonth()];
            }
            if (res.year === undefined) {
                res.year = yst.getFullYear();
            }
        }
        else if (t === 'next' && dayish(next) && res.date === undefined) {
            setFromDay(next, 7);
            i++;
        }
        else if (t === 'last' && dayish(next) && res.date === undefined) {
            setFromDay(next, -7);
            i++;
        }
        else if (dayish(t) && res.date === undefined) {
            setFromDay(t, 0);
        }
    }
    
    if (res.year < 100) {
        var y = now.getFullYear();
        var py = y % 100;
        if (py + 10 < res.year) {
            res.year += y - py - 100;
        }
        else res.year += y - py;
    }
    if (res.month && typeof res.month !== 'number') {
        res.month = nmonth(res.month);
    }
    var out = new Date(now);
    out.setHours(res.hours === undefined ? 0 : res.hours);
    out.setMinutes(res.minutes === undefined ? 0 : res.minutes);
    out.setSeconds(res.seconds === undefined ? 0 : res.seconds);
    var monthSet = res.month;
    if (typeof res.month === 'number') {
        out.setMonth(res.month)
    }
    else if (res.month) {
        monthSet = months.indexOf(res.month);
        out.setMonth(monthSet);
    }
    if (res.date !== undefined) out.setDate(res.date);
    if (monthSet !== undefined && out.getMonth() !== monthSet) {
        out.setMonth(monthSet);
    }
     
    if (res.year) out.setYear(res.year);
    else if (out < now && !ago
    && (Math.abs(out.getMonth()+12 -now.getMonth()) % 12) >= 1) {
        out.setYear(now.getFullYear() + 1);
    }
    return out;
    
    function setFromDay (t, x) {
        var dayi = days.indexOf(nday(t));
        var xdays = (7 + dayi - now.getDay()) % 7 + x;
        var d = new Date(now.valueOf() + xdays*24*60*60*1000);
        res.date = d.getDate();
        if (res.month === undefined) {
            res.month = months[d.getMonth()];
        }
        if (res.year === undefined) {
            res.year = d.getFullYear();
        }
    }
    
    function opu (hms, u, op) {
        if (u == 'hours') {
            res.hours = op(now.getHours(), hms[0]);
            res.minutes = op(now.getMinutes(), hms[1] === null ? 0 : hms[1]);
            res.seconds = op(now.getSeconds(), hms[2] === null ? 0 : hms[2]);
        }
        else if (u == 'minutes') {
            if (res.hours === undefined) res.hours = now.getHours();
            res.minutes = op(now.getMinutes(), hms[0] === null ? 0 : hms[0]);
            res.seconds = op(now.getSeconds(), hms[1] === null ? 0 : hms[1]);
        }
        else if (u == 'seconds') {
            if (res.hours === undefined) res.hours = now.getHours();
            if (res.minutes === undefined) res.minutes = now.getMinutes();
            res.seconds = op(now.getSeconds(), hms[0] === null ? 0 : hms[0]);
        }
    }
    function subu (hms, u) { opu(hms, u, sub) }
    function addu (hms, u) { opu(hms, u, add) }
    
    function dopu (n, u, op) {
        if (res.hours === undefined) res.hours = now.getHours();
        if (res.minutes === undefined) res.minutes = now.getMinutes();
        if (res.seconds === undefined) res.seconds = now.getSeconds();
        if (u === 'days') {
            res.date = op(now.getDate(), n);
        }
        else if (u === 'weeks') {
            res.date = op(now.getDate(), n*7);
        }
        else if (u === 'months') {
            res.month = op(now.getMonth(), n);
        }
        else if (u === 'years') {
            res.year = op(now.getFullYear(), n);
        }
    }
    function dsubu (n, u) { dopu(n, u, sub) }
    function daddu (n, u) { dopu(n, u, add) }
};

function add (a, b) { return a + b }
function sub (a, b) { return a - b }

function lc (s) { return String(s).toLowerCase() }

function ishunit (s) {
    var n = nunit(s);
    return n === 'hours' || n === 'minutes' || n === 'seconds';
}
function isdunit (s) {
    var n = nunit(s);
    return n === 'days' || n === 'weeks' || n === 'months' || n === 'years';
}
function isunit (s) { return Boolean(nunit(s)) }

function nunit (s) {
    if (/^(ms|millisecs?|milliseconds?)$/.test(s)) return 'milliseconds';
    if (/^(s|secs?|seconds?)$/.test(s)) return 'seconds';
    if (/^(m|mins?|minutes?)$/.test(s)) return 'minutes';
    if (/^(h|hrs?|hours?)$/.test(s)) return 'hours';
    if (/^(d|days?)$/.test(s)) return 'days';
    if (/^(w|wks?|weeks?)$/.test(s)) return 'weeks';
    if (/^(mo|mnths?|months?)$/.test(s)) return 'months';
    if (/^(y|yrs?|years?)$/.test(s)) return 'years';
}

function monthish (s) { return Boolean(nmonth(s)) }

function dayish (s) {
    return /^(mon|tue|wed|thu|fri|sat|sun)/i.test(s);
}

function nmonth (s) {
    if (/^jan/i.test(s)) return 'January';
    if (/^feb/i.test(s)) return 'February';
    if (/^mar/i.test(s)) return 'March';
    if (/^apr/i.test(s)) return 'April';
    if (/^may/i.test(s)) return 'May';
    if (/^jun/i.test(s)) return 'June';
    if (/^jul/i.test(s)) return 'July';
    if (/^aug/i.test(s)) return 'August';
    if (/^sep/i.test(s)) return 'September';
    if (/^oct/i.test(s)) return 'October';
    if (/^nov/i.test(s)) return 'November';
    if (/^dec/i.test(s)) return 'December';
}

function nday (s) {
    if (/^mon/i.test(s)) return 'Monday';
    if (/^tue/i.test(s)) return 'Tuesday';
    if (/^wed/i.test(s)) return 'Wednesday';
    if (/^thu/i.test(s)) return 'Thursday';
    if (/^fri/i.test(s)) return 'Friday';
    if (/^sat/i.test(s)) return 'Saturday';
    if (/^sun/i.test(s)) return 'Sunday';
}

function parseh (s, next) {
    var m = /(\d+\.?\d*)(?:[:h](\d+\.?\d*)(?:[:m](\d+\.?\d*s?\.?\d*))?)?/.exec(s);
    var hms = [ Number(m[1]), null, null ];
    if (/^am/.test(next) && hms[0] == 12) hms[0] -= 12;
    if (/^pm/.test(next) && hms[0] < 12) hms[0] += 12;
    if (m[2]) hms[1] = Number(m[2]);
    if (m[3]) hms[2] = Number(m[3]);
    if (hms[0] > floorup(hms[0])) {
        hms[1] = floorup((hms[0] - floorup(hms[0])) * 60);
        hms[0] = floorup(hms[0]);
    }
    if (hms[1] > floorup(hms[1])) {
        hms[2] = floorup((hms[1] - floorup(hms[1])) * 60);
        hms[1] = floorup(hms[1]);
    }
    return hms;
}

function floorup (x) {
    return Math.floor(Math.round(x * 1e6) / 1e6);
}
