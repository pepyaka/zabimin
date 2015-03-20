define(['Zapi', 'moment', 'Util', 'bootstrap-table', 'bootstrap-select', 'select2'], function(zapi, moment, util) {
    "use strict";


    //Page global variables
    var page = '#!Monitoring/Overview/Triggers';


    //Page components
    var filter = {
        init: function(initDone) {
            var groupGet = zapi.req('hostgroup.get', {
                output: ['name'],
                selectHosts: 'count',
                real_hosts: true
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
                    .selectpicker('refresh');
                $('#filter select')
                    .on('change', function (e) {
                        var $opt = $(this);
                        var ha = {};
                        ha[$opt.data('hashArgs')] = $opt.val() || null;
                        util.hash(ha, true);
                    })
                initDone();
            });
            $('#filter-since input[type="checkbox"]')
                .on('change', function (e) {
                    var checked = $(this).is(':checked');
                    var since = checked ? $('#filter-since input[type="text"]').val() : null;
                    util.hash({ age: since }, true);
                });
             $('#filter-since button')
                .on('click', function (e) {
                    var $this = $(this);
                    var since = $this
                        .parent('.input-group-btn')
                        .siblings('input').val();
                    if ($this.prop('id') === 'age-plus') {
                        since++
                    }
                    if ($this.prop('id') === 'age-minus') {
                        since--
                    }
                    util.hash({ age: since }, true);
                })
            $('#filter-reset')
                .on('click', function() {
                    util.hash(null, true)
                });
        },
        update: function(hashArgs) {
            $.each(hashArgs, function(k, v) {
                $('[data-hash-args="'+k+'"]')
                    .selectpicker('val', v)
            });
            if (hashArgs.groupid) {
                $('#overview-hosts')
                    .prop('href', '#!Monitoring/Overview&groupid=' + hashArgs.groupid);
                $('#overview-data')
                    .prop('href', '#!Monitoring/Overview/Data&groupid=' + hashArgs.groupid);
            } else {
                $('#overview-hosts')
                    .prop('href', '#!Monitoring/Overview');
                $('#overview-data')
                    .prop('href', '#!Monitoring/Overview/Data');
            }
            if (hashArgs.age) {
                $('#filter-since input[type="text"]')
                    .val(hashArgs.age)
                    .prop('disabled', false);
                $('#filter-since button')
                    .prop('disabled', false);
            } else {
                $('#filter-since')
                    .find('input[type="text"],button')
                    .prop('disabled', true);
            }
        }
    };
    var overviewTable = {
        init: function() {
            $('#overview-table table')
                .css('opacity', .3)
        },
        update: function(hashArgs) {
            var triggerGet = zapi.req('trigger.get', {
                monitored: true,
                skipDependent: true,
                groupids: hashArgs.groupid,
                only_true: hashArgs.status ? null : true,
                filter: {
                    value: hashArgs.status && hashArgs.status[0] === 'Problem' ? 1 : null
                },
                withUnacknowledgedEvents: hashArgs.ack && hashArgs.ack[0] === '1' ? true : null,
                withLastEventUnacknowledged: hashArgs.ack && hashArgs.ack[0] == '2' ? true : null,
                min_severity: hashArgs.severity ? hashArgs.severity[0] : 0,
                lastChangeSince: hashArgs.since && hashArgs.since[0],
                output: 'extend',
                selectHosts: ['name']
            })
            $('#overview-table table')
                .fadeTo('fast', .3)
            triggerGet.done(function(zapiResponse) {
                var triggers = zapiResponse.result;
                var hosts = [];
                var trNameObj = {};
                triggers.forEach(function(t) {
                    var h = t.hosts[0];
                    if (!hosts[h.hostid]) {
                        hosts[h.hostid] = {
                            field: h.hostid,
                            title: h.name,
                            formatter: function (t) {
                                if (t) {
                                    return zapi.map('Trigger', 'value', t.value).value
                                }
                            },
                            cellStyle: function (t) {
                                var cl = '';
                                if (t === 'OK') {
                                    cl = 'text-success';
                                }
                                if (t === 'Problem') {
                                    cl = 'text-danger';
                                }
                                return {
                                    classes: cl
                                }
                            }
                        }
                    }
                    if (trNameObj[t.description]) {
                        trNameObj[t.description].push(t);
                    } else {
                        trNameObj[t.description] = [t];
                    }
                });
                var data = Object.keys(trNameObj).map(function (k) {
                    var d = {
                        name: k,
                    }
                    trNameObj[k].forEach(function (t) {
                        d[t.hosts[0].hostid] = t;
                    });
                    return d
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
                            title: 'Trigger',
                            sortable: true,
                            class: 'text-nowrap',
                        }].concat(hosts.filter(Boolean)),
                        data: data
                    })
                    .fadeTo('fast', 1)
                });
        }
    };


    //Page external methods
    var init = function(hashArgs) {
        filter.init(function () {
            filter.update(hashArgs)
        });
        overviewTable.init();
        overviewTable.update(hashArgs);

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
