// This is common utilites used both in zabimin navbar and ajax pages
define(['moment'], function(moment) {
    "use strict";

    // hash navigation (return current)
    var hash = function(newArgs, change) {
        var page = '';
        var args = {};
        var newHashStr = '';
        // we need to remove leading hashbang, split pairs by '&' and split arg, val by '='
        var hash = location.hash.split('&');
        var page = hash[0].replace(/#!/, '');
        if (hash.length > 1) {
            $.each(hash.splice(1), function(i, arg) {
                var a = arg.split("=", 2);
                // only if url arg had value
                if (a[0] && a[1]) {
                    args[a[0]] = a[1].split(',');
                }
            });
        }
        // new hash will merged with old
        var newHash = ['#!' + page];
        if ($.isPlainObject(newArgs) && !$.isEmptyObject(newArgs)) {
            // can't use jQuery.extend(), because need to delete keys by null value
            $.each(newArgs, function(k, v) {
                v === null ? delete args[k] : args[k] = v;
            });
        }
        if (newArgs !== null) { //reset all arguments on hashArgs === null
            $.each(args, function(k, v) {
                var value = $.isArray(v) ? v.join(',') : v;
                newHash.push(k + '=' + value);
            });
        }
        newHashStr = newHash.join('&');
        if (change) {
            location.hash = newHashStr;
        }
        return {
            page: page,
            args: args,
            val: newHashStr,
        }
    };
    // format numbers view
    var createMetricSuffix = function(value) {
        var v = [value, value];
        var metric = {
            decimal: [
                { symbol: 'Y', value: 1E+24 },
                { symbol: 'Z', value: 1E+21 },
                { symbol: 'E', value: 1E+18 },
                { symbol: 'P', value: 1E+15 },
                { symbol: 'T', value: 1E+12 },
                { symbol: 'G', value: 1E+9  },
                { symbol: 'M', value: 1E+6  },
                { symbol: 'k', value: 1E+3  },
                { symbol: '' , value: 1     },
                { symbol: 'm', value: 1E-3  },
                { symbol: 'μ', value: 1E-6  },
                { symbol: 'n', value: 1E-9  },
                { symbol: 'p', value: 1E-12 },
                { symbol: 'f', value: 1E-15 },
                { symbol: 'a', value: 1E-18 },
                { symbol: 'z', value: 1E-21 },
                { symbol: 'y', value: 1E-24 }
            ],
            binary: [
                { symbol: 'Y', value: Math.pow(2, 80) },
                { symbol: 'Z', value: Math.pow(2, 70) },
                { symbol: 'E', value: Math.pow(2, 60) },
                { symbol: 'P', value: Math.pow(2, 50) },
                { symbol: 'T', value: Math.pow(2, 40) },
                { symbol: 'G', value: Math.pow(2, 30) },
                { symbol: 'M', value: Math.pow(2, 20) },
                { symbol: 'k', value: Math.pow(2, 10) }
            ]
        };
        if (typeof value === 'number' && value !== 0) {
            var d;
            var b;
            metric.decimal.some(function(m) {
                d = m
                return Math.abs(value) >= m.value
            })[0];
            metric.binary.some(function(m) {
                b = m
                return Math.abs(value) >= m.value
            })[0];
            d = (value/d.value).toLocaleString() + ' ' + d.symbol
            b = (value/b.value).toLocaleString() + ' ' + b.symbol
            v = [ d, b ]
        }
        return v
    }
    var showUnit = function(value, units) {
        var v = [value, '', units];
        var metric = {
            decimal: [
                { symbol: 'Y', value: 1E+24 },
                { symbol: 'Z', value: 1E+21 },
                { symbol: 'E', value: 1E+18 },
                { symbol: 'P', value: 1E+15 },
                { symbol: 'T', value: 1E+12 },
                { symbol: 'G', value: 1E+9  },
                { symbol: 'M', value: 1E+6  },
                { symbol: 'k', value: 1E+3  },
                { symbol: '' , value: 1     },
                //{ symbol: 'm', value: 1E-3  },
                //{ symbol: 'μ', value: 1E-6  },
                //{ symbol: 'n', value: 1E-9  },
                //{ symbol: 'p', value: 1E-12 },
                //{ symbol: 'f', value: 1E-15 },
                //{ symbol: 'a', value: 1E-18 },
                //{ symbol: 'z', value: 1E-21 },
                //{ symbol: 'y', value: 1E-24 }
            ],
        };
        var special = {
            B: function(val) {
                var v = val;
                var suffix = '';
                var absVal = Math.abs(val);
                var divider = 1;
                var suffix = '';
                var binary = ['k', 'M', 'G', 'T', 'P', 'E', 'Z', 'Y'];
                if (absVal > 1024) {
                    binary.some(function(m, i) {
                        divider = Math.pow(2, (i + 2) * 10);
                        suffix = m;
                        return absVal < divider
                    });
                    v = val * 1024 / divider;
                }
                return [v.toLocaleString(), suffix, units]
            },
            unixtime: function(unixtime) {
                return [moment(unixtime, 'X').format('lll'), '', '']
            },
            uptime: function(unixtime) {
                return [moment.duration(unixtime, 's').humanize(), '', '']
            },
            
            s: function(s) {
                var v = [s, '', 's'];
                if (s < 1) {
                    v = [(s * 1000).toLocaleString(), 'm', 's'];
                }
                if (s > 59) {
                    v = [moment.duration(s, 's').humanize(), '', ''];
                }
                return v
            },
            '%': function(pcnt) {
                return [pcnt.toLocaleString({style: 'percent'}), '', '%']
            },
            default: function(val) {
                var v = val;
                var suffix = '';
                var absVal = Math.abs(val);
                var divider = 1;
                var suffix = '';
                var binary = ['k', 'M', 'G', 'T', 'P', 'E', 'Z', 'Y'];
                if (absVal > 1000) {
                    binary.some(function(m, i) {
                        divider = Math.pow(10, (i + 2) * 3);
                        suffix = m;
                        return absVal < divider
                    });
                    v = val * 1000 / divider;
                }
                return [v.toLocaleString(), suffix, units]
            }
        }
        special.Bps = special.B
        special['B/s'] = special.B

        if (isFinite(value)) {
            v = special[units] ? special[units](+value) : special.default(+value)
        }
        return v
    }
    var hex2rgb = function(hex) {
        var h = hex.split('');
        h[0] === '#' && h.shift()
        return [
            parseInt(h[0] + h[1], 16),
            parseInt(h[2] + h[3], 16),
            parseInt(h[4] + h[5], 16)
        ]
    };
    var sort = function() {
        var ip = function(ipA, ipB) {
                var result;
                var a = ipA.split('.');
                var b = ipB.split('.');
                if (a.length === b.length) {
                    a.some(function(el, i) {
                        var x = +el;
                        var y = +b[i];
                        if (x !== y) {
                            result = x > y ? 1 : -1;
                            return true
                        }
                    });
                } else {
                    result = 0;
                }
                return result
        };
        return {
            ip: ip
        }
    }();
    var visit = {
        update: function(hash) {
            var max = 1000;
            var page = '#!' + hash.page;
            var cur = localStorage[page] ? JSON.parse(localStorage[page]) : [];
            cur.push(hash.args);
            cur.splice(0, cur.length - max);
            localStorage[page] = JSON.stringify(cur);
        },
        show: function(page, value) {
            var page = '#!' + page;
            var visits = localStorage[page] ? JSON.parse(localStorage[page]) : [];
            var valObj = {};
            visits.forEach(function(args) {
                if (args[value]) {
                    args[value].forEach(function(v) {
                        if (valObj[v]) {
                            valObj[v][1]++
                        } else {
                            valObj[v] = [v, 1];
                        }
                    });
                }
            });
            var valArr = Object.keys(valObj).map(function(k) {
                return valObj[k]
            });
            valArr.sort(function(a, b) {
                return a[1] < b[1] ? 1 : -1
            });
            return valArr
        }
    };

    return {
        hash: hash,
        suffix: createMetricSuffix,
        hex2rgb: hex2rgb,
        showUnit: showUnit,
        sort: sort,
        visit: visit
    }
});
