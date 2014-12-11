// Monitoring/Events
define(['Zapi', 'Util', 'Page/nav', 'moment'], function(Zapi, Util, nav, moment) {
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
            Util.setHash(selected);
        });

        filter.init(function(filterArgs) {
            Util.setHash(filterArgs);
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
        var thead = [];
        var dataMap = {
            clock: function(unixtime) {
                var d = moment(unixtime * 1000);
                return {
                    clock: d.format('lll'),
                    age: d.fromNow()
                }
            },
            hosts: function(hosts, row) {
                var hostNames = [];
                $.each(hosts, function(i, host) {
                    hostNames.push(host.host)
                });
                return {
                    host: hostNames.join(', ')
                }
            },
            source: function(src) {
                return {
                    type: Zapi.map.event.source[src]
                }
            },
            priority: function(v) {
            },
            value: function(v, e) {
                return {
                    value: Zapi.map.event.value[e.source][v]
                }
            },
            relatedObject: function(ro, e) {
                return {
                    description: ro.description,
                    severity: Zapi.map.trigger.priority[ro.priority]
                }
            },
            acknowledged: function(ack) {
                return {
                    acknowledged: Zapi.map.event.acknowledged[ack]
                }
            }
        };
        var htmlMap = {
            value: function(th, row) {
                var color = {
                    'OK': '<td class="success">OK</td>',
                    'Problem': '<td class="danger">Problem</td>'
                }
                return color[row[th]]
            },
            severity: function(th, row) {
                var cl = {
                    'Not classified': '<td>Not classified</td>',
                    'Information': '<td class="info">Information</td>',
                    'Warning': '<td class="warning">Warning</td>',
                    'Average': '<td class="warning text-danger">Average</td>',
                    'High': '<td class="danger">High</td>',
                    'Disaster': '<td class="danger text-danger">Disaster</td>'
                };
                return cl[row[th]]
            }
        };
        var eventGet = Zapi('event.get', reqParams)

        $('#events th').each(function() {
            thead.push(this.abbr)
        })
        eventGet.done(function(zapiResponse) {
            console.log('event.get', reqParams, zapiResponse.result)
            var data = [];
            $.each(zapiResponse.result, function(i, event) {
                var row = {};
                $.each(event, function(e, v) {
                    dataMap[e] ? $.extend(row, dataMap[e](v, event)) : row[e] = v;
                })
                data.push(row);
            });
            createTable(data);
        });
        function createTable(data) {
            var tbody = [];
            $.each(data, function(i, row) {
                var tr = [];
                $.each(thead, function(i, th) {
                    if (htmlMap[th]) {
                        tr.push(htmlMap[th](th, row));
                    } else {
                        tr.push('<td>' + row[th] + '</td>');
                    }
                });
                tbody.push('<tr>'+tr.join('')+'</tr>')
            });
            $('#events tbody')
                .empty()
                .append(tbody.join(''))
        };
    }
    
    return {
        init: init,
        update: update
    }
});
