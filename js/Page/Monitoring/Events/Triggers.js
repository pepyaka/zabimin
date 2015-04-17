define(['Zapi', 'Util', 'Page', 'moment', 'bootstrap-select', 'bootstrap-table', 'bootstrap-slider', 'bootstrap-datetimepicker'], function(zapi, util, page, moment) {
    "use strict";

    //Page global variables

    //Page components
    var filter = {
        groups: [],
        hosts: [],
        init: function (initDone) {
            var groups = this.groups;
            var hosts = this.hosts;
            var hostGet = zapi.req('host.get', {
                output: ['name'],
                selectTriggers: ['description'],
                selectGroups: ['name'],
            });
            var oldestEventGet = zapi.req('event.get', {
                eventids: null,
                otuput: 'clock',
                sortfield: 'clock',
                limit: 1
            });
            $('.selectpicker').selectpicker();
            $('[data-hash-args]')
                .on('change', function () {
                    var hashArgs = {};
                    var arg = $(this).data('hashArgs');
                    var val = $(this).val() || null;
                    hashArgs[arg] = val;
                    if (arg === 'groupid') {
                        hashArgs.hostid = null;
                        hashArgs.triggerid = null;
                    }
                    if (arg === 'hostid') {
                        hashArgs.triggerid = null;
                    }
                    util.hash(hashArgs, true);
                });
            $('#filter-reset')
                .on('click', function(e) {
                    util.hash(null, true);
                });
            page.dateTimeRangePicker.init(function (since, till) {
                util.hash({
                    since: since ? since.format('YYYY-MM-DDTHH:mm') : null,
                    till: till ? till.format('YYYY-MM-DDTHH:mm') : null
                }, true);
            });
            oldestEventGet.done(function (zapiResponse) {
                var e = zapiResponse.result;
                page.dateTimeRangePicker.min(moment(e[0].clock, 'X'));
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
                groups.sort(function (a, b) {
                    return a.name > b.name ? 1 : -1;
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
            var hostList = ['<option value="">Nothing selected</option>'];
            var triggerList = ['<option value="">Nothing selected</option>'];
            var selGroup = this.groups.filter(function (g) {
                return g.groupid === (hashArgs.groupid && hashArgs.groupid[0])
            })[0];
            var selGroupHosts = selGroup ? selGroup.hosts : this.hosts;
            var selHost = selGroupHosts.filter(function (h) {
                return h.hostid === (hashArgs.hostid && hashArgs.hostid[0])
            })[0];
            var dtrpSince = page.dateTimeRangePicker.min();
            var dtrpTill = page.dateTimeRangePicker.max();
            selGroupHosts.forEach(function (h) {
                hostList.push(
                    '<option value="' + h.hostid + '">' +
                        h.name +
                    '</otion>'
                );
            })
            if (selHost && selHost.triggers) {
                selHost.triggers.forEach(function (t) {
                    triggerList.push(
                        '<option value="' + t.triggerid + '">' +
                            t.description +
                        '</otion>'
                    )
                });
            }
            $('#group-select')
                .val(hashArgs.groupid && hashArgs.groupid[0])
                .selectpicker('refresh');
            $('#host-select')
                .html(hostList)
                .val(hashArgs.hostid ? hashArgs.hostid[0] : '')
                .prop('disabled', false)
                .selectpicker('refresh');
            $('#trigger-select')
                .html(triggerList)
                .val(hashArgs.triggerid ? hashArgs.triggerid[0] : '')
                .prop('disabled', false)
                .selectpicker('refresh');
            // DateTimeRangePicker 
            if (hashArgs.since) {
                dtrpSince = moment(hashArgs.since[0]);
            }
            if (hashArgs.till) {
                dtrpTill = moment(hashArgs.till[0]);
            }
            page.dateTimeRangePicker.since(dtrpSince);
            page.dateTimeRangePicker.till(dtrpTill);
        }
    };
    var table = {
        init: function () {
            var columns = [{//Time
                    formatter: function (clock, e) {
                        return (
                            '<a href="#!Monitoring/Event&eventid=' + e.eventid + '">' +
                                util.showUnit(clock, 'unixtime')[0] +
                            '</a>'
                        )
                    }
                }, {//Host
                    formatter: function (hosts) {
                        if (hosts[0]) {
                            return (
                                '<a href="#!Inventory/Host&hostid=' + hosts[0].hostid + '">' +
                                    hosts[0].name +
                                '</a>'
                            )
                        }
                    }
                }, {//Description
                    formatter: function (rObj) {
                        return rObj.description
                    }
                }, {//Status
                    formatter: function (value) {
                        return zapi.obj['Trigger']['value'].values[value]
                    },
                    cellStyle: function (value) {
                        var status = { 
                            'OK': 'text-success',
                            'Problem': 'text-danger'
                        }[value];
                        return {
                            classes: status
                        }
                    }
                }, {//Severity
                    formatter: function (rObj) {
                        return zapi.obj['Trigger']['priority'].values[rObj.priority]
                    },
                    cellStyle: function (val) {
                        var severity = { 
                            'Not classified': '',
                            'Information': 'bg-info',
                            'Warning': 'bg-warning',
                            'Average': 'text-danger bg-warning',
                            'High': 'bg-danger',
                            'Disaster': 'text-danger bg-danger'
                        }[val];
                        return {
                            classes: severity
                        }
                    }
                }, {//Ack
                    formatter: function (ack, e) {
                            var bClass = 'class="btn btn-xs btn-danger"';
                            var btnText = 'No';
                            var badge = '';
                            if (ack.length) {
                                bClass = 'class="btn btn-xs btn-success"';
                                btnText = 'Yes';
                                badge = ' <span class="badge">' + ack.length + '</span>';
                            }
                            return  (
                                '<button type="button"' + bClass +
                                        ' data-toggle="modal" data-target="#modal-ack-editor"' +
                                        ' data-eventid="' + e.eventid + '">' +
                                    btnText +
                                    badge +
                                '</button>'
                            )
                    }
                }, {//Actions
                    formatter: function (alerts) {
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
            }];
            $('#events-trigger')
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
        update: function (hashArgs) {
            var eventGet = zapi.req('event.get', {
                eventids: hashArgs.eventid || null,
                objectids: hashArgs.triggerid || null,
                hostids: hashArgs.hostid || null,
                groupids: hashArgs.groupid || null,
                object: 0,
                source: 0,
                time_from: hashArgs.since ? moment(hashArgs.since[0]).format('X') : null,
                time_till: hashArgs.till ? moment(hashArgs.till[0]).format('X') : null,
                selectHosts: ['name'],
                selectRelatedObject: 'extend',
                select_alerts: 'extend',
                select_acknowledges: ['clock', 'message', 'alias'],
                //nopermissions: true,
                sortfield: ['clock'],
                sortorder: 'DESC',
                limit: 1000,
                output: 'extend'
                //output: [
                //    'acknowledged',
                //    'clock',
                //    'value_changed'
                //]
            });
            eventGet.done(function (zapiResponse) {
                var events = zapiResponse.result;
                $('#events-trigger')
                    .bootstrapTable('load', events);
                modal.update(events);
            });

        }
    }
    var modal = {
        init: function () {
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
                });
        },
        update: function (zabEvents) {
            $('#modal-ack-editor')//Update acknoledge modal window
                .off('show.bs.modal')
                .on('show.bs.modal', function (e) {
                    var button = $(e.relatedTarget);
                    var modal = $(this);
                    var eventid = button.data('eventid');
                    var zabEvent = zabEvents.filter(function (e) {
                        return Number(e.eventid) === eventid;
                    })[0];
                    modal.find('.modal-title strong')
                        .text(zabEvent.relatedObject.description);
                    modal.find('.info-messages')
                        .html(
                            zabEvent.acknowledges.sort(function (a, b) {
                                return a.clock > b.clock ? 1 : -1;
                            })
                            .map(function (ack) {
                                return (
                                    ack.alias +
                                    '<span class="pull-right">' +
                                        moment(ack.clock, 'X').format('lll') +
                                    '</span>' +
                                    '<div class="alert alert-info" role="alert">' +
                                        ack.message +
                                    '</div>'
                                );
                            })
                        );
                    modal.find('textarea')
                        .data('eventid', eventid);
                });
        }
    };
    var nav = {
        update:  function (hashArgs) {
            $('#events-sub-nav a')
                .each(function () {
                    var $a = $(this);
                    var href = $a.data('href') +
                        (hashArgs.groupid ? '&groupid=' + hashArgs.groupid[0] : '') +
                        (hashArgs.hostid ? '&hostid=' + hashArgs.hostid[0] : '');
                    $a.attr('href', href);
                });
        }
    }


    //Page external methods
    var init = function(hashArgs) {
        filter.init(function () {
            update(hashArgs);
        });
        table.init();
        modal.init();
    };
    var update = function(hashArgs) {
        filter.update(hashArgs);
        table.update(hashArgs);
        nav.update(hashArgs);
    };


    //Page common functions
    
    return {
        init: init,
        update: update
    }
});
