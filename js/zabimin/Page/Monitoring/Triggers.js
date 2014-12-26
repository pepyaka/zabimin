// Monitoring/Triggers page
define(['Page','Zapi', 'Util', 'Page/nav', 'moment', 'bootstrap-table'], function(Page, Zapi, Util, nav, moment) {
    var data = {};// work data
    //var hash = {}; // Each page has own arguments
    var hostSelector = nav.hostSelector; // Shorthands
    var filter = {
        init: function(changeHashArgs) {
            filter.callback = changeHashArgs;
            $('#filterTriggerStatus')
                .on('change', function() {
                    changeHashArgs({
                        triggerStatus: $(this).val() || null
                    });
                })
            $('#filterAcknowledgeStatus')
                .on('change', function() {
                    changeHashArgs({
                        acknowledgeStatus: $(this).val() || null
                    });
                });
            $('#filterEvents')
                .on('change', function() {
                    changeHashArgs({
                        events: $(this).val() || null
                    });
                });
            $('#filterMinSeverity')
                .on('change', function() {
                    changeHashArgs({
                        minSeverity: $(this).val() || null
                    });
                });
            $('#filterLastChangeSince')
                .on('dp.change', function(e) {
                    var m =  moment(e.date);
                    changeHashArgs({
                        lastChangeSince: m.format('YYYY-MM-DD')
                    });
                    $('#filterLastChangeTill').data("DateTimePicker").setMinDate(e.date);
                })
                .on('click', '.datetimepicker-clear', function() {
                    changeHashArgs({
                        lastChangeSince: null
                    });
                    $('#filterLastChangeSince').find('input').val('')
                });
            $('#filterLastChangeTill')
                .on('dp.change', function(e) {
                    var m =  moment(e.date);
                    changeHashArgs({
                        lastChangeTill: m.format('YYYY-MM-DD')
                    });
                    $('#filterLastChangeSince').data("DateTimePicker").setMaxDate(e.date);
                })
                .on('click', '.datetimepicker-clear', function() {
                    changeHashArgs({
                        lastChangeTill: null
                    });
                    $('#filterLastChangeTill').find('input').val('')
                });
            $('#filterByName')
                .on('click', 'button', function() {
                    var searchPattern = $('#filterByName input').val()
                    searchPattern = searchPattern.replace('=', ' ').replace('&', ' ')
                    changeHashArgs({
                        byName: searchPattern
                    });
                });
            $('#filterShowDetails')
                .on('change', function() {
                    changeHashArgs({
                        showDetails: $(this).is(':checked') || null
                    });
                });
            $('#filterMaintenance')
                .on('change', function() {
                    changeHashArgs({
                        maintenance: $(this).is(':checked') || null
                    });
                });
            $('#filterReset')
                .on('click', function(e) {
                    e.preventDefault();
                    filter.reset();
                });
        },
        set: function(hashArgs) {
            var filterArgs = {};
            // we need only filter args
            var map = {
                triggerStatus: function(v) {
                    $('#filterTriggerStatus').selectpicker('val', v)
                },
                acknowledgeStatus: function(v) {
                    $('#filterAcknowledgeStatus').selectpicker('val', v)
                },
                events: function(v) {
                    $('#filterEvents').selectpicker('val', v)
                },
                minSeverity: function(v) {
                    $('#filterMinSeverity').selectpicker('val', v)
                },
                lastChangeSince: function(v) {
                    $('#filterLastChangeSince input').val(v)
                },
                lastChangeTill: function(v) {
                    $('#filterLastChangeTill input').val(v)
                },
                byName: function(v) {
                    $('#filterByName input').val(v)
                },
                showDetails: function(v) {
                    $('#filterShowDetails').prop('checked', v)
                },
                maintenance: function(v) {
                    $('#filterMaintenance').prop('checked', v)
                }
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
                triggerStatus: null,
                acknowledgeStatus: null,
                events: null,
                minSeverity: null,
                lastChangeSince: null,
                lastChangeTill: null,
                byName: null,
                showDetails: null,
                maintenance: null
            });
            $('#filterTriggerStatus').selectpicker('val', '')
            $('#filterAcknowledgeStatus').selectpicker('val', '')
            $('#filterEvents').selectpicker('val', '')
            $('#filterMinSeverity').selectpicker('val', '')
            $('#filterLastChangeSince input').val('')
            $('#filterLastChangeTill input').val('')
            $('#filterByName input').val('')
            $('#filterShowDetails').prop('checked', false)
            $('#filterMaintenance').prop('checked', false)
        }
    };

    var init = function(hashArgs) {
        hostSelector.init(function(hosts, hostGroups) {
            data.hosts = hosts;
            data.hostGroups = hostGroups;
            hostSelector.set(hashArgs);
            setTriggersReqParams(hashArgs)
        });
        hostSelector.done(function(selected) {
            Util.hash(selected);
        });

        filter.init(function(filterArgs) {
            Util.hash(filterArgs);
        });
        filter.set(hashArgs);
    };
    var update = function(hashArgs) {
        filter.set(hashArgs);
        hostSelector.set(hashArgs);
        setTriggersReqParams(hashArgs); 
    };
    
    function setTriggersReqParams(args) {
        var reqParams = {
            //filter: {
            //    'value': 1
            //},
            output: 'extend',
            only_true: true,
            skipDependent: true,
            //active: true,
            monitored: true,
            //search: {description: 'ping'}
            selectLastEvent: true,
            selectHosts: ['host']
        };
        var map = {
            triggerStatus: function(v) {
                if (v[0] == 'Problem') {
                    reqParams.filter = {value: 1};
                }
                if (v[0] == 'Any') {
                    delete reqParams.only_true;
                }
            },
            acknowledgeStatus: function(v) {
                var map = {
                    Acknowledged: 'withAcknowledgedEvents',
                    Unacknowledged: 'withUnacknowledgedEvents',
                    LastUnacknowledged: 'withLastEventUnacknowledged'
                };
                reqParams[map[v[0]]] = true;
            },
            events: function(v) {
            },
            minSeverity: function(v) {
                var severity = {
                    'Not classified': 0,
                    'Information': 1,
                    'Warning': 2,
                    'Average': 3,
                    'High': 4,
                    'Disaster': 5
                };
                reqParams.min_severity = severity[v[0]];
            },
            lastChangeSince: function(v) {
                var timestamp = new Date(v[0]).getTime() / 1000;
                reqParams.lastChangeSince = timestamp;
            },
            lastChangeTill: function(v) {
                var timestamp = new Date(v[0]).getTime() / 1000;
                reqParams.lastChangeTill = timestamp;
            },
            byName: function(v) {
                reqParams.search = {description: v[0]};
            },
            showDetails: function(v) {
                reqParams.expandExpression = !!v[0];
            },
            maintenance: function(v) {
                reqParams.maintenance = !!v[0];
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
            }
        }
        $.each(args, function(k, v) {
            map[k] && map[k](v);
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
                age: function(unixtime) {
                    var d = moment(unixtime, 'X');
                    return d.fromNow('lll')
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
                severity: function(priority) {
                    return Zapi.map.trigger.priority[priority]
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
                }
            }
        };
        var columns = [{
                field: 'priority',
                title: 'Severity',
                sortable: true,
                cellStyle: map.html.severity,
                formatter: map.data.severity
            }, {
                field: 'value',
                title: 'Status',
                sortable: true,
                formatter: map.data.status,
                cellStyle: map.html.status
            }, {
                field: 'error',
                title: 'Info',
                //formatter: map.data.description
            }, {
                field: 'lastchange',
                title: 'Last change',
                sortable: true,
                formatter: map.data.clock
            }, {
                field: 'lastchange',
                title: 'Age',
                formatter: map.data.age
            }, {
                field: 'acknowledged',
                title: 'Acknowledged',
                //sortable: true,
                //formatter: map.data.duration
            }, {
                field: 'hosts',
                title: 'host',
                sortable: true,
                formatter: map.data.host
                //valign: 'middle',
                //formatter: map.data.ack,
                //events: {
                //    'click button': function (e, value, row, index) {
                //        console.log($(this), value, row, index);
                //    }
                //}
            }, {
                field: 'description',
                title: 'Name'
            }, {
                field: 'triggerid',
                title: 'Description'
        }];
        var triggerGet = Zapi('trigger.get', reqParams)
        triggerGet.done(function(zapiResponse) {
            console.log(zapiResponse.result)
            $('#triggers')
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
