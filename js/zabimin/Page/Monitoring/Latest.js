// Monitoring/Triggers page
define(['Zapi', 'Util', 'moment', 'bootstrap-table', 'select2'], function(zapi, util, moment) {
    "use strict";

    var page = '#!Monitoring/Latest';

    var filter = {
        init: function(hosts, groups, apps) {
            $('#group-list')
                .select2({
                    data: groups.map(function(g) {
                        return {
                            id: g.groupid,
                            text: g.name
                        }
                    }),
                    placeholder: groups.length + ' host groups'
                })
                .prop('disabled', false)
            $('#host-list')
                .select2({
                    data: hosts.map(function(h) {
                        return {
                            id: h.hostid,
                            text: h.name
                        }
                    }),
                    placeholder: hosts.length + ' hosts'
                })
                .prop('disabled', false)
            $('#apps-list')
                .select2({
                    data: apps.map(function(a) {
                        return {
                            id: a.name,
                            text: a.name
                        }
                    }),
                    placeholder: apps.length + ' applications'
                })
                .prop('disabled', false)
            $('#filter-reset')
                .on('click', function() {
                    util.hash(null)
                });
        },
        update: function(hash) {
            // detach event listener to avoid multievents on change
            $('#filter')
                .off('change.filter');
            // set selectors to hash values
            $('[data-hash="groupid"]')
                .val(hash.groupid)
                .trigger('change')
            $('[data-hash="hostid"]')
                .val(hash.hostid)
                .trigger('change')
            $('[data-hash="application"]')
                .val(hash.application)
                .trigger('change')
            $('[data-hash="name"]')
                .val(hash.name)
            $('[data-hash="errors"]')
                .prop('checked', hash.errors)
            $('[data-hash="details"]')
                .prop('checked', hash.details)
            //reattach event handler
            $('#filter')
                .on('change.filter', '[data-hash]', function(e) {
                    var t = $(e.target);
                    var h = {};
                    if (t.is('input[type=checkbox]')) {
                        h[t.data('hash')] = t.prop('checked') || null;
                    } else {
                        h[t.data('hash')] = t.val();
                    }
                    util.hash(h);
                });
        }
    };
    var itemTable = {
        itemidList: [],
        init: function() {
            var itemidList = this.itemidList;
            var columns = [{
                    checkbox: true
                }, {
                    field: 'hosts',
                    title: 'Host',
                    sortable: true,
                    formatter: function(hosts) {
                        return hosts[0].name
                    },
                    sorter: function(a, b) {
                        return a > b ? -1 : 1
                    }
                }, {
                    field: 'applications',
                    title: 'Applications',
                    sortable: true,
                    formatter: function(apps) {
                        return apps.map(function(a) {
                            return a.name
                        }).join(', ')
                    }
                }, {
                    field: 'name',
                    title: 'Item name',
                    sortable: true,
                    formatter: function(name, i) {
                        var link = '#!Monitoring/Latest/Data&itemid=' + i.itemid;
                        var desc = i.description || name;
                        return '<a href="'+link+'" class="hint--top hint--rounded" data-hint="'+desc+'">'+name+'</a>'
                    }
                }, {
                    field: 'delay',
                    title: 'Interval',
                    visible: false,
                }, {
                    field: 'history',
                    title: 'History',
                    visible: false,
                }, {
                    field: 'trends',
                    title: 'Trends',
                    visible: false,
                }, {
                    field: 'type',
                    title: 'Type',
                    sortable: true,
                    formatter: function(type) {
                        return zapi.map('Item', 'type', type).value
                    }
                }, {
                    field: 'lastclock',
                    title: 'Last check',
                    sortable: true,
                    searchable: false,
                    formatter: function(lastclock) {
                        var v = '-';
                        if (lastclock != 0) {
                            v = moment(lastclock, 'X').format('lll');
                        }
                        return v
                    }
                }, {
                    field: 'lastvalue',
                    title: 'Last value',
                    searchable: false,
                    formatter: function(lv, i) {
                        var v = util.showUnit(lv, i.units);
                        v = v[0] + ' ' + v[1] + v[2]
                        if (lv.length > 16) {
                            v = '<span class="hint--left hint--rounded" data-hint="'+lv+'">'+lv.slice(0,16)+'...</span>'
                        }
                        return v
                    }
                }, {
                    field: 'prevvalue',
                    title: 'Value change',
                    visible: false,
                    searchable: false,
                    formatter: function(prevvalue, item) {
                        var v = '-';
                        if (item.value_type == 0 || item.value_type == 3) {
                            v = (item.lastvalue - prevvalue).toLocaleString() + ' '
                        }
                        return v + item.units
                    }
                }, {
                    field: 'error',
                    title: 'Info',
                    align: 'center',
                    formatter: function(error) {
                        return error ? '<span class="label label-danger hint--left hint--rounded hint--error" data-hint="'+error+'">Error</span>' : ''
                    }
            }];
            $('#items')
                .bootstrapTable({
                    search: true,
                    //pagination: true,
                    //showRefresh: true,
                    clickToSelect: true,
                    showToggle: true,
                    showColumns: true,
                    columns: columns
                })
                .css('opacity', 0.3)
                .on('check.bs.table', function (e, row) {
                    itemidList.push(row.itemid);
                    $('#latest-data')
                        .prop('href', '#!Monitoring/Latest/Data&itemid=' + itemidList.join(','))
                        .removeClass('disabled')
                    $('#latest-data-stacked')
                        .prop('href', '#!Monitoring/Latest/Datai&stacked=true&itemid=' + itemidList.join(','))
                        .removeClass('disabled')
                })
                .on('uncheck.bs.table', function (e, row) {
                    var i = itemidList.indexOf(row.itemid)
                    if (i > -1) {
                        itemidList.splice(i, 1);
                    }
                    if (itemidList.length > 0) {
                        $('#latest-data')
                            .prop('href', '#!Monitoring/Latest/Data&itemid=' + itemidList.join(','))
                            .removeClass('disabled')
                        $('#latest-data-stacked')
                            .prop('href', '#!Monitoring/Latest/Datai&stacked=true&itemid=' + itemidList.join(','))
                            .removeClass('disabled')
                    } else {
                        $('#latest-data')
                            .prop('href', '#!Monitoring/Latest/Data')
                            .addClass('disabled')
                        $('#latest-data-stacked')
                            .prop('href', '#!Monitoring/Latest/Datai&stacked=true')
                            .addClass('disabled')
                    }
                })
        },
        update: function(hash) {
            this.itemidList = [];
            $('#latest-data')
                .prop('href', '#!Monitoring/Latest/Data')
                .addClass('disabled')
            $('#latest-data-stacked')
                .prop('href', '#!Monitoring/Latest/Datai&stacked=true')
                .addClass('disabled')
            $('#items')
                .fadeTo('fast', 0.3)
            getItemData(hash, function(items) {
                $('#items')
                    .bootstrapTable('load', items)
                    .fadeTo('fast', 1)
            });
        }
    };

    var init = function(hash) {
        $(".select2").select2();
        getHostData(function(hosts, groups, apps) {
            filter.init(hosts, groups, apps);
            filter.update(hash)
        });
        itemTable.init();
        itemTable.update(hash);
    };
    var update = function(hash) {
        filter.update(hash);
        itemTable.update(hash);
    };
    function getHostData(getHostDataDone) {
        var hostGet = zapi.req('host.get', {
            selectGroups: ['name'],
            selectApplications: 'extend'
        });
        hostGet.done(function(zapiResponse) {
            var appObj = {};
            var hosts = zapiResponse.result;
            var groups = [];
            var apps = [];
            hosts.forEach(function(host) {
                host.groups.forEach(function(g) {
                    if (groups[g.groupid]) {
                        groups[g.groupid].hosts.push(host);
                    } else {
                        groups[g.groupid] = g;
                        groups[g.groupid].hosts = [host];
                    }
                });
                host.applications.forEach(function(a) {
                    if (appObj[a.name]) {
                        appObj[a.name].hosts.push(host);
                        appObj[a.name].appids.push(a.applicationid);
                        
                    } else {
                        appObj[a.name] = {
                            hosts: [host],
                            appids: [a.applicationid]
                        }
                    }
                });
            });
            // Remove sparse
            groups = groups.filter(Boolean);
            groups.sort(function(a, b) {
                return a.name > b.name ? 1 : -1
            });
            for (var app in appObj) {
                apps.push({
                    name: app,
                    hosts: appObj[app].hosts,
                    appids: appObj[app].appids
                })
            }
            apps.sort(function(a, b) {
                return a.name.toLowerCase() > b.name.toLowerCase() ? 1 : -1
            });
            getHostDataDone(hosts, groups, apps);
        });
    };
    function getItemData(hash, getItemDataDone) {
        var itemid = hash.hostid || hash.groupid || hash.host
            || hash.group || hash.application || hash.name
            ? null : 0;
        var itemGet = zapi.req('item.get', {
            itemids: itemid,
            hostids: hash.hostid,
            groupids: hash.groupid,
            host: hash.host && hash.host[0],
            group: hash.group && hash.group[0],
            application: hash.application && hash.application[0],
            search: {
                name: hash.name && hash.name[0]
            },
            filter: {
                status: 0
            },
            output: [
                'name',
                'description',
                'delay',
                'history',
                'trends',
                'type',
                'lastclock',
                'units',
                'lastvalue',
                'value_type',
                'prevvalue',
                'error'
            ],
            //selectGraphs: 'count',
            //with_monitored_items: true,
            //preservekeys: true,
            selectApplications: ['name'],
            selectHosts: ['name'],
            monitored: true,
            limit: 10000
        });
        itemGet.done(function(zapiResponse) {
            getItemDataDone(zapiResponse.result);
        });
    };
    
    return {
        init: init,
        update: update
    }
});
