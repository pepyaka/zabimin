define(['Zapi', 'Util', 'moment', 'config', 'Page', 'bootstrap-table'], function(zapi, util, moment, zabimin, page) {
    "use strict";

    // Page global variables
    var pageHash = '#!Monitoring/Latest/Data';
    var pageArgs = {
        trends: true,
        itemid: []
    }
    var viewType;
    var items;
    var chartLib;

    // Page components
    var filter = {
        init: function() {
            $('#latest-data-trends button')
                .on('click', function () {
                    util.hash({ trends: $(this).data('hashValue') || null }, true);
                });
            page.dateTimeRangePicker.init(function (since, till) {
                util.hash({
                    since: since ? since.format('YYYY-MM-DDTHH:mm') : null,
                    till: till ? till.format('YYYY-MM-DDTHH:mm') : null
                }, true);
            });
        },
        update: function(hashArgs) {
            $('#latest-data-trends button')
                .removeClass('active');
            if (hashArgs.trends) {
                pageArgs.trends = true;
                $('[data-hash-value="true"]')
                    .addClass('active');
            } else {
                pageArgs.trends = false;
                $('[data-hash-value=""]')
                    .addClass('active');
            }

            // DateTimeRangePicker
            page.dateTimeRangePicker.since(hashArgs.since ?
                moment(hashArgs.since[0]) :
                page.dateTimeRangePicker.min()
            );
            page.dateTimeRangePicker.till(hashArgs.till ?
                moment(hashArgs.till[0]) :
                page.dateTimeRangePicker.max()
            );
        },
        setMin: function () {
            var itemsByType = [];
            var oldestHistoryReqArr = [];
            var oldestTrendsReqArr = [];
            items.forEach(function (gi) {
                if (itemsByType[gi.value_type]) {
                    itemsByType[gi.value_type].push(gi.itemid);
                } else {
                    itemsByType[gi.value_type] = [ gi.itemid ];
                }
            });
            itemsByType.forEach(function (itemids, value_type) {
                oldestHistoryReqArr.push(
                    zapi.req('history.get', {
                        itemids: itemids,
                        history: value_type,
                        sortfield: 'clock',
                        sortorder: 'ASC',
                        limit: 1
                    })
                );
                oldestTrendsReqArr.push(
                    zapi.req('trends.get', {
                        itemids: itemids,
                        history: value_type,
                        sortfield: 'clock',
                        sortorder: 'ASC',
                        limit: 1
                    })
                );
            });
            $.when.apply(null, [].concat(oldestHistoryReqArr, oldestTrendsReqArr))
            .done(function(oldestHistoryResponse, oldestTrendsResponse) {
                var oldestHistory = oldestHistoryResponse[0].result[0];
                var oldestTrends = oldestTrendsResponse[0].result[0];
                if (pageArgs.trends) {
                    page.dateTimeRangePicker.min(moment(oldestTrends.clock, 'X'));
                } else {
                    page.dateTimeRangePicker.min(moment(oldestHistory.clock, 'X'));
                }
            });
        }

    };
    var graph = {
        init: function(items, stacked) {
            this.graph = {
                idSel: 'chart',
                form: 'Monitoring/Latest/Data',
                graphtype: stacked ? '1' : '0',
                yAxisUnits: { left: '', right: '' },
                gItems: items
            }
            chartLib.init(this.graph)
        },
        load: function(history) {
            chartLib.load(history, this.graph)
        },
    };
    var table = {
        init: function() {
            var columns = [{
                field: 'Time',
                title: 'Time',
                class: 'text-nowrap'
            }];
            items.forEach(function(item) {
                columns.push({
                    field: item.itemid,
                    title: item.units ? item.name+' ('+item.units+')' : item.name
                });
            });
            $('#latest-data-table table')
                .bootstrapTable({
                    columns: columns
                })
        },
        load: function(history) {
            var tableData = [];
            var dataObj = {};
            items.forEach(function(item, i) {
                history[i].forEach(function(d) {
                    var roughClock = d.clock - (d.clock % item.delay || 60);
                    if (!dataObj[roughClock]) {
                        dataObj[roughClock] = { 
                            Time: moment(roughClock, 'X').format('YYYY-MM-DD HH:mm') 
                        };
                    }
                    dataObj[roughClock][item.itemid] = d.value || d.value_avg;
                });
            });
            for (var prop in dataObj) {
                dataObj[prop].clock = +prop;
                tableData.push(dataObj[prop]);
            }
            tableData.sort(function(a, b) {
                return a.clock > b.clock ? 1 : -1
            })
            $('#latest-data-table table')
                .bootstrapTable('load', tableData)
        }
    };
    var text = {
        init: function () {
        },
        load: function(data) {
            var dataObj = {};
            var dataArr = [];
            var textData = [];
            items.forEach(function(item, i) {
                data[i].forEach(function(d) {
                    var roughClock = d.clock - (d.clock % item.delay || 60);
                    var m = moment(roughClock, 'X').format('YYYY-MM-DD HH:mm')
                    if (!dataObj[roughClock]) {
                        dataObj[roughClock] = [m];
                    }
                    dataObj[roughClock][i+1] = d.value || d.value_avg;
                });
            });
            for (var prop in dataObj) {
                dataArr.push([prop].concat(dataObj[prop]));
            }
            dataArr.sort(function(a, b) {
                return a[0] > b[0] ? 1 : -1
            })
            textData = dataArr.map(function(d) {
                return d.slice(1).join('\t\t')
            });
            $('#latest-data-text pre')
                .html(textData.join('\n'))
        },
    };
    var content = {
        init: function (itemids, initDone) {
            var itemGet = zapi.req('item.get', {
                itemids: itemids || 0,
                output: [
                    'name',
                    'units',
                    'value_type',
                    'delay',
                    'lastvalue',
                    'lastclock'
                ],
                selectHosts: ['name']
            });
            itemGet.done(function(zapiResponse) {
                items = zapiResponse.result;
                var title = items.map(function(i) {
                    return i.hosts[0].name + ': ' + i.name
                });
                if (title.length > 2) {
                    title = [title.length + ' Items']
                }
                $('#latest-data-title')
                    .text(title.join(', '));
                initDone(items);
            });
        },
        update: function (hashArgs) {
            var deferred = new $.Deferred();
            var histReqArray = [ deferred ];
            var since = hashArgs.since ? moment(hashArgs.since[0]).format('X') : Date.now()/1000 - 68400;
            var till = hashArgs.till ? moment(hashArgs.till[0]).format('X') : null;
            items.forEach(function(item) {
                var histGet = zapi.req((pageArgs.trends ? 'trends' : 'history') + '.get', {
                    itemids: item.itemid,
                    history: item.value_type,
                    time_from: since,
                    time_till: till
                });
                histReqArray.push(histGet);
            });
            $.when.apply(null, histReqArray).done(function() {
                // extract all responses except fake deferred
                var args = Array.prototype.slice.call(arguments, 1);
                var history = args.map(function (zapiResponse) {
                    return zapiResponse[0].result
                });
                graph.load(history);
                table.load(history)
                text.load(history);
            });
            deferred.resolve(false);
        }
    };

    var init = function(hashArgs) {
        filter.init();
        // Load chart library, then load history data
        require(['chartLib/' + zabimin.chartLib], function(lib) {
            chartLib = lib;
            update(hashArgs);
        });
    };
    var update = function(hashArgs) {
        var viewType = hashArgs.type ? hashArgs.type[0] : 'graph';
        var  since = hashArgs.since && hashArgs.since[0];
        var  till = hashArgs.till && hashArgs.till[0];
        var  trends = hashArgs.trends && Boolean(hashArgs.trends[0]);
        // Compare arrays. Init only if itemid changed
        var a = hashArgs.itemid;
        var b = pageArgs.itemid;
        filter.update(hashArgs)
        if (a.length !== b.length || a.some(function(v, i) { return v !== b[i] })) {
            content.init(hashArgs.itemid, function () {
                filter.setMin();
                graph.init(items);
                table.init(items);
                text.init(items);
                content.update(hashArgs);
            });
            pageArgs.itemid = hashArgs.itemid.slice();
        } else {
            if (
                pageArgs.since !== since ||
                pageArgs.till !== till ||
                pageArgs.trends !== trends
                ) {
                pageArgs.since = since;
                pageArgs.till = till;
                pageArgs.trends = trends;
                content.update(hashArgs);
            }
        }


        // Tabs
        $('#latest-data-tabs .nav li')
            .removeClass('active')
            .each(function () {
                var $li = $(this);
                var liHashValue = $li.data('hashValue');
                var hashValue = liHashValue === 'graph' ? null : liHashValue;
                if (liHashValue === viewType) {
                    $li.addClass('active');
                }
                $li.children('a')
                    .attr('href', util.hash({ type: hashValue }).val);
            });
        $('#latest-data-tabs .tab-pane')
            .removeClass('active');
        $('#latest-data-' + viewType)
            .addClass('active');

        if (viewType === 'graph') {
            chartLib.redraw('chart');
        }
    };

    return {
        init: init,
        update: update
    }
});
