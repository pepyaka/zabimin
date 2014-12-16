// Monitoring/Events
define(['Zapi', 'Util', 'Page/nav', 'moment', 'bootstrap-table'], function(Zapi, Util, nav, moment) {
    "use strict";

    var data = {};
    var hostSelector = nav.hostSelector; // Shorthands
    var filter = {
        init: function(changeHashArgs) {
            filter.callback = changeHashArgs;
            $('#filterEventType')
                .on('change', function() {
                    var v = $(this).val().split('.');
                    changeHashArgs({
                        source: +v[0] || null,
                        object: +v[1] || null
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
            limit: 10,
            selectRelatedObject: 'extend',
            selectHosts: ['host'],
            expandExpression: true
        };
        var map = {
            eventid: function(v) {
            },
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
            objectid: function(v) {
            },
            //object: function(v) {
            //},
            acknowledged: function(v) {
            },
            eventid_from: function(v) {
            },
            eventid_till: function(v) {
            },
            //source: function(v) {
            //    reqParams.source = +v
            //},
            time_from: function(v) {
            },
            time_till: function(v) {
            },
            value: function(v) {
            }
        }
        $.each(args, function(k, v) {
            map[k] ? map[k](v) : reqParams[k] = v[0];
        });
        createStatusTable(reqParams);
    }
    function createStatusTable(reqParams) {
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
                    return Zapi.map.trigger.value[value]
                },
                severity: function(relatedObject) {
                    return Zapi.map.trigger.priority[relatedObject.priority]
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
                        ack = '<button type="button" class="btn btn-xs btn-warning" data-toggle="tooltip" data-placement="left" title="Tooltip on left">No</button>'
                    }
                    return ack
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
                field: 'age',
                title: 'Duration',
                sortable: true
            }, {
                field: 'acknowledged',
                title: 'Ack',
                align: 'center',
                //valign: 'middle',
                formatter: map.data.ack,
                events: {
                    'click button': function (e, value, row, index) {
                        console.log($(this), value, row, index);
                        $(this).tooltip()
                        
                    }
                }
            }, {
                field: 'eventid',
                title: 'Actions'
        }];
        var eventGet = Zapi('event.get', reqParams)

        eventGet.done(function(zapiResponse) {
            console.log('event.get', reqParams, zapiResponse.result)
            $('#triggerEvent')
                .bootstrapTable({
                    data: zapiResponse.result,
                    search: true,
                    pagination: true,
                    //showRefresh: true,
                    showToggle: true,
                    showColumns: true,
                    columns: columns
            //})
            //.on('all.bs.table', function (e, name, args) {
            //    console.log('Event:', name, ', data:', args);
            });
        });
    }
    
    return {
        init: init,
        update: update
    }
});
