"use strict";

var mDate = new moment(new Date())
mDate.locale('ru')
/****************************** Utilites for all pages **********************/
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
/****************************************************************************/


/*********************** Pages **********************************************/
var page = {
    // globale variable  for navigation
    hash: {},
    // Pages
    Dashboard: {
        name: 'Dashbpard',
        url: 'ajaxPages/Dashboard.html'
    },
    Graphs: {
        name: 'Graphs',
        url: 'ajaxPages/Graphs.html',
        data: {}
    },
    Triggers: {
        pageName: 'Triggers',
        url: 'ajaxPages/Triggers.html',
        createHostSelector: util.createHostSelector,
        zapi: util.zapi,
    }
}
//  Function for load content from url and put in $('#ajaxPage') block
page.load = function() {
    var hash = util.parseHash(location.hash)
    // Check if we have same page    
    if (page.hash.page && page.hash.page == hash.page) {
        if ($.isFunction(page[hash.page].hashChange)) {
            page[hash.page].hashChange(hash)
        }
    } else {
        // Update global hash variable
        page.hash.page = hash.page
        // load page
        var jqxhr = $.ajax({
            mimeType: 'text/html; charset=utf-8', // ! Need set mimeType only when run from local file
            url: 'ajaxPage/' + hash.page + '.html',
            type: 'GET',
            dataType: "html",
        });
        jqxhr.done(function(data) {
                $('#ajaxPage').html(data);
                // Load classes for ajax pages
                $('.selectpicker').selectpicker()
                $('.datetimepicker').datetimepicker({
                    useCurrent: false,
                    language: localStorage.lang
                })
                // Exec js code for ajax page
                page[hash.page].init(hash);
        });
        jqxhr.fail(function (jqXHR, textStatus, errorThrown) {
                alert(errorThrown);
        });
    }
}
page.Graphs.init = function(hash) {
    this.createHostSelector(hash, function(data) {
        if (hash.host) {
            var selHost = $.grep(data.hosts, function(host) {
                return host.host == hash.host
            })[0]
            // sort graphs by name
            selHost.graphs.sort(function(a, b) {
                return a.name > b.name ? 1 : -1
            })
            var selGraphs = [], thumbGraphs = [];
            $("#graphList")
                .empty()
            $.each(selHost.graphs, function(i, thumbGraph) {
                var o = {
                    type: 'thumbnail',
                    div: 'graphThumb-' + i,
                    host: selHost.host,
                    graph: thumbGraph
                }
                var h = util.createHash({
                    page: hash.page,
                    host: selHost.host,
                    graph: thumbGraph.name
                })
                $("#graphList")
                    .append('<li><a id="'+o.div+'" href="'+h+'" class="graph-thumbnail pull-left"></a></li>')
                chart.getData(o)
            })
        }
        if (hash.host && hash.graph) {
            var o = {
                type: 'history',
                div: 'graph',
                host: hash.host,
                graph: hash.graph
            }
            $("#graphs").append('<div id="'+o.div+'" class="graph"></div>')
            chart.getData(o)
        }
    })
}
page.Dashboard.init = function(hash) {
    util.zapi([req], function(zapiResponse) {
        $('#aaa').append('<pre>'+JSON.stringify(zapiResponse, undefined, 2)+'</pre>')
    })
}
    
