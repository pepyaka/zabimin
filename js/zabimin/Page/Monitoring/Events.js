// Monitoring/Events
define(['Zapi', 'Util', 'Page/nav', 'moment', 'bootstrap-table', 'bootstrap-select', 'js/lib/daterangepicker.js'], function(zapi, Util, nav, moment) {
    "use strict";

    var data = {};
    var hostSelector = nav.hostSelector; // Shorthands
    var filter = {
        init: function(changeHashArgs) {
            var now = new Date();
            var daterangepickerOpts = {
                format: 'lll',
                timePicker: true,
                timePicker12Hour: false,
                maxDate: now,
                ranges: {
                    'Last Hour': [moment().subtract(1, 'hour'), now],
                    'Last Day': [moment().subtract(1, 'day'), now],
                    'Last Week': [moment().subtract(1, 'week'), now],
                    'Last Month': [moment().subtract(1, 'month'), now],
                    'Last Year': [moment().subtract(1, 'year'), now]
                },
                opens: 'left'
            };
            filter.callback = changeHashArgs;
            $('#filterEventType')
                .on('change', function() {
                    var v = $(this).val().split('.');
                    changeHashArgs({
                        source: +v[0] || null,
                        object: +v[1] || null
                    });
                });
            $('#timeRange input')
                .daterangepicker(daterangepickerOpts, function(start, end) {
                    changeHashArgs({
                        time_from: parseInt(start/1000),
                        time_till: parseInt(end/1000)
                    });
                });
            $('#timeRange button')
                .on('click', function() {
                    $('#timeRange input')
                        .val('')
                    changeHashArgs({
                        time_from: null,
                        time_till: null
                    });
                });
            createTriggerModal(changeHashArgs);
            $('#filterTriggerReset')
                .on('click', function() {
                    changeHashArgs({
                        objectids: null
                    });
                });
        },
        set: function(hashArgs) {
            var filterArgs = {};
            var map = {
            };
            $.each(hashArgs, function(k, v) {
                if (map[k]) {
                    map[k](v[0]);
                    filterArgs[k] = v;
                };
            });
            filter.callback(filterArgs)
        },
        reset: function() {
            filter.callback({
            });
        }
    };

    var init = function(hashArgs) {
        $('#filterTriggerGroupSelect').selectpicker();
        $('#filterTriggerHostSelect').selectpicker();
        $('#filterTriggerSelect').selectpicker();
        hostSelector.init(function(hosts, hostGroups) {
            data.hosts = hosts;
            data.hostGroups = hostGroups;
            hostSelector.set(hashArgs);
            setEventsReqParams(hashArgs)
        });
        hostSelector.done(function(selected) {
            Util.hash(selected);
        });

        filter.init(function(filterArgs) {
            Util.hash(filterArgs);
        });
        filter.set(hashArgs);
    }
    var update = function(hashArgs) {
        filter.set(hashArgs);
        hostSelector.set(hashArgs);
        setEventsReqParams(hashArgs); 
    }
    
    function createTriggerModal(changeHashArgs) {
        var reqParams = {
            selectTriggers: ['description','priority','state','status']
        };
        var severityClass = [
            '',
            'info',
            'warning',
            'warning text-danger',
            'danger',
            'danger text-danger'
        ];
        var stateStatusClass = [
            ['Enabled','Disabled'],
            ['Unknown','Unknown'],
        ];
            
        var hostGet = zapi.req('host.get', reqParams);
        hostGet.done(function(zapiResponse) {
            var hostGroups = [];
            var hostGroupList = [];
            var hostList = [];
            var hosts = zapiResponse.result;

            $.each(hosts, function(i, host) {
                $.each(host.groups, function(i, hostGroup) {
                    if (hostGroups[hostGroup.groupid]) {
                        hostGroups[hostGroup.groupid].hosts.push(host.hostid)
                    } else {
                        hostGroups[hostGroup.groupid] = hostGroup
                        hostGroups[hostGroup.groupid].hosts = [];
                    }
                });
            });
            hostGroups = hostGroups.filter(Boolean);
            hostGroups.sort(function(a, b) {
                return a.name > b.name ? 1 : -1
            });

            $.each(hostGroups, function(i, hostGroup) {
                hostGroupList.push(
                    '<li data-hostids="'+hostGroup.hosts+'" data-groupid="'+hostGroup.groupid+'">',
                        '<a href="#">'+hostGroup.name+'</a>',
                    '</li>'
                )
            });
            $('#filterTriggerHostGroupList')
                .append(hostGroupList.join(''))
                .on('click', 'li', function(e) {
                    e.preventDefault()
                    var $group = $(this);
                    var hostids = $group.data('hostids').split(',').map(Number);
                    $group.addClass('active')
                    $group.siblings('li')
                        .removeClass('active')
                    if ($group.data('groupid') == 0) {
                        $('#filterTriggerHostList .panel')
                            .show()
                    } else {
                        $('#filterTriggerHostList .panel')
                            .hide()
                            .each(function() {
                                var $host = $(this);
                                if ($.inArray($host.data('hostid'), hostids) > -1) {
                                    $host.show()
                                }
                            });
                    }
                });

            $.each(hosts, function(i, host) {
                var triggerList = [];
                $.each(host.triggers, function(i, trigger) {
                    triggerList.push(
                            '<tr data-triggerid="'+trigger.triggerid+'">',
                                '<td><a href="#">'+trigger.description+'</a></td>',
                                '<td class="'+severityClass[trigger.priority]+'">'+zapi.map('trigger', 'priority', trigger.priority)+'</td>',
                                '<td>'+stateStatusClass[trigger.state][trigger.status]+'</td>',
                            '</tr>'
                    );
                });
                hostList.push(
                    '<div class="panel panel-default" data-hostid="'+host.hostid+'">',
                        '<div class="panel-heading">',
                            '<h4 class="panel-title">',
                                '<a data-toggle="collapse" href="#triggersHostid_'+host.hostid+'">',
                                    host.host,
                                '</a>',
                            '</h4>',
                        '</div>',
                        '<div id="triggersHostid_'+host.hostid+'" class="panel-collapse collapse">',
                            '<table class="table table-hover table-condensed">',
                                '<thead>',
                                    '<tr><th>Name</th><th>Severity</th><th>Status</th></tr>',
                                '</thead>',
                                '<tbody>',
                                    triggerList.join(''),
                                '</tbody>',
                            '</table>',
                        '</div>',
                    '</div>'
                );
            });
            $('#filterTriggerHostList')
                .append(hostList.join(''))
                .on('click', 'tr a', function(e) {
                    e.preventDefault()
                    $('#modalFilterTrigger').modal('hide');
                    changeHashArgs({
                        objectids: $(this).parents('tr').data('triggerid')
                    })
                });

            $("#filterTrigger button")
                .prop('disabled', false)
        });
    }
    function setEventsReqParams(args) {
        var reqParams = {
            //filter: {
            //    'value': 1
            //},
            //only_true: true,
            //skipDependent: true,
            //active: true,
            //monitored: true
            //search: {description: 'ping'}
            limit: 100,
            selectRelatedObject: 'extend',
            selectHosts: ['host'],
            expandExpression: true
        };
        var map = {
            //eventid: function(v) {
            //},
            host: function(v) {
                reqParams.hostids = [];
                $.each(v, function(i, hostname) {
                    $.each(data.hosts, function(i, host) {
                        if (hostname === host.host) {
                            reqParams.hostids.push(host.hostid)
                        }
                    });
                });
            },
            hostgroup: function(v) {
                reqParams.groupids = [];
                $.each(v, function(i, groupname) {
                    $.each(data.hostGroups, function(i, group) {
                        if (groupname === group.name) {
                            reqParams.groupids.push(group.groupid)
                        }
                    });
                });
            },
            //objectid: function(v) {
            //    reqParams.groupids = [];
            //},
            //object: function(v) {
            //},
            //acknowledged: function(v) {
            //},
            //eventid_from: function(v) {
            //},
            //eventid_till: function(v) {
            //},
            //source: function(v) {
            //    reqParams.source = +v
            //},
            //time_from: function(v) {
            //},
            //time_till: function(v) {
            //},
            //value: function(v) {
            //}
        }
        $.each(args, function(k, v) {
            map[k] ? map[k](v) : reqParams[k] = v[0];
        });
        createStatusTable(reqParams);
    }
    function createStatusTable(reqParams) {
        var duration = [];
        var map = {
            html: { //This map to set <td> classes or css
                status: function(value) {
                    return {
                        classes: {
                            'OK': 'text-success',
                            'Problem': 'text-danger'
                        }[value]
                    }
                },
                severity: function(value) {
                    return {
                        classes: {
                            'Not classified': '',
                            'Information': 'info',
                            'Warning': 'warning',
                            'Average': 'warning text-danger',
                            'High': 'danger',
                            'Disaster': 'danger text-danger'
                        }[value]
                    }
                }
                    
            },
            data: { //This is cell map (also html inside)
                clock: function(unixtime) {
                    var d = moment(unixtime, 'X');
                    return d.format('lll')
                },
                host: function(hosts) {
                    var hostNames = [];
                    $.each(hosts, function(i, host) {
                        hostNames.push(host.host)
                    });
                    return hostNames.join(', ')
                },
                description: function(relateObject) {
                    return relateObject.description
                },
                status: function(value) {
                    return zapi.map('Trigger', 'value', value).value
                },
                severity: function(relatedObject) {
                    return zapi.map('Trigger', 'priority', relatedObject.priority).value
                },
                ack: function(value) {
                    var ack;
                    if (+value) {
                        ack = [
                            '<button type="button" class="btn btn-xs btn-success">',
                            'Yes ',
                            '<span class="badge">',
                            4,
                            '</span>',
                            '</button>'
                        ].join('');
                    } else {
                        ack = '<button type="button" class="btn btn-xs btn-warning" data-toggle="popover" title="Popover">No</button>'
                    }
                    return ack
                },
                duration: function(v, row) {
                    var d;
                    if (duration[row.objectid]) {
                        d = moment.duration(duration[row.objectid] - v, 's').humanize();
                        duration[row.objectid] = v;
                    } else {
                        d = moment(v, 'X').fromNow();
                        duration[row.objectid] = v;
                    }
                    return d
                }
            }
        };
        var columns = [{
                field: 'clock',
                title: 'Time',
                sortable: true,
                formatter: map.data.clock
            }, {
                field: 'hosts',
                title: 'Host',
                sortable: true,
                formatter: map.data.host
            }, {
                field: 'relatedObject',
                title: 'Description',
                formatter: map.data.description
            }, {
                field: 'value',
                title: 'Status',
                sortable: true,
                formatter: map.data.status,
                cellStyle: map.html.status
            }, {
                field: 'relatedObject',
                title: 'Severity',
                sortable: true,
                formatter: map.data.severity,
                cellStyle: map.html.severity
            }, {
                field: 'clock',
                title: 'Duration',
                sortable: true,
                formatter: map.data.duration
            }, {
                field: 'acknowledged',
                title: 'Ack',
                align: 'center',
                //valign: 'middle',
                formatter: map.data.ack,
                events: {
                    'click button': function (e, value, row, index) {
                        console.log($(this), value, row, index);
                    }
                }
            }, {
                field: 'objectid',
                title: 'Actions'
        }];
        var eventGet = zapi.req('event.get', reqParams)
        $('#triggerEvent')
            .prop('disabled', true)
            .fadeTo('fast', 0.3)

        eventGet.done(function(zapiResponse) {
            console.log('event.get', reqParams, zapiResponse.result)
            $('#triggerEvent')
                .bootstrapTable('destroy')
                .bootstrapTable({
                    data: zapiResponse.result,
                    search: true,
                    pagination: true,
                    //showRefresh: true,
                    showToggle: true,
                    //showColumns: true,
                    columns: columns
                })
                //.on('click', function (e, name, args) {
                //    console.log(e, name, args);
                //})
                .prop('disabled', false)
                .fadeTo('fast', 1)
        });
    }
    
    return {
        init: init,
        update: update
    }
});
