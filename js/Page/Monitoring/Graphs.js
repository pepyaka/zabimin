define(['Zapi', 'moment', 'config', 'Util', 'Page', 'bootstrap-select'], function(zapi, moment, zabimin, util, page) {
    "use strict";

    //Page global variables
    var pageHash = '#!Monitoring/Graphs';
    var chartLib;

    //Page elements
    var filter = {
        groups: [],
        hosts: [],
        init: function (initDone) {
            var hosts = this.hosts;
            var groups = this.groups;
            var hostGet = zapi.req('host.get', {
                output: ['name', 'host'],
                selectGroups: ['name'],
                selectGraphs: ['name']
            });
            $('.selectpicker')
                .selectpicker();
            $('button[data-hash-args]')
                .on('click', function () {
                    var trends = {};
                    trends[$(this).data('hashArgs')] = $(this).val() || null;
                    util.hash(trends, true);
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
                $('#group-list')
                    .append(groupList)
                    .prop('disabled', false)
                    .on('change', function() {
                        util.hash({
                            groupid: $(this).val() || null,
                            hostid: null,
                            graphid: null
                        }, true);
                    });
                $('#host-list')
                    .prop('disabled', false)
                    .on('change', function() {
                        util.hash({
                            hostid: $(this).val() || null,
                            graphid: null
                        }, true);
                    });
                $('#graph-list')
                    .prop('disabled', false)
                    .on('change', function() {
                        util.hash({
                            graphid: $(this).val() || null
                        }, true);
                    });
                //$('#last-period')
                //    .on('change', function () {
                //        util.hash({
                //            since: moment().subtract(1, $(this).val()).format('X')
                //        }, true);
                //    });
                initDone();
            });
            page.dateTimeRangePicker.init(function (since, till) {
                util.hash({
                    since: since ? since.format('YYYY-MM-DDTHH:mm') : null,
                    till: till ? till.format('YYYY-MM-DDTHH:mm') : null
                }, true);
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
            var graphs = host ? host.graphs : [];
            var hostList = hosts.map(function (h) {
                return  '<option value="' + h.hostid + '">' +
                            h.name +
                        '</otion>'
            })
            hostList.unshift('<option value="">Nothing selected</option>');
            var graphList = graphs.map(function(g) {
                return  '<option value="' + g.graphid + '">' +
                            g.name +
                        '</otion>'
            })
            graphList.unshift('<option value="">Nothing selected</option>');
            $('#group-list')
                .val(hashArgs.groupid && hashArgs.groupid[0])
                .selectpicker('refresh');
            $('#host-list')
                .html(hostList)
                .val(hashArgs.hostid ? hashArgs.hostid[0] : '')
                .selectpicker('refresh');
            $('#graph-list')
                .html(graphList)
                .val(hashArgs.graphid && hashArgs.graphid[0])
                .selectpicker('refresh');

            // DateTimeRangePicker
            page.dateTimeRangePicker.since(hashArgs.since ?
                moment(hashArgs.since[0]) :
                page.dateTimeRangePicker.min()
            );
            page.dateTimeRangePicker.till(hashArgs.till ?
                moment(hashArgs.till[0]) :
                page.dateTimeRangePicker.max()
            );
        }
    };
    var graph = {
        init: function (graphids, graphOpts, initDone) {
            var graphGet = zapi.req('graph.get', {
                graphids: graphids,
                selectGraphItems: [
                    'calc_fnc',
                    'color',
                    'drawtype',
                    'gitemid',
                    'itemid',
                    'sortorder',
                    'yaxisside'
                ],
                selectItems: [
                    'delay',
                    'name',
                    'value_type',
                    'units'
                ],
                selectHosts: ['name']
            });
            graphGet.done(function(zapiResponse) {
                var graphs = zapiResponse.result;
                graphs = graphs.map(function (g) {
                    var gItems = [];
                    g.gitems.forEach(function (gi) {
                        var item = g.items.filter(function (i) {
                            return gi.itemid === i.itemid
                        })[0];
                        gItems[gi.sortorder] = $.extend({}, gi, item);
                    });
                    return $.extend({
                        idSel: 'graphid-' + g.graphid,
                        gItems: gItems
                    }, graphOpts, g);
                });
                initDone(graphs);
            });
        },
        getOldest: function (graphs, getOldestDone) {
            var itemsByType = [];
            var oldestHistoryReqArr = [];
            var oldestTrendsReqArr = [];
            graphs.forEach(function (g) {
                g.gItems.forEach(function (gi) {
                    if (itemsByType[gi.value_type]) {
                        itemsByType[gi.value_type].push(gi.itemid);
                    } else {
                        itemsByType[gi.value_type] = [ gi.itemid ];
                    }
                });
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
                getOldestDone(
                    oldestHistoryResponse[0].result[0],
                    oldestTrendsResponse[0].result[0]
                );
            });
        },
        load: function (graph, loadDone) {
            // Add fake deffered object for zapi requests to 
            // always pass multiple Deferred objects to jQuery.when()
            var deferred = new $.Deferred();
            var histReqArray = [ deferred ];
            graph.gItems.map(function (item) {
                histReqArray.push(
                    zapi.req((graph.trends ? 'trends' : 'history') + '.get', {
                        itemids: item.itemid || 0,
                        history: item.value_type,
                        time_from: graph.since || Date.now()/1000-86400,
                        time_till: graph.till
                    })
                );
            });
            $.when.apply(null, histReqArray).done(function() {
                // extract all responses except fake deferred
                var args = Array.prototype.slice.call(arguments, 1);
                var history = args.map(function (zapiResponse) {
                    return zapiResponse[0].result
                });
                loadDone(history);
            });
            deferred.resolve(false);
        }

    }

    //Page external functions
    var init = function(hashArgs) {
        filter.init(function () {
            filter.update(hashArgs);
        });
        var chartLibName = hashArgs.chartLib ? hashArgs.chartLib[0] : zabimin.chartLib;
        require(['chartLib/' + chartLibName], function (lib) {
            chartLib = lib;
            selectView(hashArgs);
        })
    }
    var update = function(hashArgs) {
        filter.update(hashArgs);
        selectView(hashArgs);
    }


    //Page common functions
    function selectView(hashArgs) {
        var now = moment();
        var dayAgo = moment().subtract(1, 'd');
        var graphRate = util.visit.show('Monitoring/Graphs', 'graphid');
        var graphids = [ hashArgs.graphid && hashArgs.graphid[0] ];
        var graphOpts = {
            since: hashArgs.since ? moment(hashArgs.since[0]).format('X') : null,
            till: hashArgs.till ? moment(hashArgs.till[0]).format('X') : null
        };

        //Remove old graphs
        $('.graph-container').each(function () {
            $(this).attr('id', function (i, idSel) {
                chartLib.destroy(idSel);
                return null;
            });
        });

        // Select single graph or popular graphs tiles
        if (graphids[0]) {
            page.dateTimeRangePicker.enable();

            graph.init(graphids, graphOpts, function (graphs) {
                var g = graphs[0];
                g.form = 'Monitoring/Graphs: chart';
                $('#popular-graphs')
                    .addClass('hidden')
                $('#main-graph')
                    .removeClass('hidden')
                    .find('.graph-container')
                        .attr('id', 'graphid-' + g.graphid)
                        .end()
                    .find('.graph-title')
                        .text(g.name);
                graph.getOldest(graphs, function (h, t) {
                    var historyOldest = moment(h.clock, 'X');
                    var trendsOldest = moment(t.clock, 'X');
                    page.dateTimeRangePicker.min(trendsOldest);
                    if (g.since < historyOldest.format('X')) {
                        g.trends = true
                    } else {
                        g.trends = false
                    }
                    graph.load(g, function (history) {
                        chartLib.load(history, g);
                    });
                });
                chartLib.init(g);
            });
        } else {
            page.dateTimeRangePicker.min(dayAgo);
            page.dateTimeRangePicker.max(now);
            page.dateTimeRangePicker.disable();
            //TODO: add popular graphs for each group
            //var gidFilter = groupid && { groupid: groupid };
            //var graphRate = util.visit.show('Monitoring/Graphs', 'graphid', gidFilter);
            $('#popular-graphs .graph-container').each(function (i) {
                var graphid;
                if (graphRate[i]) {
                    graphid = graphRate[i][0];
                    graphids.push(graphid);
                    $(this).attr('id', 'graphid-' + graphid);
                }
            });
            graphOpts.thumbnail = true;
            graphOpts.form = 'Monitoring/Graphs: thumbnail'
            graph.init(graphids, graphOpts, function (graphs) {
                var histOpts = {
                    since: dayAgo.format('X'),
                    till: now.format('X'),
                    trends: true,
                };
                $('#popular-graphs')
                    .removeClass('hidden');
                $('#main-graph')
                    .addClass('hidden');
                graphs.forEach(function (g) {
                    $('#' + g.idSel)
                        .parent()
                        .siblings('.graph-title')
                            .text(g.hosts[0].name + ': ' + g.name)
                        .parent('a')
                            .attr('href', pageHash + '&hostid=' + g.hosts[0].hostid + '&graphid=' + g.graphid);
                    chartLib.init(g);
                    graph.load($.extend(g, histOpts), function (history) {
                        chartLib.load(history, g);
                    });
                });
            });
        }
    };

    return {
        init: init,
        update: update
    }
});
