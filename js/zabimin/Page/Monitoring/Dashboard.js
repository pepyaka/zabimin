// Monitoring/Dashboard
define(['Zapi', 'moment', 'typeahead', 'bootstrap-table'], function(zapi, moment) {
    "use strict";

    var init = function(hash) {
        initGlobalSearch();
        showLastIssues();
    }
    var update = function(hash) {
        console.log(JSON.stringify(hash))
    }

    function initGlobalSearch() {
        var hostGet = zapi.req('host.get', {selectInterfaces: 'extend'});

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
                        type: zapi.map('Host interface', 'type', iface.type)
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
                'host'
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
        var triggerGet = zapi.req('trigger.get', req);

        triggerGet.done(function(zapiResponse) {
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
                    data: zapiResponse.result,
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
        });
    };

    return {
        init: init,
        update: update
    }
});
