// Monitoring/Dashboard
define(['Zapi', 'moment', 'typeahead'], function(Zapi, moment) {
    "use strict";

    var init = function(hash) {
        initGlobalSearch();
        showLastIssues();
    }
    var update = function(hash) {
        console.log(JSON.stringify(hash))
    }

    function initGlobalSearch() {
        var hostGet = Zapi('host.get', {selectInterfaces: 'extend'});

        hostGet.done(createGlobalSearchDatums);

        function createGlobalSearchDatums(zapiResponse) {
            var hosts = [];
            var hostGroups = [];
            var ip = [];
            $.each(zapiResponse.result, function(i, host) {
                hosts.push({
                    host: host.host,
                    name: host.name,
                    id: host.hostid
                });
                $.each(host.groups, function(i, group) {
                    hostGroups[group.groupid] = {
                        name: group.name,
                        id: group.groupid
                    };
                });
                $.each(host.interfaces, function(i, iface) {
                    ip.push({
                        ip: iface.ip,
                        type: Zapi.map.hostinterface.type[iface.type]
                    })
                });
            });
            hostGroups = hostGroups.filter(Boolean);
            $('#globalSearch input').prop('disabled', false);
            initMultidataTypeahead(hosts, hostGroups, ip);
        };
        function initMultidataTypeahead(hosts, hostGroups, ip) {
            var hostsEngine = new Bloodhound({
              datumTokenizer: Bloodhound.tokenizers.obj.whitespace('host'),
              queryTokenizer: Bloodhound.tokenizers.whitespace,
              local: hosts
            });
            var hostGroupsEngine = new Bloodhound({
              datumTokenizer: Bloodhound.tokenizers.obj.whitespace('name'),
              queryTokenizer: Bloodhound.tokenizers.whitespace,
              local: hostGroups
            });
            var ipEngine = new Bloodhound({
              datumTokenizer: Bloodhound.tokenizers.obj.whitespace('ip'),
              queryTokenizer: Bloodhound.tokenizers.whitespace,
              local: ip
            });
             
            hostsEngine.initialize();         
            hostGroupsEngine.initialize();         
            ipEngine.initialize();         
            $('#globalSearch .typeahead')
                .typeahead({
                    highlight: true,
                }, {
                    name: 'hosts',
                    displayKey: 'host',
                    source: hostsEngine.ttAdapter(),
                    templates: {
                        header: '<span class="typeahead-multidata-group">Hosts</span>'
                    }
                }, {
                    name: 'hostGroups',
                    displayKey: 'name',
                    source: hostGroupsEngine.ttAdapter(),
                    templates: {
                        header: '<span class="typeahead-multidata-group">Host groups</span>'
                    }
                }, {
                    name: 'ip',
                    displayKey: 'ip',
                    source: ipEngine.ttAdapter(),
                    templates: {
                        header: '<span class="typeahead-multidata-group">ip</span>'
                    }
                })
                .on('typeahead:selected', function(e, selObj, selGr) {
                    console.log(selObj, selGr)
                });
        };
    };
    function showLastIssues() {
        var req = {
            monitored: 1,
            filter: {
                value: 1
            },
            skipDependent: 1,
            output: [
                'triggerid',
                'state',
                'error',
                'url',
                'expression',
                'description',
                'priority',
                'lastchange'
            ],
            selectHosts: [
                'hostid',
                'name'
            ],
            selectLastEvent: [
                'eventid',
                'acknowledged',
                'objectid',
                'clock',
                'ns'
            ],
            limit: 20
        };
        var triggerGet = Zapi('trigger.get', req);

        triggerGet.done(createStatusTable);

        function createStatusTable(zapiResponse) {
console.log(zapiResponse)
            var dataMap = {
                hosts: function(hosts) {
                    var hostNames = [];
                    $.each(hosts, function(i, host) {
                        hostNames.push(host.name)
                    });
                    return {
                        host: hostNames.join(', ')
                    }
                },
                lastchange: function(unixtime) {
                    var d = moment(unixtime * 1000);
                    return {
                        lastchange: d.format('lll'),
                        age: d.fromNow()
                    }
                },
                lastEvent: function(v, e) {
                    return {
                        ack: Zapi.map.event.acknowledged[v.acknowledged]
                    }
                },
                //source: function(src) {
                //    return {
                //        type: Zapi.map.event.source[src]
                //    }
                //},
                //priority: function(v) {
                //},
                //value: function(v, e) {
                //    return {
                //        value: Zapi.map.event.value[e.source][v]
                //    }
                //},
                //relatedObject: function(ro, e) {
                //    return {
                //        description: ro.description,
                //        severity: Zapi.map.trigger.priority[ro.priority]
                //    }
                //},
                //acknowledged: function(ack) {
                //    return {
                //        acknowledged: Zapi.map.event.acknowledged[ack]
                //    }
                //}
            };
            var tdMap = {
                description: function(row) {
                    var td = [
                        '<td>' + row.description + '</td>',
                        '<td class="info">' + row.description + '</td>',
                        '<td class="warning">' + row.description + '</td>',
                        '<td class="warning text-danger">' + row.description + '</td>',
                        '<td class="danger">' + row.description + '</td>',
                        '<td class="danger text-danger">' + row.description + '</td>'
                    ];
                    return td[row.priority]
                },
                host: function(row) {
                    return '<td><a href="#!Inventory/Hosts&host=' + row.host + '">' + row.host + '</a></td>'
                }
            };

            createTableData(zapiResponse.result);

            function createTableData(zapiResult) {
                var data = [];
                $.each(zapiResult, function(i, event) {
                    var row = {};
                    $.each(event, function(e, v) {
                        dataMap[e] ? $.extend(row, dataMap[e](v, event)) : row[e] = v;
                    })
                    data.push(row);
                });
                createTable(data);
            };
            function createTable(data) {
                var thead = [];
                var tbody = [];
                if (data.length > 0) {
                    $('#lastIssues th').each(function() {
                        thead.push(this.abbr)
                    })
                    $.each(data, function(i, row) {
                        var tr = [];
                        $.each(thead, function(i, th) {
                            if (tdMap[th]) {
                                tr.push(tdMap[th](row));
                            } else {
                                tr.push('<td>' + row[th] + '</td>');
                            }
                        });
                        tbody.push('<tr>'+tr.join('')+'</tr>')
                    });
                    $('#lastIssues tbody')
                        .empty()
                        .append(tbody.join(''))
                    $('#lastIssues .panel-body').hide();
                    $('#lastIssues table').show();
                }
            };
        }
    };

    return {
        init: init,
        update: update
    }
});
