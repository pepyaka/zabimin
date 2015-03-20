define(['Zapi', 'moment', 'Util', 'bootstrap-table', 'bootstrap-select'], function(zapi, moment, util) {
    "use strict";


    //Page global variables
    var page = '#!Monitoring/Overview/Data';


    //Page components
    var filter = {
        init: function(hashArgs) {
            var groupGet = zapi.req('hostgroup.get', {
                real_hosts: true,
                output: ['name'],
                selectHosts: 'count'
            });
            var appGet = zapi.req('application.get', {
                output: ['name'],
                selectItems: ['itemid'],
                inherited: true
            });
            $('.selectpicker')
                .selectpicker();
            groupGet.done(function(zapiResponse) {
                var groups = zapiResponse.result;
                $('#group-list')
                    .append(groups.map(function (g) {
                        return  '<option value="'+g.groupid+'" data-content=\''+g.name+'<span class="badge pull-right">'+g.hosts+'</span>\'>' +
                                    g.name +
                                '</option>'
                    }))
                    .prop('disabled', false)
                    .selectpicker('refresh')
                    .on('change', function (e) {
                        var $opt = $(this);
                        var ha = {};
                        ha[$opt.data('hashArgs')] = $opt.val() || null;
                        util.hash(ha, true);
                    });
            });
            appGet.done(function(zapiResponse) {
                var appsObj = {};
                var apps = [];
                zapiResponse.result.forEach(function(a) {
                    if (appsObj[a.name]) {
                        appsObj[a.name].items += a.items.length;
                    } else {
                        appsObj[a.name] = {
                            name: a.name,
                            items: a.items.length
                        }
                    }
                });
                Object.keys(appsObj).forEach(function(k) {
                    apps.push(appsObj[k]);
                });
                $('#app-list')
                    .append(apps.map(function (a) {
                        return  '<option value="'+a.name+'" data-content=\''+a.name+'<span class="badge pull-right">'+a.items+'</span>\'>' +
                                    a.name +
                                '</option>'
                    }))
                    .prop('disabled', false)
                    .selectpicker('refresh')
                    .on('change', function (e) {
                        var $opt = $(this);
                        var ha = {};
                        ha[$opt.data('hashArgs')] = $opt.val() || null;
                        util.hash(ha, true);
                    });
            });
            $.when(groupGet, appGet)
                .done(function () {
                    filter.update(hashArgs);
                });
        },
        update: function(hashArgs) {
            $.each(hashArgs, function(k, v) {
                $('[data-hash-args="'+k+'"]')
                    .selectpicker('val', v.length > 1 ? v : v[0])
            });
            if (hashArgs.groupid) {
                $('#overview-hosts')
                    .prop('href', '#!Monitoring/Overview&groupid=' + hashArgs.groupid);
                $('#overview-triggers')
                    .prop('href', '#!Monitoring/Overview/Triggers&groupid=' + hashArgs.groupid);
            } else {
                $('#group-list')
                    .val('')
                    .trigger('change');
                $('#overview-hosts')
                    .prop('href', '#!Monitoring/Overview');
                $('#overview-triggers')
                    .prop('href', '#!Monitoring/Overview/Triggers');
            }
        }
    };
    var overviewTable = {
        init: function (hashArgs) {
            $('#overview-table table')
                .css('opacity', .3)
            overviewTable.update(hashArgs);
        },
        update: function (hashArgs) {
            var itemGet = zapi.req('item.get', {
                groupids: hashArgs.groupid || 0,
                application: hashArgs.application && hashArgs.application[0],
                output: [
                    'name',
                    'units',
                    'lastvalue',
                    'key_'
                ],
                selectHosts: ['name']
            })
            $('#overview-table table')
                .fadeTo('fast', .3)
            itemGet.done(function(zapiResponse) {
                var items = zapiResponse.result;
                var hostsObj = {};
                var colsObj = {};
                var columns = [];
                items.forEach(function(i) {
                    if (hostsObj[i.hosts[0].name]) {
                        hostsObj[i.hosts[0].name].push(i);
                    } else {
                        hostsObj[i.hosts[0].name] = [i];
                    }
                    if (colsObj[i.key_]) {
                        colsObj[i.key_].push(i);
                    } else {
                        colsObj[i.key_] = [i];
                    }
                });
                var columns = Object.keys(colsObj).map(function(k) {
                    return {
                        field: k,
                        title: colsObj[k][0].name
                    }
                });
                var hosts = Object.keys(hostsObj).map(function(k) {
                    var host = {
                        name: k
                    };
                    hostsObj[k].forEach(function(i) {
                        var v = util.showUnit(i.lastvalue, i.units);
                        host[i.key_] = v[0] + ' ' + v[1] + v[2];
                    });
                    return host
                });
                $('#overview-table table')
                    .bootstrapTable('destroy')
                    .bootstrapTable({
                        search: true,
                        clickToSelect: true,
                        showToggle: true,
                        showColumns: true,
                        showPaginationSwitch: true,
                        pagination: true,
                        pageSize: 20,
                        pageList: [10, 20, 50, 100],
                        columns: [{
                            field: 'name',
                            title: 'Host',
                            sortable: true,
                            class: 'text-nowrap',
                        }].concat(columns),
                        data: hosts
                    })
                    .fadeTo('fast', 1)
                });
        }
    };


    //Page external methods
    var init = function(hashArgs) {
        filter.init(hashArgs)
        overviewTable.init(hashArgs);

    };
    var update = function(hashArgs) {
        filter.update(hashArgs);
        overviewTable.update(hashArgs);
    };


    return {
        init: init,
        update: update
    }
});
