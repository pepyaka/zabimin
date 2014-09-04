"use strict";

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
