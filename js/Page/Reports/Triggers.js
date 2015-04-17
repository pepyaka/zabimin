// Monitoring/Triggers page
define(['Zapi', 'Util', 'moment', 'bootstrap-select', 'bootstrap-table'], function(zapi, util, moment) {
    "use strict";

    //Page global variables
    var topCount = 100;

    //Page components
    var filter = {
        init: function (initDone) {
        },
        update: function (hashArgs) {
            $('#time-interval .btn')
                .removeClass('active');
            if (hashArgs.interval) {
                $('[href="#!Reports/Triggers&interval=' + hashArgs.interval.join(',') + '"]')
                    .addClass('active');
            } else {
                $('[href="#!Reports/Triggers&interval=day"]')
                    .addClass('active');
            }
        }
    };
    var table = {
        init: function () {
            var columns = [{
                    formatter: function(hosts) {
                        return (
                            '<a href="#!Inventory/Host&hostid=' + hosts[0].hostid + '">' +
                                hosts[0].name +
                            '</a>'
                        )
                    }
                }, {
                    formatter: function(descr, trigger) {
                        return (
                            '<a href="#!Monitoring/Events/Triggers&triggerid=' + trigger.triggerid + '">' +
                                descr +
                            '</a>'
                        )
                    }
                }, {
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
            }];
            $('#report-trigger-top table')
                .bootstrapTable({
                    columns: columns,
                })
        },
        update: function (hashArgs, apps) {
            var interval = hashArgs.interval || [1, 'd'];
            var eventGet = zapi.req('event.get', {
                output: ['objectid'],
                eventids: null,
                time_from: moment().subtract(interval[0], interval[1]).format('X')
            });
            $('#report-trigger-top')
                .fadeTo('fast', 0.3)
                .parent('div')
                    .addClass('spinner')
            eventGet.done(function(zapiResponse) {
                var events = zapiResponse.result;
                var objIds = {};
                events.forEach(function (e) {
                    if (objIds[e.objectid]) {
                        objIds[e.objectid]++;
                    } else {
                        objIds[e.objectid] = 1;
                    }
                });
                var triggerGet = zapi.req('trigger.get', {
                    triggerids: Object.keys(objIds),
                    output: ['description', 'priority'],
                    //active: true,
                    //selectLastEvent: 'extend',
                    selectHosts: ['name'],
                });
                triggerGet.done(function(zapiResponse) {
                    var triggers = zapiResponse.result;
                    triggers.forEach(function (t) {
                        t.events = objIds[t.triggerid];
                    });
                    triggers.sort(function (a, b) {
                        return b.events - a.events
                    });
                    $('#report-trigger-top')
                        .find('table')
                            .bootstrapTable('load', triggers)
                        .end()
                        .parent('div')
                            .removeClass('spinner')
                        .end()
                        .fadeTo('fast', 1)
                });
            });
        }
    }


    //Page external methods
    var init = function(hashArgs) {
        table.init();
        update(hashArgs);
    };
    var update = function(hashArgs) {
        filter.update(hashArgs);
        table.update(hashArgs);
    };


    //Page common functions
    
    return {
        init: init,
        update: update
    }
});
