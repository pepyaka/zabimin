define(['Zapi', 'moment', 'config', 'Util', 'bootstrap-select'], function(zapi, moment, zabimin, util) {
    "use strict";

    //Page global variables
    var page = '#!Monitoring/Graphs';
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
            if (hashArgs.trends && hashArgs.trends[0] === 'true') {
                $('[data-hash-args="trends"]').removeClass('active')
                $('[data-hash-args="trends"][value="true"]').addClass('active')
            } else {
                $('[data-hash-args="trends"][value="true"]').removeClass('active')
                $('[data-hash-args="trends"][value=""]').addClass('active')
            }
        }
    };
    var graph = {
        init: function (hashArgs) {
        },
        update: function (args) {
            var graphids = args.graphids.slice(0, args.idSel.length + 1);
            getGraph(graphids, function (graphs) {
                graphs.forEach(function (g, i) {
                    var idSel = args.idSel[i];
                    g.thumbnail = args.thumbnail;
                    g.trends = args.trends;
                    $('#' + idSel)
                        .parent()
                        .siblings('h3,h4,h5')
                            .text(g.hosts[0].name + ': ' + g.name)
                        .parent('a')
                            .prop('href', page + '&hostid=' + g.hosts[0].hostid + '&graphid=' + g.graphid);
                    args.items = g.gItems;
                    getHistory(args, function (history) {
console.log(history)
                        chartLib.init(g, idSel);
                        chartLib.load(history);
                        chartLib.draw(idSel);
                    });
                });
            });
        }
    }
    var tiles = {
        init: function (hashArgs) {
        },
        update: function (graphOpts) {
            var graphRate = util.visit.show('Monitoring/Graphs', 'graphid').slice(0, 12);
            graphOpts.idSel = [];
            graphOpts.graphids = graphRate.map(function (g, i) {
                graphOpts.idSel.push('popular-graph-' + i);
                return g[0]
            });
            graph.update(graphOpts);
        }
    }


    //Page external fumctions
    var init = function(hashArgs) {
        filter.init(function () {
            filter.update(hashArgs);
        });
        require(['Chart/'+zabimin.chartLib], function (lib) {
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
        var graphOpts = {
            idSel: ['chart'],
            graphids: hashArgs.graphid,
            time_till: hashArgs.till && hashArgs.till[0],
        };
        if (graphOpts.graphids) {
            $('#popular-graphs')
                .addClass('hidden');
            $('#main-chart')
                .removeClass('hidden');
            graphOpts.thumbnail = false;
            graphOpts.trends = hashArgs.trends && hashArgs.trends[0];
            graphOpts.time_from = 0;
            graph.update(graphOpts);
        } else {
            $('#popular-graphs')
                .removeClass('hidden');
            $('#main-chart')
                .addClass('hidden');
            graphOpts.thumbnail = true;
            graphOpts.trends = true;
            graphOpts.time_from = Date.now()/1000-86400,
            tiles.update(graphOpts);
        }
    };
    function getGraph(graphid, getGraphDone) {
        var graphGet = zapi.req('graph.get', {
            graphids: graphid || 0,
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
            getGraphDone(zapiResponse.result.map(function (g) {
                g.gItems = [];
                g.gitems.forEach(function (gi) {
                    var item = g.items.filter(function (i) {
                        return gi.itemid === i.itemid
                    })[0];
                    g.gItems[gi.sortorder] = $.extend({}, gi, item);
                });
                return g
            }));
        });
    };
    function getHistory(args, getTrendsDone) {
        var histReqArray = args.items.map(function (item) {
            return zapi.req((args.trends ? 'trends' : 'history') + '.get', {
                hostids: null,
                itemids: item.itemid || 0,
                history: item.value_type,
                time_from: args.time_from && Date.now()/1000-86400,
                time_till: args.time_till
            });
        });
        var deferred = new $.Deferred();// Add fake deffered object for zapi requests to 
        histReqArray.unshift(deferred); // always pass multiple Deferred objects to jQuery.when()
        $.when.apply(null, histReqArray).done(function() {
            var data = [];
            for (var a = 1; a < arguments.length; a++) {
                data.push(arguments[a][0].result);
            }
            getTrendsDone(data)
        });
        deferred.resolve(false);
    }

    return {
        init: init,
        update: update
    }
});