page.Triggers.init = function(hash) {
    var hashChange = page.Triggers.hashChange
    // bind filter events
    $('#filterTriggerStatus')
        .on('change.filterTriggerStatus', function() {
            if ($(this).val() == 'Any') {
                page.hash.triggerStatus = 'Any'
            } else {
                delete page.hash.triggerStatus
            }
            util.setHash(page.hash)
        })
    $('#filterAcknowledgeStatus')
        .on('change.filterAcknowledgeStatus', function() {
            if ($(this).val() == 'withUnacknowledgedEvents') {
                page.hash.withUnacknowledgedEvents = true
                delete page.hash.withLastEventUnacknowledged
            } else if ($(this).val() == 'withLastEventUnacknowledged') {
                page.hash.withLastEventUnacknowledged = true
                delete page.hash.withUnacknowledgedEvents
            } else {
                delete page.hash.withUnacknowledgedEvents
                delete page.hash.withLastEventUnacknowledged
            }
            util.setHash(page.hash)
        })
    $('#filterMinSeverity')
        .on('change', function() {
            var selVal = $(this).val();
            if (selVal == 0) {
                delete page.hash.min_severity
            } else {
                page.hash.min_severity = selVal
            }
            util.setHash(page.hash)
        })
    $('#filterLastChangeSince')
        .on('dp.change', function(e) {
            $('#filterLastChangeTill').data("DateTimePicker").setMinDate(e.date);
            var m =  moment(e.date);
            page.hash.lastChangeSince =  m.format('X');
            util.setHash(page.hash)
        })
        .on('click', '.datetimepicker-clear', function() {
            $(this).parents().find('input').val('')
            delete page.hash.lastChangeSince
            util.setHash(page.hash)
        })
    $('#filterLastChangeTill')
        .on('dp.change', function(e) {
            $('#filterLastChangeSince').data("DateTimePicker").setMaxDate(e.date);
            var m =  moment(e.date);
            page.hash.lastChangeTill = m.format('X');
            util.setHash(page.hash)
        })
        .on('click', '.datetimepicker-clear', function() {
            $(this).parents().find('input').val('')
            delete page.hash.lastChangeTill
            util.setHash(page.hash)
        })
    $('#filterByName')
        .on('click', 'button', function() {
            var searchPattern = $('#filterByName input').val()
            if (searchPattern) {
                page.hash.search = searchPattern.replace('=', ' ').replace('&', ' ')
            } else {
                delete page.hash.search
            }
            util.setHash(page.hash)
        })
    $('#filterShowDetails')
        .on('change.filterShowDetails', function() {
            if ($(this).is(':checked')) {
                page.hash.showDetails = true
            } else {
                delete page.hash.showDetails
            }
            util.setHash(page.hash)
        })
    $('#filterMaintenance')
        .on('change.filterMaintenance', function() {
            if ($(this).is(':checked')) {
                page.hash.maintenance = true
            } else {
                delete page.hash.maintenance
            }
            util.setHash(page.hash)
        })
    $('#filterReset')
        .on('click', function(e) {
            e.preventDefault();
            delete page.hash.triggerStatus
            $('#filterTriggerStatus').selectpicker('val', 'only_true')
            delete page.hash.withUnacknowledgedEvents
            delete page.hash.withLastEventUnacknowledged
            $('#filterAcknowledgeStatus').selectpicker('val', 'Any')
            delete page.hash.min_severity
            $('#filterMinSeverity').selectpicker('val', '0')
            delete page.hash.lastChangeSince
            $('#filterLastChangeSince input').val('')
            delete page.hash.lastChangeTill
            $('#filterLastChangeTill input').val('')
            delete page.hash.search
            $('#filterByName input').val('')
            delete page.hash.showDetails
            $('#filterShowDetails').prop('checked', false)
            delete page.hash.maintenance
            $('#filterMaintenance').prop('checked', false)
            util.setHash(page.hash)
        })
    util.createHostSelector(hash, function() {
        hashChange(hash)
    })
}
page.Triggers.hashChange = function(hash) {
    console.log(hash, page.hostSelectorData)
    var createStatusTable = page.Triggers.createStatusTable
    var reqParams = {
            output: 'extend',
            selectHosts: 'extend',
            //filter: {
            //    'value': 1
            //},
            sortfield: 'lastchange',
            sortorder: 'DESC',
            expandComment: true,
            expandDescription: true,
            expandExpression: true,
            only_true: true,
            active: true,
            monitored: true
            //search: {description: 'ping'}
    };
    var reqParamsExt = {};
    $.each(hash, function(k, v) {
        if (k === 'page') {
            return
        }
        if (k === 'host' && v.length > 0) {
            reqParamsExt.hostids = [];
            $.each(page.hostSelectorData.host, function(i, host) {
               reqParamsExt.hostids.push(host.hostid)
            })
            return
        }
        if (k === 'hostgroup' && v.length > 0) {
            reqParamsExt.groupids = [];
            $.each(page.hostSelectorData.hostGroup, function(i, hostGroup) {
               reqParamsExt.groupids.push(hostGroup.groupid)
            })
            return
        }
        // trigger.get bug only_true:false doesn't work
        if (k === 'triggerStatus' && v[0] === 'Any' ) {
            delete reqParams.only_true
            return
        } 
        // 
        if (k === 'maintenance' && v[0]) {
            reqParamsExt.maintenance = true
            return
        }
        if (k === 'search') {
            reqParamsExt.search = {
                description: v[0]
            };
            return
        }
        if ($.isArray(v)) {
            if (v.length > 1) {
                reqParamsExt[k] = v
            } else {
                reqParamsExt[k] = v[0]
            }
        }
    })
    createStatusTable($.extend(reqParams, reqParamsExt))
}
page.Triggers.createStatusTable = function(reqParams) {
    var thead = [];
    var tbody = [];
    var req = {
            method: 'trigger.get',
            params: reqParams
    };
    var rowDataMap = {
        lastchange: function(rowData, unixtime) {
            var d = moment(unixtime * 1000);
            rowData.lastchange = d.format('lll')
            rowData.age = d.fromNow()
        },
        hosts: function(rowData, hostsArray) {
            rowData.hosts = hostsArray[0].host
        },
        priority: function(rowData, priority) {
            rowData.priority = [
                'info',
                'info',
                'warning',
                'warning',
                'danger',
                'danger'][priority];
            rowData.severity = [
                'Not classified',
                'Information',
                'Warning',
                'Average',
                'High',
                'Disaster'
            ][priority];
        },
        value: function(rowData, val) {
            rowData.value = [
                '<span class="text-success">OK</span>',
                '<span class="text-danger">Problem</span>'
            ][val];
        }
    };
    $('#triggers th').each(function() {
        thead.push(this.abbr)
    })
    util.zapi([req], function(zapiResponse) {
        $.each(zapiResponse[0].result, function(i, trigger) {
            var tr = [];
            var rowData = {};
            $.each(trigger, function(k, v) {
                if (rowDataMap[k]) {
                    rowDataMap[k](rowData, v)
                } else {
                    rowData[k] = v
                }
            })
            $.each(thead, function(i, th) {
                tr.push('<td>' + rowData[th] + '</td>')
            })
            tbody.push('<tr class="'+rowData.priority+'">'+tr.join('')+'</tr>')
        })
        $('#triggers tbody')
            .empty()
            .append(tbody.join(''))
    })
}
function Page() {
}
Page.prototype.load = page.load
/****************************************************************************/

// main function
$(document).ready(function(){
    // Add user welcome message
    $('#user-menu')
        .append(localStorage.name+' '+localStorage.surname+'<b class="caret"></b>');
    // Ajax pages on hash url changes
    $(window).on("hashchange", function() {
        page.load()
    })
    // initial page load
    page.load()
});


/**************** Может пригодиться ***********************/
/*
// http://fgnass.github.io/spin.js/
var spinnerConf = {
  lines: 13, // The number of lines to draw
  length: 20, // The length of each line
  width: 10, // The line thickness
  radius: 30, // The radius of the inner circle
  corners: 1, // Corner roundness (0..1)
  rotate: 0, // The rotation offset
  direction: 1, // 1: clockwise, -1: counterclockwise
  className: 'spinner', // The CSS class to assign to the spinner
  zIndex: 2e9, // The z-index (defaults to 2000000000)
  top: '50%', // Top position relative to parent
  left: '50%' // Left position relative to parent
};
var target = document.getElementById('foo');
var spinner = new Spinner(opts).spin(target);
*/
