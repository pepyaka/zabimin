// Monitoring/Triggers page
define(['Page','Zapi', 'Util', 'Page/nav', 'moment', 'datatables.bootstrap'], function(Page, Zapi, Util, nav, moment) {
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
            Util.setHash(selected);
        });

        filter.init(function(filterArgs) {
            Util.setHash(filterArgs);
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
            only_true: true,
            skipDependent: true,
            //active: true,
            monitored: true,
            //search: {description: 'ping'}
            selectLastEvent: true
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
        var thead = [];
        var tbody = [];
        var dataMap = {
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
        var triggerGet = Zapi('trigger.get', reqParams)
        triggerGet.done(function(zapiResponse) {
            $('#triggers')
            .DataTable({
                data: zapiResponse.result,
                columns: [
                    {
                        title: 'Severity', data: 'priority'
                    }, {
                        title: 'Status',
                        data: 'value'
                    }, { 
                        title: 'Info',
                        data: 'url'
                    }, { title: 'Last change', data: 'lastchange' },
                    { title: 'Age', data: 'lastchange' },
                    { 
                        title: 'Acknowledged',
                        data: 'lastEvent.acknowledged',
                        "render": function ( data, type, full, meta ) {
                            return 'd:' + data + ' t:' +type +' f:'+full+' m:'+meta;
                    } },
                    { title: 'Host', data: 'hosts[0].host' },
                    { title: 'Name', data: 'description' },
                    { title: 'Description', data: 'comments' }
                ]
            })
            $('#triggers')
            .fadeTo('fast', 1)
        });
        //$('#triggers')
        //    .fadeTo('fast', 0.2)
        //triggerGet.done(function(zapiResponse) {
        //    $.each(zapiResponse.result, function(i, trigger) {
        //        var tr = [];
        //        var rowData = {};
        //        $.each(trigger, function(k, v) {
        //            if (dataMap[k]) {
        //                dataMap[k](rowData, v)
        //            } else {
        //                rowData[k] = v
        //            }
        //        })
        //        $.each(thead, function(i, th) {
        //            tr.push('<td>' + rowData[th] + '</td>')
        //        })
        //        tbody.push('<tr class="'+rowData.priority+'">'+tr.join('')+'</tr>')
        //    })
        //    $('#triggers tbody')
        //        .empty()
        //        .append(tbody.join(''))
        //    $('#triggers')
        //        .fadeTo('fast', 1)
        //});
    }
    
    return {
        init: init,
        update: update
    }
});
