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
                sortfield: 'clock',
                limit: 1
            });
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
                        var host = hosts[0]
                        return (
                            '<a href="#!Inventory/Host&hostid=' + host.hostid + '">' +
                                host.name +
                            '</a> ' +
                            (host.error ? (
                                '<span class="text-danger expanded-info">' +
                                    '<span class="glyphicon glyphicon-exclamation-sign"></span>' +
                                    '<div class="expanded-info-content-left">' +
                                        '<div class="alert alert-sm alert-danger">' +
                                            host.error +
                                        '</div>' +
                                    '</div>' +
                                '</span>'
                            ) : '')
                        )
                    }
                }, {//Name
                    formatter: function (rObj) {
                        return (
                            '<a href="#!Monitoring/Latest/Data&itemid=' + rObj.itemid + '">' +
                                rObj.name +
                            '</a> ' +
                            (rObj.error ? (
                                '<span class="text-danger expanded-info">' +
                                    '<span class="glyphicon glyphicon-exclamation-sign"></span>' +
                                    '<div class="expanded-info-content-left">' +
                                        '<div class="alert alert-sm alert-danger">' +
                                            rObj.error +
                                        '</div>' +
                                    '</div>' +
                                '</span>'
                            ) : '')
                        )
                    }
                }, {//State
                    formatter: function (value) {
                        return ['Normal', 'Not supported'][value]
                    },
                    cellStyle: function (value) {
                        var status = { 
                            'Normal': 'text-success',
                            'Not supported': 'text-danger'
                        }[value];
                        return {
                            classes: status
                        }
                    }
                }, {//Type
                    formatter: function (rObj) {
                        return zapi.obj['Item']['type'].values[rObj.type]
                    }
                }, {//History/Trends
                    formatter: function (rObj) {
                        return rObj.history + ' / ' + rObj.trends
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
            var dHostEventGet = zapi.req('event.get', {
                eventids: hashArgs.eventid || null,
                objectids: hashArgs.triggerid || null,
                hostids: hashArgs.hostid || null,
                groupids: hashArgs.groupid || null,
                object: 1,
                source: 1,
                time_from: hashArgs.since ? moment(hashArgs.since[0]).format('X') : null,
                time_till: hashArgs.till ? moment(hashArgs.till[0]).format('X') : null,
                selectHosts: 'extend',
                selectRelatedObject: 'extend',
                //selectRelatedObject: [
                //    'name',
                //    'description',
                //    'state',
                //    'status',
                //    'error',
                //    'lastvalue',
                //    'value_type',
                //    'units',
                //    'type',
                //    'history',
                //    'trends'
                //],
                limit: 1000,
                output: [
                    'clock',
                    'value'
                ]
            });
            var dServiceEventGet = zapi.req('event.get', {
                eventids: hashArgs.eventid || null,
                objectids: hashArgs.triggerid || null,
                hostids: hashArgs.hostid || null,
                groupids: hashArgs.groupid || null,
                object: 2,
                source: 1,
                time_from: hashArgs.since ? moment(hashArgs.since[0]).format('X') : null,
                time_till: hashArgs.till ? moment(hashArgs.till[0]).format('X') : null,
                selectHosts: 'extend',
                selectRelatedObject: 'extend',
                //selectRelatedObject: [
                //    'name',
                //    'description',
                //    'state',
                //    'status',
                //    'error',
                //    'lastvalue',
                //    'value_type',
                //    'units',
                //    'type',
                //    'history',
                //    'trends'
                //],
                limit: 1000,
                output: [
                    'clock',
                    'value'
                ]
            });
            $.when(dHostEventGet, dServiceEventGet).done(function (zRespHosts, zRespServices) {
                var hEvents = zRespHosts[0].result;
                var sEvents = zRespServices[0].result;
console.log(hEvents, sEvents)
                //$('#events-trigger')
                //    .bootstrapTable('load', events);
            });

        }
    }


    //Page external methods
    var init = function(hashArgs) {
        filter.init(function () {
            update(hashArgs);
        });
        table.init();
    };
    var update = function(hashArgs) {
        filter.update(hashArgs);
        table.update(hashArgs);
        $('#events-sub-nav a')
            .each(function () {
                var $a = $(this);
                var href = $a.data('href') +
                    (hashArgs.groupid ? '&groupid=' + hashArgs.groupid[0] : '') +
                    (hashArgs.hostid ? '&hostid=' + hashArgs.hostid[0] : '');
                $a.attr('href', href);
            });
    };


    //Page common functions
    
    return {
        init: init,
        update: update
    }
});
