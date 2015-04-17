define(['Zapi', 'moment', 'Util', 'Page', 'config'], function(zapi, moment, util, page, zabimin) {
    "use strict";

    //Page global variables
    var pageHash = '#!Reports/Zabbix';


    var pie = {
        init: function () {
        },
        load: function () {
        }
    };

    //Page global methods
    var init = function(hashArgs) {
        var chartLibGet = $.Deferred();
        var pieOpts = {
            form: 'Reports/Zabbix'
        };

        $('#zapi-url').text(zapi.url);
        require(['chartLib/' + zabimin.chartLib], function (lib) {
            chartLibGet.resolve(lib);
        });

        showHosts();
        showItems();
        showTriggers();
        showServerReqPerf();

console.log(document.styleSheets)

        function showHosts() {
            var hostPieOpts = $.extend(
                {
                    idSel: 'hosts-pie'
                },
                pieOpts
            );
            // Hosts counts
            var totalHostGet = zapi.req('host.get', {
                countOutput: true,
                templated_hosts: true
            });
            var enabledHostGet = zapi.req('host.get', {
                countOutput: true,
                monitored_hosts: true
            });
            var templateGet = zapi.req('template.get', {
                countOutput: true
            });
            chartLibGet.done(function (chartLib) {
                chartLib.init(hostPieOpts);
            });
            $.when(totalHostGet, enabledHostGet, templateGet, chartLibGet)
                .done(function (zResTotal, zResEnabled, zResTpl, chartLib) {
                    var total = Number(zResTotal[0].result);
                    var enabled = Number(zResEnabled[0].result);
                    var templates = Number(zResTpl[0].result);
                    var disabled = total - enabled - templates;
                    $('#hosts-total').text(total);
                    $('#hosts-enabled').text(enabled);
                    $('#hosts-templates').text(templates);
                    $('#hosts-disabled').text(disabled);
                    chartLib.load([
                        ['Enabled', enabled],
                        ['Disabled', disabled],
                        ['Templates', templates]
                    ], hostPieOpts);
                });
        };

        function showItems() {
            var itemPieOpts = $.extend(
                {
                    idSel: 'items-pie'
                },
                pieOpts
            );
            /* Items defines as zabbix SQL query:
             * SELECT COUNT(i.itemid) AS cnt,i.status,i.state
             * FROM items i INNER JOIN hosts h ON i.hostid=h.hostid
             * WHERE h.status=0 AND i.flags IN (0,4) AND i.type<>9
             * GROUP BY i.status,i.state;
             */
            var enabledItemGet = zapi.req('item.get', {
                countOutput: true,
                monitored: true,
                filter: {
                    status: 0,
                    state: 0
                }
            });
            var disabledItemGet = zapi.req('item.get', {
                countOutput: true,
                filter: {
                    status: 1,
                    state: 0
                }
            });
            var notSupportedItemGet = zapi.req('item.get', {
                countOutput: true,
                monitored: true,
                filter: {
                    status: 0,
                    state: 1
                }
            });
            chartLibGet.done(function (chartLib) {
                chartLib.init(itemPieOpts);
            });
            $.when(enabledItemGet, disabledItemGet, notSupportedItemGet, chartLibGet)
                .done(function (zResEnabled, zResDisabled, zResNotSup, chartLib) {
                    var enabled = Number(zResEnabled[0].result);
                    var disabled = Number(zResDisabled[0].result);
                    var notSupported = Number(zResNotSup[0].result);
                    var total = enabled + disabled + notSupported
                    $('#items-total').text(total);
                    $('#items-enabled').text(enabled);
                    $('#items-disabled').text(disabled);
                    $('#items-not-supported').text(notSupported);
                    chartLib.load([
                        ['Enabled', enabled],
                        ['Disabled', disabled],
                        ['Templates', notSupported]
                    ], itemPieOpts);
                });
        };
    
        function showTriggers() {
            var enabledTriggerGet = zapi.req('trigger.get', {
                countOutput: true,
                monitored: true
            });
            var disabledTriggerGet = zapi.req('trigger.get', {
                countOutput: true,
                filter: { status: 1 }
            });
            var problemTriggerGet = zapi.req('trigger.get', {
                countOutput: true,
                monitored: true,
                filter: { value: 1 }
            });
            $.when(enabledTriggerGet, disabledTriggerGet, problemTriggerGet)
                .done(function (zResEnabled, zResDisabled, zResProblem) {
                    var enabled = Number(zResEnabled[0].result);
                    var disabled = Number(zResDisabled[0].result);
                    var problem = Number(zResProblem[0].result);
                    $('#triggers-total').text(enabled + disabled);
                    $('#triggers-enabled').text(enabled);
                    $('#triggers-disabled').text(disabled);
                    $('#triggers-ok').text(enabled - problem);
                    $('#triggers-problem').text(problem);
                });
        };

        function showServerReqPerf() {
            var delaysItemGet = zapi.req('item.get', {
                monitored: true,
                output: ['delay'],
                //filter: {
                //    status: 0
                //}
            });
            delaysItemGet.done(function (zRes) {
                var items = zRes.result;
                var reqPerfArr = items.map(function (i) {
                    return i.delay !== '0' ? 1 / Number(i.delay) : null
                }).filter(Boolean);
                var sum = 0;
                reqPerfArr.forEach(function (s) {
                    sum += s;
                });
                
                $('#server-req-perf').text(sum.toLocaleString());
            });
        };
    };
    var update = function(hashArgs) {
    };


    //Common functions

    return {
        init: init,
        update: update
    }
});
