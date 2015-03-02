define(['Zapi', 'moment', 'config', 'bootstrap-select'], function(zapi, moment, zabimin) {
    "use strict";

    var page = '#!Monitoring/Graphs';
    var groups = [];
    var hosts;
    var graphs = [];
    var lib;

    var init = function(hash) {
        getHostListData(function() {
            createGroupList(hash);
            createHostList(hash);
            createGraphList(hash);
        });
        require(['Chart/'+zabimin.chartLib], function(chartLib) {
            lib = chartLib;
            //createThumbnails(hash.hostid)
            createMainGraph(hash)
        })
    }
    var update = function(hash) {
        createGroupList(hash);
        createHostList(hash);
        createGraphList(hash);
        //createThumbnails(hash.hostid)
        createMainGraph(hash)
    }
    function getHostListData(hostListDataGetDone) {
        var hostGet = zapi.req('host.get', {
            output: ['name', 'host'],
            selectGroups: ['name'],
            selectGraphs: ['name']
        });
        hostGet.done(function(zapiResponse) {
            hosts = zapiResponse.result
            hosts.forEach(function(host) {
                host.groups.forEach(function(group) {
                    if (groups[group.groupid]) {
                        groups[group.groupid].hosts.push(host)
                    } else {
                        groups[group.groupid] = group
                        groups[group.groupid].hosts = [host]
                    }
                });
                host.graphs.forEach(function(graph) {
                    graphs[graph.graphid] = graph
                });
            });
            groups = groups.filter(Boolean);
            graphs = graphs.filter(Boolean);
            hosts.sort(function(a, b) {
                return a.name > b.name ? 1 : -1
            })
            groups.sort(function(a, b) {
                return a.name > b.name ? 1 : -1
            })
            graphs.sort(function(a, b) {
                return a.name > b.name ? 1 : -1
            })
            hostListDataGetDone()
        })
    };
    function createGroupList(hash) {
        var groupList;
        var groupName;
        if (hash.groupid) {
            groupName = [];
            groupList = groups.map(function(g) {
                var active = '';
                var groupid;
                if (hash.groupid.indexOf(g.groupid) > -1) {
                    groupName.push(g.name);
                    active = 'active'
                    groupid = hash.groupid.filter(function(gid) {
                        return gid !== g.groupid
                    });
                } else {
                    groupid = [g.groupid].concat(hash.groupid)
                }
                return [
                    '<li class="'+active+'">',
                        '<a href="'+page+'&groupid='+groupid+'">',
                            g.name,
                        '</a>',
                    '</li>'
                ].join('')
            });
        } else {
            groupName = ['Select host group'];
            groupList = groups.map(function(g) {
                return [
                    '<li>',
                        '<a href="'+page+'&groupid='+g.groupid+'">',
                            g.name,
                        '</a>',
                    '</li>'
                ].join('')
            });
        }
        if (groupName.length > 2) {
            groupName = [groupName.length+' host groups'];
        }
                
        $('#host-group-list button')
            .prop('disabled', false)
            .children('span:first-child')
                .text(groupName.join(','))
        $('#host-group-list ul')
            .html(groupList.join(''))
    };
    function createHostList(hash) {
        var groupidArg = '';
        var hostName = 'Select host';
        var hostList; 
        var selHosts = hosts;
        if (hash.groupid) {
            hash.groupid.forEach(function(selGroupId) {
                selHosts = selHosts.filter(function(host) {
                    return host.groups.some(function(g) {
                        return g.groupid == selGroupId
                    });
                });
            });
            groupidArg = '&groupid='+hash.groupid.join(',') 
        }
        hostList = selHosts.map(function(h) {
            var active = '';
            if (hash.hostid && hash.hostid[0] === h.hostid) {
                hostName = h.name
                active = 'active'
            }
            return [
                '<li class="'+active+'">',
                    '<a href="'+page+groupidArg+'&hostid='+h.hostid+'">',
                        h.name,
                    '</a>',
                '</li>'
            ].join('')
        });
        if (hostList.length > 0) {
            $('#host-list button')
                .prop('disabled', false)
                .children('span:first-child')
                    .text(hostName)
            $('#host-list ul')
                .html(hostList.join(''))
        } else {
            $('#host-list button')
                .prop('disabled', true)
                .children('span:first-child')
                    .text('No such host')
        }
    };
    function createGraphList(hash) {
        var groupidArg = '';
        var hostidArg = '';
        var selHost;
        var graphList;
        var graphName;
        if (hash.hostid) {
            hostidArg = '&hostid='+hash.hostid.join(',')
            if (hash.groupid) {
               groupidArg = '&groupid='+hash.groupid.join(',') 
            }
            selHost = hosts.filter(function(h) {
                return h.hostid === hash.hostid[0]
            })[0];
            graphList = selHost.graphs.map(function(g) {
                var active = '';
                if (hash.graphid && hash.graphid[0] === g.graphid) {
                    graphName = g.name
                    active = 'active'
                }
                return [
                    '<li class="'+active+'">',
                        '<a href="'+page+groupidArg+hostidArg+'&graphid='+g.graphid+'">',
                            g.name,
                        '</a>',
                    '</li>'
                ].join('')
            });
            $('#graph-list button')
                .prop('disabled', false)
                .children('span:first-child')
                    .text(graphName)
            $('#graph-list ul')
                .html(graphList.join(''))
        } else {
            $('#graph-list button')
                .prop('disabled', true)
                .children('span:first-child')
                    .text('Select graph')
        }
    };
    function createThumbnails(hostid) {
        var graphGet = zapi.req('graph.get', {
            hostids: hostid || 0,
            selectGraphItems: 'extend',
            selectItems: ['name', 'value_type']
        });
        if (!hostid) {
            return
        }
        graphGet.done(function(zapiResponse) {
            var chartCarouselItemNum = 6;
            var chartCarouselItems = [];
            var chartCarousel = []
            var graphsData = [];
            $.each(zapiResponse.result, function(i, graph) {
                chartCarouselItems.push([
                    '<div class="col-sm-' + 12 / chartCarouselItemNum + '">',
                        '<a href="'+page+'&graphid='+graph.graphid+'">',
                            '<div class="chart-thumbnail-caption">',
                                graph.name,
                            '</div>',
                            '<div class="chart-thumbnail" id="graph-id-'+graph.graphid+'"></div>',
                        '</a>',
                    '</div>'
                ].join(''));
                graph.idSel = 'graph-id-' + graph.graphid;
                graph.thumbnail = true;
                getGraphData(graph, function(graphData) {
                    graphsData.push(graphData);
                });
            });
            while (chartCarouselItems[0]) {
                chartCarousel.push([
                    '<div class="item">',
                        '<div class="row">',
                            chartCarouselItems.splice(0, chartCarouselItemNum).join(''),
                        '</div>',
                    '</div>'
                ].join(''));
            };
            $('#chart-carousel')
                .on('slid.bs.carousel', function (e, direction, relatedTarget) {
                    $('#chart-carousel .active [id^=graph-id]').each(function() {
                        var carouselGraphId = $(this).prop('id')
                        var graphData = $.grep(graphsData, function(gd) {
                            return gd.idSel == carouselGraphId
                        })[0]
                        createGraph(graphData)
                    });
                })
                .children('.carousel-inner')
                .html(chartCarousel.join(''))
                .children('.item')
                .first()
                .addClass('active')
        });
    };
    function createMainGraph(hashArgs) {
        var graphGet = zapi.req('graph.get', {
            graphids: hashArgs.graphid || 0,
            selectGraphItems: 'extend',
            selectItems: ['name', 'value_type', 'units']
        });
        if (!hashArgs.graphid) {
            return
        }
        graphGet.done(function(zapiResponse) {
            var g = zapiResponse.result[0];
            var graph = {
                name: g.name,
                idSel: 'chart',
                thumbnail: false,
                type: zapi.map('Graph', 'graphtype', g.graphtype).value,
                yAxisMin: g.yaxismin,
                yAxisMax: g.yaxismax,
                yMinType: zapi.map('Graph', 'ymin_type', g.ymin_type).value,
                yMaxType: zapi.map('Graph', 'ymax_type', g.ymax_type).value,
                yAxisUnits: { left: '', right: '' },
                items: []
            };
            g.items.forEach(function(i) {
                var gItem = g.gitems.filter(function(gi) {
                    return gi.itemid === i.itemid
                })[0];
                if (gItem.yaxisside == 1) {
                    graph.yAxisUnits.right = i.units;
                } else {
                    graph.yAxisUnits.left = i.units;
                }
                graph.items[gItem.sortorder] = {
                    itemid: i.itemid,
                    name: i.name,
                    color: gItem.color,
                    units: i.units,
                    valueType: i.value_type,
                    drawtype: zapi.map('Graph item', 'drawtype', gItem.drawtype).value,
                    yaxisside: zapi.map('Graph item', 'yaxisside', gItem.yaxisside).value
                }
            })
            $('#title').text(graph.name);
            lib.init(graph);
            getHistoryData(hashArgs, graph.items, function(data) {
                lib.load(data);
                lib.draw();
            });
        });
    };
    function getHistoryData(hashArgs, items, getHistoryDataDone) {
        var histType = 'history';
        var histReqArray = items.map(function(item) {
            var histGet = zapi.req(histType + '.get', {
                hostids: null,
                itemids: item.itemid,
                history: item.valueType,
                time_from: hashArgs.since ? hashArgs.since[0] : Date.now()/1000 - 68400,
                time_till: hashArgs.till ? hashArgs.till[0] : null
            });
            return histGet
        });
        var deferred = new $.Deferred();// Add fake deffered object for zapi requests to 
        histReqArray.unshift(deferred); // always pass multiple Deferred objects to jQuery.when()
        $.when.apply(null, histReqArray).done(function() {
            var data = [];
            for (var a = 1; a < arguments.length; a++) {
                data.push(arguments[a][0].result);
            }
            getHistoryDataDone(data)
        });
        deferred.resolve(false);
    };

    function getGraphData(graph, graphDataGetDone) {
        var zapiReqList = [];
        var timeFrom = moment().format('X') - 86400 * 30
        $.each(graph.items, function(i, item) {
            var gItem = $.grep(graph.gitems, function(gitem) {
                return item.itemid === gitem.itemid
            })[0];
            //axis units (for axis label) last of each item or nothing
            var yaxisside = zapi.map('Graph item', 'yaxisside', gItem.yaxisside).value;
            if (yaxisside === 'left') {
                graphData.yAxisUnits.left = item.units
            }
            if (yaxisside === 'right') {
                graphData.yAxisUnits.right = item.units
            }
            var r = zapi.req('trends.get', {
                hostids: null,
                itemids: item.itemid,
                history: item.value_type,
                //sortfield: 'clock',
                //time_till: 1422442806
                time_from: timeFrom
            })
            r.graphItem = {
                item: item,
                gitem: gItem,
                color: gItem.color,
                units: item.units,
                drawtype: zapi.map('Graph item', 'drawtype', gItem.drawtype).value,
                yaxisside: yaxisside,
                name: item.name,
                sortorder: gItem.sortorder,
            }
            zapiReqList.push(r)
        })
        $.when.apply(null, zapiReqList).done(function() {
            if ($.isArray(arguments[0])) {
                $.each(arguments, function(i, zapiResponse) {
                    graphData.items.push(
                        $.extend(
                            { data: zapiResponse[0].result },
                            zapiResponse[2].graphItem
                        )
                    );
                });
            } else {
                graphData.items.push(
                    $.extend(
                        { data: arguments[0].result },
                        arguments[2].graphItem
                    )
                );
            }
            graphDataGetDone(graphData)
        });
    }

    return {
        init: init,
        update: update
    }
});
