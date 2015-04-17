define(['Zapi', 'moment', 'Util', 'Page', 'bootstrap-table', 'bootstrap-select'], function(zapi, moment, util, page) {
    "use strict";

    //Page global variables
    var pageHash = '#!Monitoring/Dashboard';
    var timeoutId;

    //Page components
    var popularGraphs = {
        init: function() {
            var lines = 5; 
            var graphRate = util.visit.show('Monitoring/Graphs', 'graphid').slice(0, lines);
            if (graphRate.length > 0) {
                var graphGet = zapi.req('graph.get', {
                    output: ['name'],
                    graphids: graphRate.map(function(gr) {
                        return gr[0]
                    }),
                    selectHosts: ['name']
                });
                graphGet.done(function(g) {
                    var graphs = g.result;
                    var graphList = graphs.map(function(g) {
                        var hosts = g.hosts.length > 1 ? g.hosts.length + ' Hosts' : g.hosts[0].name;
                        return '<a href="#!Monitoring/Graphs&graphid='+g.graphid+'"class="list-group-item">'+hosts+': '+g.name+'</a>'
                    });
                    $('#popular-graphs .list-group')
                        .html(graphList)
                });
            }
        }
    };
    var lastIssues = {
        init: function() {
            $('#last-issues table')
                .bootstrapTable({
                    columns: [{
                        field: 'hosts',
                        title: 'Host',
                        sortable: true,
                        formatter: function(hosts) {
                            return '<a href="#!Inventory/Host&hostid='+hosts[0].hostid+'">'+hosts[0].host+'</a>'
                        }
                    }, {
                        field: 'description',
                        title: 'Issue',
                        sortable: true,
                        cellStyle: function(value, row) {
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
                    }, {
                        field: 'lastchange',
                        title: 'Last change',
                        sortable: true,
                        formatter: function(unixtime) {
                            var d = moment(unixtime, 'X');
                            return d.format('lll')
                        }
                    }, {
                        field: 'lastchange',
                        title: 'Age',
                        sortable: true,
                        formatter: function(unixtime) {
                            var d = moment(unixtime, 'X');
                            return d.fromNow()
                        }
                    }, {
                        field: 'error',
                        title: 'Info',
                        align: 'center',
                        valign: 'middle',
                        formatter: function(error) {
                            if (error) {
                                return  '<div class="hint--left hint--rounded hint--error" data-hint="'+error+'">' +
                                            '<span class="glyphicon glyphicon-exclamation-sign"></span>' +
                                        '</div>'
                            }
                        }
                    }, {
                        field: 'lastEvent',
                        title: 'Ack',
                        formatter: function(e) {
                            var btnClass = 'btn-danger';
                            var btnText = 'No';
                            var badge = '';
                            if (e.acknowledged === '1') {
                                btnClass = 'btn-success';
                                btnText = 'Yes';
                                badge = e.acknowledges.length;
                            }
                            return  '<button type="button" ' +
                                            'class="btn btn-xs ' + btnClass+' "' +
                                            'data-toggle="modal" ' +
                                            'data-target="#modal-ack-editor" ' +
                                            'data-eventid="'+e.eventid+'">' +
                                                btnText +
                                                ' <span class="badge">' +
                                                    badge +
                                                '</span>' +
                                            '</button>'
                        }
                    }, {
                        field: 'lastEvent',
                        title: 'Actions',
                        formatter: function (e) {
                            var alerts = e.alerts;
                            var actions;
                            var alrts = [
                                [[],[],[]],
                                [[],[]]
                            ];
                            var badges = [
                                ['', 'alert-success', 'alert-danger'],
                                ['progress-bar-success', 'progress-bar-danger']
                            ];
                            if (alerts.length > 0) {
                                alerts.forEach(function (a) {
                                    var medias = a.mediatypes.map(function (m) {
                                        return m.description
                                    }).join(', ');
                                    var msg = (
                                        '<li class="list-group-item">' +
                                            (a.error ? a.error : a.sendto + ' (' + medias + ')') +
                                        '</li>'
                                    );
                                    if (alrts[a.alerttype][a.status].length > 0) {
                                        alrts[a.alerttype][a.status][3]++;
                                        alrts[a.alerttype][a.status][7].push(msg);
                                    } else {
                                        alrts[a.alerttype][a.status] = [
                                            '<span class="expanded-info badge ', badges[a.alerttype][a.status], '">',
                                                1,
                                                '<div class="expanded-info-content-left">',
                                                    '<div class="panel panel-default">',
                                                        '<div class="list-group list-group-sm text-left text-nowrap">',
                                                            [msg],
                                                        '</div>',
                                                    '</div>',
                                                '</div>',
                                            '</span>'
                                        ];
                                    }
                                });
                                actions = alrts.map(function (alertType) {
                                    return alertType.map(function (stts) {
                                        if (stts[7]) {
                                            stts[7] = stts[7].join('');
                                        }
                                        return stts.join('')
                                    }).join(' ')
                                }).join(' ')
                            }
                            return actions

                        }
                    }]
                })
        },
        load: function(triggers, events) {
            var data = triggers.map(function (t) {
                t.lastEvent = events.filter(function (e) {
                    return t.lastEvent.eventid === e.eventid
                })[0];
                return t
            });
            $('#last-issues table')
                .bootstrapTable('load', data)
            //Update acknoledge modal window
            $('#modal-ack-editor')
                .on('show.bs.modal', function (event) {
                    var button = $(event.relatedTarget) // Button that triggered the modal
                    var eventid = button.data('eventid') // Extract info from data-* attributes
                    var modal = $(this)
                    var trigger = data.filter(function (d) {
                        return d.lastEvent.eventid == eventid
                    })[0];
                    modal.find('.modal-title strong')
                        .text(trigger.description);
                    modal.find('.info-messages')
                        .html(trigger.lastEvent.acknowledges
                            .sort(function (a, b) {
                                return a.clock > b.clock ? 1 : -1
                            }).map(function (ack) {
                                return  ack.alias +
                                        '<span class="pull-right">' +
                                            moment(ack.clock, 'X').format('lll') +
                                        '</span>' +
                                        '<div class="alert alert-info" role="alert">' +
                                            ack.message +
                                        '</div>'
                            })
                        );
                    modal.find('textarea')
                        .data('eventid', eventid);
                })
            $('#modal-ack-editor-btn-save')
                .on('click', function (e) {
                    var modal = $('#modal-ack-editor');
                    var textarea = modal.find('textarea');
                    var eventAck = zapi.req('event.acknowledge', {
                        eventids: textarea.data('eventid'),
                        message: textarea.val()
                    });
                    eventAck.done(function () {
                        modal.modal('hide');
                        page.load();
                    });
                })
        }
    };
    var overallStatus = {
        init: function() {
            $('#overall-status table')
                .bootstrapTable({
                    columns: [{
                        field: 'name',
                        title: 'Host group',
                        sortable: true,
                        formatter: function(name) {
                            return '<a href="#!Inventory/Hosts&hostgroup='+name+'">'+name+'</a>'
                        }
                    }, {
                        field: '5',
                        title: 'Disaster',
                        class: 'danger text-danger',
                        sortable: true,
                        formatter: function (v) {
                            return v.hosts + ' (' + v.triggers + ')'
                        }
                    }, {
                        field: '4',
                        title: 'High',
                        class: 'danger',
                        sortable: true,
                        formatter: function (v) {
                            return v.hosts + ' (' + v.triggers + ')'
                        }
                    }, {
                        field: '3',
                        title: 'Average',
                        class: 'warning text-danger',
                        sortable: true,
                        formatter: function (v) {
                            return v.hosts + ' (' + v.triggers + ')'
                        }
                    }, {
                        field: '2',
                        title: 'Warning',
                        class: 'warning',
                        sortable: true,
                        formatter: function (v) {
                            return v.hosts + ' (' + v.triggers + ')'
                        }
                    }, {
                        field: '1',
                        title: 'Info',
                        class: 'info',
                        sortable: true,
                        formatter: function (v) {
                            return v.hosts + ' (' + v.triggers + ')'
                        }
                    }, {
                        field: '0',
                        title: 'Not classified',
                        sortable: true,
                        formatter: function (v) {
                            return v.hosts + ' (' + v.triggers + ')'
                        }
                    }, {
                        field: 'total',
                        title: 'Total',
                        sortable: true,
                        formatter: function (v) {
                            return v.hosts + ' (' + v.triggers + ')'
                        }
                    }]
                })
        },
        load: function(triggers) {
            var groupObj = {};
            triggers.forEach(function (t) {
                t.groups.forEach(function (g) {
                    if (groupObj[g.name]) {
                        if (groupObj[g.name][t.hosts[0].hostid]) {
                            groupObj[g.name][t.hosts[0].hostid].push(t);
                        } else {
                            groupObj[g.name][t.hosts[0].hostid] = [t];
                        }
                    } else {
                        groupObj[g.name] = [];
                        groupObj[g.name][t.hosts[0].hostid] = [t];
                    }
                });
            });
            var data = Object.keys(groupObj).map(function (k) {
                var row = {
                    name: k,
                    0: {
                        hosts: 0,
                        triggers: 0
                    },
                    1: {
                        hosts: 0,
                        triggers: 0
                    },
                    2: {
                        hosts: 0,
                        triggers: 0
                    },
                    3: {
                        hosts: 0,
                        triggers: 0
                    },
                    4: {
                        hosts: 0,
                        triggers: 0
                    },
                    5: {
                        hosts: 0,
                        triggers: 0
                    },
                    total: {
                        hosts: 0,
                        triggers: 0
                    }
                };
                groupObj[k].forEach(function (h) {
                    var hosts = h.filter(Boolean);
                    hosts.forEach(function (t) {
                        row[t.priority].hosts += hosts.length;
                        row[t.priority].triggers += 1;
                        row.total.hosts += hosts.length;
                        row.total.triggers += 1;
                    });
                });
                return row
            });
            $('#overall-status table')
                .bootstrapTable('load', data)
        }
    };
    var discoveryStatus = {
        init: function() {
            $('#discovery-status-table table').bootstrapTable({
                columns: [{
                    field: 'name',
                    title: 'Discovery rule',
                    sortable: true,
                    formatter: function(name, dRule) {
                        var href = '#!Monitoring/Discovery&druleid=' + dRule.druleid;
                        var aClass = 'hint--right hint--rounded';
                        var hint = 'ip range: ' + dRule.iprange
                        return '<a href="'+href+'" class="'+aClass+'" data-hint="'+hint+'">'+name+'</a>'
                    }
                }, {
                    field: 'nextcheck',
                    title: 'Next check',
                    sortable: true,
                    formatter:  function(s) {
                        return moment(s, 'X').format('lll')
                    }
                }, {
                    field: 'dhosts',
                    title: 'Up',
                    sortable: true,
                    formatter:  function(dhosts) {
                        var up = dhosts.filter(function(h) {
                            return h.status === '0'
                        });
                        return up.length
                    }
                }, {
                    field: 'dhosts',
                    title: 'Down',
                    sortable: true,
                    formatter:  function(dhosts) {
                        var up = dhosts.filter(function(h) {
                            return h.status === '1'
                        });
                        return up.length
                    }
                }]
           });
        },
        load: function(dRules) {
            $('#discovery-status-table table')
                .bootstrapTable('load', dRules)
        },
    };
    var webMonitoring = {
        init: function() {
            $('#web-monitoring-table table').bootstrapTable({
                columns: [{
                    field: 'name',
                    title: 'Host group',
                    sortable: true,
                }, {
                    field: 'status',
                    title: 'Ok',
                    sortable: true,
                }, {
                    field: 'status',
                    title: 'Failed',
                    sortable: true,
                }, {
                    field: 'status',
                    title: 'Unknown',
                    sortable: true,
                }]
           });
        },
        update: function(hosts) {
            var hostGet = zapi.req('host.get', {
                output: ['name'],
                selectGroups: ['name'],
                selectInterfaces: ['ip'],
                selectHttpTests: 'extend',
                with_httptests: true,
            });
            var itemGet = zapi.req('item.get', {
                filter: {
                    trends: 90
                },
                //hostids: ['10085']
            });
            itemGet.done(function(i) {
                var items = i.result;
            });
            //$('#web-monitoring-table table')
            //    .bootstrapTable('load', data)
        },
    };
    var zabbixStatus = {
        update: function(items) {
            var enabled = 0;
            var disabled = 0;
            var notsupported = 0;
            items.forEach(function(i) {
                if (i.state === '1') {
                    notsupported++;
                }
                if (i.status == 0) {
                    enabled++;
                } else {
                    disabled++;
                }
            });
            $('#items')
                .html(
                    '<span class="text-success">' +
                        enabled +
                    '</span>' +
                    ' / ' +
                    '<span class="text-danger">' +
                        disabled +
                    '</span>' +
                    ' / ' +
                    '<span class="text-muted">' +
                        notsupported +
                    '</span>'
                )
        }
    };


    //Page global methods
    var init = function(hashArgs) {
        $('.selectpicker').selectpicker();
        $('#api-url').text(zapi.url);
        lastIssues.init();
        overallStatus.init();
        webMonitoring.init();
        update(hashArgs)
        popularGraphs.init();
        discoveryStatus.init();
        $('#refresh')
            .on('click', function () {
                page.load();
            })
        $('#refresh-time')
            .on('change', function () {
                var refresh = $(this).val()
                util.hash({
                    refresh: refresh === '30' ? null : refresh
                }, true);
            })
    };
    var update = function(hashArgs) {
        var refresh = hashArgs.refresh ? hashArgs.refresh[0] : 30;
        var dRuleGet = zapi.req('drule.get', {
            output: 'extend',
            sortfield: 'name',
            selectDHosts: ['status']
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
            selectLastEvent: 'extend',
            selectGroups: ['name'],
            limit: 20
        });
        var itemGet = zapi.req('item.get', {
            //filter: {
            //    status: 1
            //},
            monitored: true,
            output: ['state', 'status'],
        });

        $('#last-update')
            .text(moment().format('D MMM YYYY, HH:mm:ss'))

        //Auto refresh page
        window.clearTimeout(timeoutId);
        $('#refresh-time')
            .selectpicker('val', refresh);
        timeoutId = window.setTimeout(function () {
            if (pageHash === '#!' + util.hash().page) {
                page.load();
            }
        }, refresh * 1000);

        triggerGet.done(function(zapiResponse) {
            var triggers = zapiResponse.result;
            var eventGet = zapi.req('event.get', {
                eventids: triggers.map(function (t) {
                    return t.lastEvent.eventid
                }),
                output: 'extend',
                select_alerts: 'extend',
                select_acknowledges: 'extend',
                sortfield: 'clock'
            });
            eventGet.done(function(zapiResponse) {
                lastIssues.load(triggers, zapiResponse.result);
            });
            overallStatus.load(triggers);
        });
        dRuleGet.done(function(dr) {
            discoveryStatus.load(dr.result);
        });
        itemGet.done(function(i) {
            zabbixStatus.update(i.result);
        });
    };


    //Common functions

    return {
        init: init,
        update: update,
        timeoutId: timeoutId
    }
});
