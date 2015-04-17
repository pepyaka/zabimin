define(['Zapi', 'Util', 'Page', 'moment', 'config', 'bootstrap-select' ], function(zapi, util, page, moment, zabimin) {
    "use strict";

    //Page global variables 
    var pageHash = '#!Monitoring/Screens';
    var chartLib;
    var screens;
    var screenid = 0;

    //Page components
    var filter = {
        init: function (initDone) {
            var screenGet = zapi.req('screen.get', {
                output: 'extend',
                selectScreenItems: 'extend',
                sortfield: 'name'
            });
            $('.selectpicker')
                .selectpicker();
            $('[data-hash-args]')
                .on('change', function () {
                    var hashArgs = {};
                    var arg = $(this).data('hashArgs');
                    var val = $(this).val() || null;
                    hashArgs[arg] = val;
                    util.hash(hashArgs, true);
                });
            page.dateTimeRangePicker.init(function (since, till) {
                util.hash({
                    since: since ? since.format('YYYY-MM-DDTHH:mm') : null,
                    till: till ? till.format('YYYY-MM-DDTHH:mm') : null
                }, true);
            });
            screenGet.done(function(zapiResponse) {
                screens = zapiResponse.result;
                var screenList = screens.map(function (s) {
                    return (
                        '<option value="' + s.screenid + '">' +
                            s.name +
                        '</option>'
                    );
                });
                $('#screen-select')
                    .append(screenList)
                    .prop('disabled', false)
                    .selectpicker('refresh');
                initDone();
            });
        },
        update: function (hashArgs) {
            var dtrpSince = page.dateTimeRangePicker.min();
            var dtrpTill = page.dateTimeRangePicker.max();

            $('#screen-select')
                .selectpicker('val', hashArgs.screenid ? hashArgs.screenid[0] : '');

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
        },
        update: function (hashArgs) {
            var selScreen = screens.filter(function (s) {
                return hashArgs.screenid && hashArgs.screenid[0] === s.screenid
            })[0];
            var tArr = [];
            var tbody = '';
            selScreen.screenitems.forEach(function (si) {
                if (!tArr[si.y]) {
                    tArr[si.y] = [];
                }
                tArr[si.y][si.x] = si;
            });
            tArr.forEach(function (row) {
                tbody += '<tr>';
                row.forEach(function (td) {
                    tbody += (
                        '<td   colspan="' + td.colspan +
                            '" rowspan="' + td.rowspan +
                            '" height="' + td.height +
                            '" width="' + td.width +
                            '" data-resourcetype="' + td.resourcetype +
                            '" data-resourceid="' + td.resourceid +
                            '">' +
                            '<h4 class="text-center"></h4>' +
                            '<div></div>' +
                        '</td>'
                    );
                });
                tbody += '</tr>';
            });
            $('#screen-name').text(selScreen.name);
            $('#screens tbody').html(tbody);
        }
    };
    var graph = {
        init: function (initDone) {
            var _this = this;
            var graphids = [];
            var graphGet;
            $('[data-resourcetype=0]')
                .each(function () {
                    var $this = $(this);
                    var graphid = $this.data('resourceid');
                    $this.children('div')
                        .attr('id', 'graphid-' + graphid);
                    graphids.push(graphid);
                });
            graphGet = zapi.req('graph.get', {
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
            graphGet.done(function (zapiResponse) {
                var graphs = zapiResponse.result;
                graphs = graphs.map(function (g) {
                    var gItems = [];
                    g.gitems.forEach(function (gi) {
                        var item = g.items.filter(function (i) {
                            return gi.itemid === i.itemid
                        })[0];
                        gItems[gi.sortorder] = $.extend({}, gi, item);
                    });
                    $('[data-resourcetype="0"][data-resourceid="' + g.graphid + '"] h4')
                        .text(g.hosts[0].name + ': ' + g.name);
                    return $.extend({
                        idSel: 'graphid-' + g.graphid,
                        thumbnail: false,
                        form: 'Monitoring/Screens',
                        trends: true,
                        gItems: gItems
                    }, g);
                });
                _this.data = graphs;
                graphs.forEach(function (graph) {
                    chartLib.init(graph);
                });
                initDone();
            });

        },
        update: function (hashArgs) {
            var graphs = this.data;
            graphs.forEach(function (graph) {
                // Add fake deffered object for zapi requests to 
                // always pass multiple Deferred objects to jQuery.when()
                var deferred = new $.Deferred();
                var histReqArray = [ deferred ];
                graph.gItems.map(function (item) {
                    histReqArray.push(
                        zapi.req((graph.trends ? 'trends' : 'history') + '.get', {
                            itemids: item.itemid || 0,
                            history: item.value_type,
                            time_from: graph.since && Date.now()/1000-86400,
                            time_till: graph.till
                        })
                    );
                });
                $.when.apply(null, histReqArray).done(function() {
                    // extract all responses except fake deferred
                    var args = Array.prototype.slice.call(arguments, 1);
                    var data = args.map(function (zapiResponse) {
                        return zapiResponse[0].result
                    });
                    chartLib.load(data, graph);
                });
                deferred.resolve(false);
            });
        }
    };

    //Page external methods
    var init = function(hashArgs) {
        var chartLibName = hashArgs.chartLib ? hashArgs.chartLib[0] : zabimin.chartLib;
        var deferredRequire = $.Deferred();
        var deferredFilter = $.Deferred();
        require(['chartLib/' + chartLibName], function (lib) {
            chartLib = lib;
            deferredRequire.resolve();
        })

        filter.init(function () {
            deferredFilter.resolve();
        });
        $.when(deferredRequire, deferredFilter)
            .then(function () {
                update(hashArgs);
            });
        table.init();
    };
    var update = function(hashArgs) {
        filter.update(hashArgs);
        table.update(hashArgs);
        if (hashArgs.screenid && hashArgs.screenid[0] !== screenid) {
            graph.init(function () {
                graph.update(hashArgs);
            });
        } else {
            graph.update(hashArgs);
        }
    };


    //Page common functions
    
    return {
        init: init,
        update: update
    }
});
