"use strict";

/*****************************************************************************/
/* This is common utilites used both in zabimin navbar and ajax pages
/*****************************************************************************/

var Util = (function() {
    // Zabbix API with multi request support
    var zapi = function(zapiReqs, allReqSuccessful, eitherOneHasError) {
        var ajaxReqs = [], zapiData = [];
        $('#ajaxPreloader').show()
        $.each(zapiReqs, function(i, req) {
            var reqData = { jsonrpc: "2.0" };
            reqData.method = req.method
            // try to login
            if (req.method == "user.login") {
                reqData.id = 0
                reqData.params = {
                    user: req.params.user,
                    password: req.params.password,
                    userData: true
                }
            } else {
                reqData.id = 1
                reqData.params = req.params
                if (localStorage.sessionid == undefined) {
                    window.location = "login.html"
                }
                reqData.auth = localStorage.sessionid
            }
            var jqxhr = $.ajax({
                url: "/api_jsonrpc.php",
                type: "POST",
                contentType: 'application/json-rpc',
                dataType: 'json',
                cache: false,
                processData: false,
                data: JSON.stringify(reqData)
            });
            ajaxReqs.push(
                jqxhr.done(function(zapiResponse) {
                    zapiData.push({
                        method: reqData.method,
                        request: reqData.params,
                        result: zapiResponse.result
                    })
                })
            );
        });
        // The reason that .apply is needed is because $.when can take multiple arguments,
        // but not an array of arguments.
        $.when.apply(undefined, ajaxReqs).then(
            function() {
                $('#ajaxPreloader').hide()
                console.log("zapi: ", zapiData[0].method, zapiData)
                allReqSuccessful(zapiData)
            },
            function() {
                eitherOneHasError(zapiData)
            }
        );
    }
    // Main navigation function
    var parseHash = function() {
        var page;
        var args = {};
        // we need to remove leading hashbang, split pairs by '&' and split arg, val by '='
        var hash = location.hash.replace(/^#!/, "").split('&');
        if (hash[0]) {
            page = hash[0];
            if (hash.length > 1) {
                $.each(hash.splice(1), function(i, arg) {
                    var a = arg.split("=", 2);
                    var key = a[0];
                    var values = a[1].split(',');
                    // only if url arg had value
                    if (key && values[0]) {
                        args[key] = values
                    }
                });
            }
        }
        console.log("Util.parseHash", page, args)
        return {
            page: page,
            args: args
        }
    }
    
    // util to set page arguments, for interpage navigation use links
    var setHash = function(newArgs) {
        // new hash will merged with old
        var hash = Util.parseHash();
        var newHash = ['#!' + hash.page];
        // can't use jQuery.extend(), because need to delete keys by null value
        $.each(newArgs, function(k, v) {
            if (v === null) {
                delete hash.args[k];
            } else {
                hash.args[k] = v;
            }
        });
        $.each(hash.args, function(k, v) {
            var value = $.isArray(v) ? v.join(',') : v;
            newHash.push(k + '=' + value);
        });
        console.log("Util.setHash", newHash)
        location.hash = newHash.join('&')
    };
    // format numbers view
    var createMetricPrefix = function(value, units) {
        if (!$.isNumeric(value)) return
        var v, prefix, metric = [
            { symbol: 'Y', decimal: 1E+24, binary: Math.pow(2, 80) },
            { symbol: 'Z', decimal: 1E+21, binary: Math.pow(2, 70) },
            { symbol: 'E', decimal: 1E+18, binary: Math.pow(2, 60) },
            { symbol: 'P', decimal: 1E+15, binary: Math.pow(2, 50) },
            { symbol: 'T', decimal: 1E+12, binary: Math.pow(2, 40) },
            { symbol: 'G', decimal: 1E+9, binary: Math.pow(2, 30) },
            { symbol: 'M', decimal: 1E+6, binary: Math.pow(2, 20) },
            { symbol: 'k', decimal: 1E+3, binary: Math.pow(2, 10) },
            { decimal: 1, binary: 1 },
            { symbol: 'm', decimal: 1E-3 },
            { symbol: 'μ', decimal: 1E-6 },
            { symbol: 'n', decimal: 1E-9 },
            { symbol: 'p', decimal: 1E-12 },
            { symbol: 'f', decimal: 1E-15 },
            { symbol: 'a', decimal: 1E-18 },
            { symbol: 'z', decimal: 1E-21 },
            { symbol: 'y', decimal: 1E-24 }
        ]
        if (units == 'B' || units == 'Bps' || units == 'bps') units = 'binary'
        switch(units) {
            case 'binary':
                if (value < 1024) {
                    return value+' '
                } else {
                    $.each(metric, function(p, i) {
                        v = value / i.binary
                        prefix = i.symbol
                        return ( v < 1 )
                    })
                    return v.toLocaleString('en-US', {maximumFractionDigits: 1})+' '+prefix
                }
            case '%':
                return value.toLocaleString({style: 'percent'})
            default:
                if (value == 0 || (value >= 0.001 && value < 1000)) {
                    return value.toLocaleString()+' '
                } else {
                    $.each(metric, function(p, i) {
                        v = value / i.decimal
                        prefix = i.symbol
                        return ( v < 1 )
                    })
                    return v.toLocaleString()+' '+prefix
                }
        }
    }

    return {
        zapi: zapi,
        setHash: setHash,
        parseHash: parseHash,
        createMetricPrefix: createMetricPrefix
    }
})();
