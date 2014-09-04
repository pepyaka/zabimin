"use strict";

var util = {
}
// Zabbix API with multi request support
util.zapi = function(zapiReqs, allReqSuccessful, eitherOneHasError) {
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

util.createHostSelector = function(hash, hostSelectorInitComplete) {
    var selData = {};
    var req = {
        method: 'host.get',
        params: {
            output: 'extend',
            selectGroups: 'extend',
            selectGraphs: 'extend',
            sortfield: 'name'
        }
    };
    
    // set selectors to disabled before ajax request
    $('#hostGroupSelect')
        .prop('disabled', true)
        .selectpicker('refresh');
    $('#hostSelect')
        .prop('disabled', true)
        .selectpicker('refresh');

    util.zapi([req], function(zapiResponse) {
        var hosts = zapiResponse[0].result;
        var hostGroups = [];
        var hostGroupList = ['<option>All groups</option>']
        // sort hosts by name and create full host list by default
        hosts.sort(function(a, b) {
            return a.name > b.name ? 1 : -1
        })

        // Create host group list
        $.each(hosts, function(i, host) {
            // fill host group list
            $.each(host.groups, function(i, group) {
                if (hostGroups[group.groupid]) {
                    hostGroups[group.groupid].hosts.push(host)
                } else {
                    hostGroups[group.groupid] = $.extend(group, { hosts: [] })
                }
            })
        });
        // remove undefined and sort host group list
        hostGroups = hostGroups.filter(Boolean)
        hostGroups.sort(function(a, b) {
            return a.name > b.name ? 1 : -1
        })

        // anyway create full host group list
        $.each(hostGroups, function(i, hostGroup) {
            hostGroupList.push('<option>'+hostGroup.name+'</option>')
        })
        // on each zapi request unbind events listener and bind new one
        $('#hostGroupSelect')
            .prop('disabled', false)
            .empty()
            .append(hostGroupList.join(''))
            .selectpicker('refresh')
            .off('change.hostGroupSelect')
            .on('change.hostGroupSelect', function() {
                var selVal = $(this).val();
                if (!selVal || selVal == 'All groups') {
                    selData.hostGroup = hostGroups
                    delete page.hash.hostgroup
                    createHostList(hosts)
                } else {
                    selData.hostGroup = $.grep(hostGroups, function(hostGroup) {
                        return hostGroup.name == selVal
                    })
                    page.hash.hostgroup = [selVal]
                    createHostList(selData.hostGroup[0].hosts)
                }
                selData.host = []
                delete page.hash.host
                selectionDone(selData)
            });
        // standalone function for hosts list
        function createHostList(hosts) {
            var hostList = []
            $.each(hosts, function(i, host) {
                hostList.push('<option>'+host.name+'</option>')
            })
            $('#hostSelect')
                .prop('disabled', false)
                .empty()
                .append(hostList.join(''))
                .selectpicker('refresh')
                .off('change.hostSelect')
                .on('change.hostSelect', function() {
                    var selVal = $(this).val();
                    if (selVal == 'No host' || selVal == null) {
                        delete page.hash.host
                    } else {
                        selData.host = $.grep(hosts, function(host) {
                            return $.inArray(host.host, selVal) > -1
                        })
                        page.hash.host = selVal
                    }
                    selectionDone(selData)
                });
        }
        function selectionDone(selectedData) {
            page.hostSelectorData = selectedData
            util.setHash(page.hash)
        }

        // set initial selects from url hash
        if (hash.hostgroup) {
            $('#hostGroupSelect').selectpicker('val', hash.hostgroup[0]);
            selData.hostGroup = $.grep(hostGroups, function(hostGroup) {
                return hostGroup.name == hash.hostgroup[0]
            })
            createHostList(selData.hostGroup[0].hosts)
        } else {
            $('#hostGroupSelect').selectpicker('val', 'All groups');
            selData.hostGroup = hostGroups
            createHostList(hosts)
        }
        if (hash.host) {
            $('#hostSelect').selectpicker('val', hash.host);
            selData.host = $.grep(hosts, function(host) {
                return $.inArray(host.host, hash.host) > -1
            })
        } else {
            $('#hostSelect').selectpicker('val', 'No host');
            selData.host = []
        }
        page.hostSelectorData = selData
        if ($.isFunction(hostSelectorInitComplete)) {
            hostSelectorInitComplete()
        }
    })
}
// format numbers view
util.createMetricPrefix = function(value, units) {
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

// Main navigation function
util.parseHash = function() {
    // we need to remove leading hashbang, split pairs by '&' and split arg, val by '='
    var hash = location.hash.replace(/^#!/, "");
    var hashObj = {};
    if (hash) {
        $.each(hash.split("&"), function(i, arg) {
            if (!arg) {
                return
            }
            var kv = arg.split("=");
            var k = kv[0];
            var v = kv[1] ? kv[1].split(',') : undefined;
            hashObj[k] = v;
        });
    }
    hashObj.page = hashObj.page ? hashObj.page[0] : 'Dashboard'
    return hashObj
}

// 
util.setHash = function(h) {
    var hash = '#!page=' + (h.page || 'Dashboard')
    $.each(h, function(arg, value) {
        if (arg === 'page') {
            return
        }
            value = $.isArray(value) ? value.join(',') : value
            hash += '&' + arg + '=' + value
    })
    location.hash = hash
}
