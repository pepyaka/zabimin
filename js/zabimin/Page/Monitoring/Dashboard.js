// Monitoring/Dashboard
define(['Zapi', 'moment', 'typeahead', 'bootstrap-table'], function(zapi, moment) {
    "use strict";

    var init = function(hash) {
        getData(function(hosts, hostGroups, triggers) {
            showOverallStatus(hostGroups, triggers)
            showLastIssues(triggers);
            initGlobalSearch(hosts);
        });
    }
    var update = function(hash) {
        console.log(JSON.stringify(hash))
    }

    function getData(callback) {
        var hostGet = zapi.req('host.get', {
            selectInterfaces: ['ip']
        });
        var hostGroupGet = zapi.req('hostgroup.get', {
            output: ['name'],
            selectHosts: ['name']
        });
        var triggerGet = zapi.req('trigger.get', {
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
                'host'
            ],
            selectLastEvent: [
                'eventid',
                'acknowledged',
                'objectid',
                'clock',
                'ns'
            ],
            selectGroups: 'shorten',
            limit: 20
        });
        $.when(hostGet, hostGroupGet, triggerGet)
            .done(function(hostResponse, hostGroupResponse, triggerResponse) {
                callback(hostResponse[0].result, hostGroupResponse[0].result, triggerResponse[0].result)
            });
    }
    function initGlobalSearch(hosts) {
        var hostGroups = [];
        var ip = [];
        $.each(hosts, function(i, host) {
            $.each(host.groups, function(i, group) {
                hostGroups[group.groupid] = {
                    name: group.name,
                    id: group.groupid
                };
            });
            $.each(host.interfaces, function(i, iface) {
                ip.push({
                    ip: iface.ip,
                    type: zapi.map('Host interface', 'type', iface.type)
                })
            });
        });
        hostGroups = hostGroups.filter(Boolean);
        $('#globalSearch input').prop('disabled', false);
        initMultidataTypeahead(hosts, hostGroups, ip);

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
    function showLastIssues(triggers) {
        var map = {
            cellStyle: { //This map to set <td> classes or css
                severity: function(value, row) {
                    return {
                        classes: [
                            '',
                            'info',
                            'warning',
                            'warning text-danger',
                            'danger',
                            'danger text-danger'
                        ][row.priority]
                    }
                }

            },
            formatter: { //This is cell map (also html inside)
                host: function(hosts) {
                    return '<a href="#!Inventory/Host&host='+hosts[0].host+'">'+hosts[0].host+'</a>'
                },
                lastChange: function(unixtime) {
                    var d = moment(unixtime, 'X');
                    return d.format('lll')
                },
                age: function(unixtime) {
                    var d = moment(unixtime, 'X');
                    return d.fromNow()
                },
                ack: function(value) {
                    var ack;
                    if (+value.acknowledged) {
                        ack = [
                            '<button type="button" class="btn btn-xs btn-success">',
                            'Yes ',
                            '<span class="badge">',
                            4,
                            '</span>',
                            '</button>'
                        ].join('');
                    } else {
                        ack = '<button type="button" class="btn btn-xs btn-warning" data-toggle="modal" data-target="#modalAckEditor">No</button>'
                    }
                    return ack
                },
                info: function(error) {
                    if (error) {
                        return '<span class="glyphicon glyphicon-exclamation-sign" data-toggle="tooltip" title="'+error+'"></span>'
                    }
                }
            }
        };
        var columns = [{
                field: 'hosts',
                title: 'Host',
                sortable: true,
                formatter: map.formatter.host
            }, {
                field: 'description',
                title: 'Issue',
                sortable: true,
                cellStyle: map.cellStyle.severity
            }, {
                field: 'lastchange',
                title: 'Last change',
                sortable: true,
                formatter: map.formatter.lastChange
            }, {
                field: 'lastchange',
                title: 'Age',
                sortable: true,
                formatter: map.formatter.age
            }, {
                field: 'error',
                title: 'Info',
                align: 'center',
                valign: 'middle',
                formatter: map.formatter.info
            }, {
                field: 'lastEvent',
                title: 'ack',
                formatter: map.formatter.ack
            }, {
                field: 'triggerid',
                title: 'Actions'
        }];
        $('#lastIssues table')
            .bootstrapTable('destroy')
            .bootstrapTable({
                data: triggers,
                //search: true,
                //pagination: true,
                //showRefresh: true,
                //showToggle: true,
                //showColumns: true,
                columns: columns
            })
            .prop('disabled', false)
            .fadeTo('fast', 1)
        $('[data-toggle="tooltip"]').tooltip()
    };
    function showOverallStatus(hostGroups, triggers) {
        var data = [];
        var map = {
            cellStyle: {
            },
            formatter: {
                name: function(name) {
                    return '<a href="#!Inventory/Hosts&hostgroup='+name+'">'+name+'</a>'
                },
                priority:  function(value) {
                    return value ? value.length : 0;
                },
            }
        };
        var columns = [{
                field: 'name',
                title: 'Host group',
                sortable: true,
                formatter: map.formatter.name
            }, {
                field: '5',
                title: 'Disaster',
                class: 'danger text-danger',
                sortable: true,
                formatter: map.formatter.priority
            }, {
                field: '4',
                title: 'High',
                class: 'danger',
                sortable: true,
                formatter: map.formatter.priority
            }, {
                field: '3',
                title: 'Average',
                class: 'warning text-danger',
                sortable: true,
                formatter: map.formatter.priority
            }, {
                field: '2',
                title: 'Warning',
                class: 'warning',
                sortable: true,
                formatter: map.formatter.priority
            }, {
                field: '1',
                title: 'Info',
                class: 'info',
                sortable: true,
                formatter: map.formatter.priority
            }, {
                field: '0',
                title: 'Not classified',
                sortable: true,
                formatter: map.formatter.priority
            }, {
                field: 'hosts',
                title: 'Total',
                sortable: true,
        }];
        $.each(hostGroups, function(i, group) {
            data[group.groupid] = {
                name: group.name,
                0: [],
                1: [],
                2: [],
                3: [],
                4: [],
                5: [],
                hosts: group.hosts.length,
                triggers: 0
            }
        });
        $.each(triggers, function(i, trigger) {
            $.each(trigger.groups, function(i, group) {
                data[group.groupid][trigger.priority].push(trigger);
            });
        });
        data = data.filter(function(v) {
            return v[0][0] || v[1][0] || v[2][0] || v[3][0] || v[4][0] || v[5][0]
        });
        data.sort(function(a, b) {
            return a.name > b.name ? 1 : -1
        });
        $('#overallStatus table')
            .bootstrapTable('destroy')
            .bootstrapTable({
                data: data,
                //search: true,
                //pagination: true,
                //showRefresh: true,
                //showToggle: true,
                //showColumns: true,
                columns: columns
            })
            .prop('disabled', false)
            .fadeTo('fast', 1)
        //$('[data-toggle="tooltip"]').tooltip()
    };

    return {
        init: init,
        update: update
    }
});
