// Monitoring/Triggers page
define(['Zapi', 'Util', 'moment', 'bootstrap-select', 'bootstrap-table'], function(zapi, util, moment) {
    "use strict";

    //Page global variables
    var data = {};// work data

    //Page components
    var filter = {
        hosts: [],
        groups: [],
        init: function (initDone) {
            var hosts = this.hosts;
            var groups = this.groups;
            var hostGet = zapi.req('host.get', {
                output: ['name'],
                selectGroups: ['name'],
                selectApplications: ['name', 'applicationid']
            });
            $('.selectpicker')
                .selectpicker();
            $('[data-hash-args]')
                .on('change', function () {
                    var hashArgs = {};
                    var arg = $(this).data('hashArgs');
                    var val = $(this).val() || null;
                    hashArgs[arg] = val;
                    if (arg === 'groupid') {
                        hashArgs.hostid = null;
                    }
                    util.hash(hashArgs, true);
                });

            $('#filter-by-name')
                .on('click', 'button', function() {
                    var searchPattern = $('#filter-by-name input').val()
                    searchPattern = searchPattern.replace('=', ' ').replace('&', ' ')
                    util.hash({
                        search: searchPattern
                    }, true);
                });
            $('#filterMaintenance')
                .on('change', function() {
                    changeHashArgs({
                        maintenance: $(this).is(':checked') || null
                    });
                });
            $('#filter-reset')
                .on('click', function(e) {
                    util.hash(null, true);
                });
            hostGet.done(function(zapiResponse) {
                var groupList = [];
                Array.prototype.push.apply(hosts, zapiResponse.result);
                hosts.forEach(function(host) {
                    host.groups.forEach(function(group) {
                        if (groups[group.groupid]) {
                            groups[group.groupid].hosts.push(host)
                        } else {
                            groups[group.groupid] = group
                            groups[group.groupid].hosts = [host]
                        }
                    });
                });
                groups.forEach(function (g) {
                    groupList.push(
                        '<option value="' + g.groupid + '">' +
                            g.name +
                        '</otion>'
                    );
                });
                $('#group-select')
                    .append(groupList)
                    .prop('disabled', false)
                initDone();
            });
        },
        update: function (hashArgs) {
            var group = this.groups.filter(function (g) {
                return g.groupid === (hashArgs.groupid && hashArgs.groupid[0])
            })[0];
            var hosts = group ? group.hosts : this.hosts;
            var host = hosts.filter(function (h) {
                return h.hostid === (hashArgs.hostid && hashArgs.hostid[0])
            })[0];
            var hostList = hosts.map(function (h) {
                return (
                    '<option value="' + h.hostid + '">' +
                        h.name +
                    '</otion>'
                )
            })
            var appObj = {};
            var appList = [];
            var appHosts = host ? [host] : hosts;
            appHosts.forEach(function (h) {
                h.applications.forEach(function (a) {
                    if (appObj[a.name]) {
                        appObj[a.name].push(a)
                    } else {
                        appObj[a.name] = [a];
                    }
                });
            });
            Object.keys(appObj).forEach(function (aName) {
                appList.push(
                    '<option value="' + aName + '">' +
                        aName +
                    '</option>'
                );
            });
            hostList.unshift('<option value="">Nothing selected</option>');
            appList.unshift('<option value="">Nothing selected</option>');
            $('#group-select')
                .val(hashArgs.groupid && hashArgs.groupid[0])
                .selectpicker('refresh');
            $('#host-select')
                .html(hostList)
                .val(hashArgs.hostid ? hashArgs.hostid[0] : '')
                .prop('disabled', false)
                .selectpicker('refresh');
            $('#app-select')
                .html(appList)
                .val(hashArgs.app ? hashArgs.app[0] : '')
                .prop('disabled', false)
                .selectpicker('refresh');
            return appObj
        }
    };
    var table = {
        init: function () {
            var columns = [{
                    field: 'priority',
                    title: 'Severity',
                    sortable: true,
                    cellStyle: function(value) {
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
                    },
                    formatter: function(priority) {
                        return zapi.map('Trigger', 'priority', priority).value
                    }
                }, {
                    field: 'value',
                    title: 'Status',
                    sortable: true,
                    formatter: function (value) {
                        return zapi.map('Trigger', 'value', value).value
                    },
                    cellStyle: function(status) {
                        return {
                            classes: {
                                'OK': 'text-success',
                                'Problem': 'text-danger'
                            }[status]
                        }
                    }
                }, {
                    field: 'lastchange',
                    title: 'Last change',
                    sortable: true,
                    formatter: function(s, trigger) {
                        return (
                            '<a href="#!Monitoring/Event&eventid='+trigger.lastEvent.eventid+'">' +
                                 moment(s, 'X').format('lll') +
                            '</a>'
                        )
                    }
                }, {
                    field: 'lastchange',
                    title: 'Age',
                    formatter: function(unixtime) {
                        var d = moment(unixtime, 'X');
                        return d.fromNow('lll')
                    }
                }, {
                    field: 'lastEvent',
                    title: 'Acknowledged',
                    formatter: function(e) {
                        var btnClass = 'btn-danger';
                        var btnText = 'No';
                        if (e.acknowledged === '1') {
                            btnClass = 'btn-success';
                            btnText = 'Yes';
                        }
                        return (
                            '<button type="button" ' +
                                    'class="btn btn-xs ' + btnClass+' "' +
                                    'data-toggle="modal" ' +
                                    'data-target="#modal-ack-editor" ' +
                                    'data-eventid="'+e.eventid+'">' +
                                        btnText +
                            '</button>'
                        )
                    }
                }, {
                    field: 'events',
                    title: 'Events',
                    formatter: function (events, trigger) {
                        var href = '#!Monitoring/Events/Triggers' +
                            '&hostid=' + trigger.hosts[0].hostid +
                            '&triggerid=' + trigger.triggerid;
                        return '<a href="' + href + '">' + events + '</a>'
                    }
                }, {
                    field: 'hosts',
                    title: 'Host',
                    sortable: true,
                    formatter: function(hosts) {
                        return hosts.map(function (h) {
                            return (
                                '<a href="#!Inventory/Host&hostid='+h.hostid+'">' +
                                    h.name +
                                '</a>'
                            )
                        }).join(', ')
                    },
                }, {
                    field: 'description',
                    title: 'Name',
                }, {
                    field: 'error',
                    title: 'Info',
                    align: 'center',
                    formatter: function (err, trigger) {
                        var comment = trigger.comments ? (
                            '<span class="text-info expanded-info">' +
                                '<span class="glyphicon glyphicon-info-sign"></span>' +
                                '<span class="expanded-info-content-left">' +
                                    '<div class="alert alert-sm alert-info" style="white-space:nowrap;">' +
                                        trigger.comments +
                                    '</div>' +
                                '</span>' +
                            '</span>'
                        ) : '';
                        var error = trigger.error ? (
                                '<span class="text-danger expanded-info">' +
                                    '<span class="glyphicon glyphicon-exclamation-sign"></span>' +
                                    '<h4 class="expanded-info-content-left">' +
                                        '<span class="label label-danger">' +
                                            trigger.error +
                                        '</span>' +
                                    '</h4>' +
                                '</span>'
                        ) : '';
                        return comment + ' ' + error
                    },
            }];
            $('#triggers')
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
                })
        },
        update: function (hashArgs, apps) {
            var triggerGet = zapi.req('trigger.get', {
                groupids: hashArgs.groupid,
                hostids: hashArgs.hostid,
                host: hashArgs.host && hashArgs.host[0],
                group: hashArgs.group && hashArgs.group[0],
                applicationids: hashArgs.app ?
                    apps[hashArgs.app[0]].map(function (a) {
                        return a.applicationid
                    }) : null,
                filter: hashArgs.trigger && hashArgs.trigger[0] === 'Problem' ? { value: 1 } : null,
                min_severity: hashArgs.priority ? hashArgs.priority[0] : null,
                only_true: hashArgs.trigger && hashArgs.trigger[0] === 'Any' ? null : true,
                withUnacknowledgedEvents: hashArgs.ack && hashArgs.ack[0] === 'unacknowledged' || null,
                withAcknowledgedEvents: hashArgs.ack && hashArgs.ack[0] === 'acknowledged' || null,
                withLastEventUnacknowledged: hashArgs.ack && hashArgs.ack[0] === 'lastUnacknowledged' || null,
                skipDependent: true,
                //active: true,
                monitored: true,
                search: hashArgs.search ? { description: hashArgs.search[0] } : null,
                output: 'extend',
                preservekeys: true,
                selectLastEvent: 'extend',
                selectHosts: ['name']
            });
            triggerGet.done(function(zapiResponse) {
                var triggersObj = zapiResponse.result;
console.log(triggersObj);
                var eventGet = zapi.req('event.get', {
                    source: 0,
                    object: 0,
                    eventids: null,
                    objectids: Object.keys(triggersObj),
                    countOutput: true,
                    groupCount: true,
                    //filter: {
                    //    acknowledged: 0,
                    //    value: 1
                    //}
                });
                eventGet.done(function(zapiResponse) {
                    var events = zapiResponse.result;
console.log(events);
                    var triggers = events.map(function (e) {
                        var t = triggersObj[e.objectid];
                        t.events = e.rowscount;
                        return t
                    });
                    triggers.sort(function (a, b) {
                        return b.lastchange - a.lastchange
                    })
                    $('#triggers')
                        .bootstrapTable('load', triggers);
                });

            });
        }
    }


    //Page external methods
    var init = function(hashArgs) {
        filter.init(function () {
            var apps = filter.update(hashArgs);
            table.update(hashArgs, apps);
        });
        table.init();
    };
    var update = function(hashArgs) {
        var apps = filter.update(hashArgs);
        table.update(hashArgs, apps);
    };


    //Page common functions
    
    return {
        init: init,
        update: update
    }
});
