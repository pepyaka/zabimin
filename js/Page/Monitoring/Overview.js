define(['Zapi', 'moment', 'Util', 'bootstrap-table', 'bootstrap-select'], function(zapi, moment, util) {
    "use strict";


    //Page global variables
    var page = '#!Monitoring/Overview';


    //Page components
    var filter = {
        init: function(hashArgs) {
            var groupGet = zapi.req('hostgroup.get', {
                real_hosts: true,
                output: ['name'],
                selectHosts: 'count'
            });
            $('.selectpicker')
                .selectpicker();
            groupGet.done(function(zapiResponse) {
                var groups = zapiResponse.result;
                $('#group-list')
                    .append(groups.map(function (g) {
                        var dataContent = g.name + '<span class="badge pull-right">' + g.hosts + '</span>';
                        return (
                            '<option value="'+g.groupid+'" data-content=\''+dataContent+'\'>' +
                                    g.name +
                            '</option>'
                        )
                    }))
                    .prop('disabled', false)
                    .selectpicker('refresh')
                    .on('change', function (e) {
                        var $opt = $(this);
                        var ha = {};
                        ha[$opt.data('hashArgs')] = $opt.val() || null;
                        util.hash(ha, true);
                    });
                filter.update(hashArgs);
            });
        },
        update: function(hashArgs) {
            $.each(hashArgs, function(k, v) {
                $('[data-hash-args="'+k+'"]')
                    .selectpicker('val', v)
            });
            if (hashArgs.groupid) {
                $('#overview-triggers')
                    .prop('href', '#!Monitoring/Overview/Triggers&groupid=' + hashArgs.groupid);
                $('#overview-data')
                    .prop('href', '#!Monitoring/Overview/Data&groupid=' + hashArgs.groupid);
            } else {
                $('#overview-triggers')
                    .prop('href', '#!Monitoring/Overview/Triggers');
                $('#overview-data')
                    .prop('href', '#!Monitoring/Overview/Data');
            }
        }
    };
    var overviewTable = {
        init: function (hashArgs) {
            var columns = [{
                    field: 'name',
                    title: 'Host',
                    sortable: true,
                    class: 'text-nowrap',
                }, {
                    field: 'status',
                    title: 'Host status',
                    sortable: true,
                    formatter: function(v, host) {
                        var sClass = [
                            'text-success',
                            'text-danger'
                        ][v];
                        return [
                            '<span class="' + sClass + '">',
                                zapi.map('Host', 'status', v).value,
                            '</span>'
                        ].join('')
                    }
                }, {
                    field: 'available',
                    title: 'Zabbix agent',
                    sortable: true,
                    formatter: function(v, host) {
                        var sClass = [
                            'text-muted',
                            'text-success',
                            'text-danger expanded-info'
                        ][v];
                        return (
                            '<span class="'+sClass+'">' +
                                zapi.map('Host', 'available', v).value +
                                '<div class="expanded-info-content-right">' +
                                    '<h4>' +
                                        '<span class="label label-danger">' +
                                            host.error +
                                        '</span>' +
                                    '</h4>' +
                                '</div>' +
                            '</span>'
                        )
                    }
                }, {
                    field: 'ipmi_available',
                    title: 'IPMI agent',
                    formatter: function(v, host) {
                        var sClass = [
                            'text-muted',
                            'text-success',
                            'label label-danger hint--right hint--rounded hint--error'
                        ][v];
                        var hint = ['', '', 'data-hint=\''+host.ipmi_error+'\''][v];
                        return [
                            '<span class="' + sClass + '"' + hint + '>',
                                zapi.map('Host', 'ipmi_available', v).value,
                            '</span>'
                        ].join('')
                    }
                }, {
                    field: 'jmx_available',
                    title: 'JMX agent',
                    formatter: function(v, host) {
                        var sClass = [
                            'text-muted',
                            'text-success',
                            'label label-danger hint--right hint--rounded hint--error'
                        ][v];
                        var hint = ['', '', 'data-hint=\''+host.jmx_error+'\''][v];
                        return [
                            '<span class="' + sClass + '"' + hint + '>',
                                zapi.map('Host', 'jmx_available', v).value,
                            '</span>'
                        ].join('')
                    }
                }, {
                    field: 'snmp_available',
                    title: 'SNMP agent',
                    formatter: function(v, host) {
                        var sClass = [
                            'text-muted',
                            'text-success',
                            'label label-danger hint--right hint--rounded hint--error'
                        ][v];
                        var hint = ['', '', 'data-hint=\''+host.snmp_error+'\''][v];
                        return [
                            '<span class="' + sClass + '"' + hint + '>',
                                zapi.map('Host', 'snmp_available', v).value,
                            '</span>'
                        ].join('')
                    }
                }, {
                    field: 'applications',
                    title: 'Apps',
                    formatter: function(i, host) {
                        return '<a href="#!Monitoring/Latest&hostid='+host.hostid+'">'+i+'</a>'
                    }
                }, {
                    field: 'discoveries',
                    title: 'LLD',
                }, {
                    field: 'graphs',
                    title: 'Graphs',
                    formatter: function(g, host) {
                        return '<a href="#!Monitoring/Graphs&hostid='+host.hostid+'">'+g+'</a>'
                    }
                }, {
                    field: 'httpTests',
                    title: 'Web',
                    formatter: function(w, host) {
                        return '<a href="#!Monitoring/Web&hostid='+host.hostid+'">'+w+'</a>'
                    }
                }, {
                    field: 'interfaces',
                    title: 'Interfaces',
                    formatter: function(i, host) {
                        return '<a href="#!Inventory/Host&hostid='+host.hostid+'">'+i.length+'</a>'
                    }
                }, {
                    field: 'items',
                    title: 'Items',
                    formatter: function(i, host) {
                        return '<a href="#!Monitoring/Latest&hostid='+host.hostid+'">'+i+'</a>'
                    }
                }, {
                    field: 'parentTemplates',
                    title: 'Templates',
                }, {
                    field: 'screens',
                    title: 'Screens',
                    formatter: function(s, host) {
                        return '<a href="#!Monitoring/Screens&hostid='+host.hostid+'">'+s+'</a>'
                    }
                }, {
                    field: 'triggers',
                    title: 'Triggers',
                    formatter: function(t, host) {
                        return '<a href="#!Monitoring/Triggers&hostid='+host.hostid+'">'+t+'</a>'
                    }
            }];
            $('#overview-table table')
                .bootstrapTable({
                    search: true,
                    clickToSelect: true,
                    showToggle: true,
                    showColumns: true,
                    showPaginationSwitch: true,
                    pagination: true,
                    pageSize: 20,
                    pageList: [10, 20, 50, 100],
                    columns: columns,
                    rowStyle: function(row) {
                        if (row.status == 1) {
                            return {
                                classes: 'disabled-link danger'
                            }
                        }
                        return {}
                    }
                })
                .css('opacity', .3)
            overviewTable.update(hashArgs);
        },
        update: function (hashArgs) {
            var hostGet = zapi.req('host.get', {
                groupids: hashArgs.groupid,
                output: 'extend',
                selectApplications: 'count',
                selectDiscoveries: 'count',
                selectGraphs: 'count',
                selectHttpTests: 'count',
                selectInterfaces: 'extend',
                selectItems: 'count',
                selectParentTemplates: 'count',
                selectScreens: 'count',
                selectTriggers: 'count'
            })
            $('#overview-table table')
                .fadeTo('fast', .3)
            hostGet.done(function(zapiResponse) {
                var hosts = zapiResponse.result;
                $('#overview-table table')
                    .bootstrapTable('load', hosts)
                    .fadeTo('fast', 1)
            });
        }
    };


    //Page external methods
    var init = function(hashArgs) {
        filter.init(hashArgs);
        overviewTable.init(hashArgs);
    };
    var update = function(hashArgs) {
        filter.update(hashArgs);
        overviewTable.update(hashArgs);
    };


    return {
        init: init,
        update: update
    }
});
