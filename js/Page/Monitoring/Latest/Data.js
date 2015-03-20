define(['Zapi', 'Util', 'moment', 'config', 'bootstrap-datetimepicker', 'bootstrap-table'], function(zapi, util, moment, zabimin) {
    "use strict";

    var page = {
        addr: '#!Monitoring/Latest/Data',
        args: {
            itemid: [],
            type: null,
            till: null,
            since: null,
        },
        update: true
    };

    var filter = {
        init: function() {
            //Type selector
            $('#data-type')
                .on('click', 'button', function() {
                    var val = $(this).val();
                    page.update = false; //prevent update page on type change
                    util.hash({
                        type: val === 'graph' ? null : val
                    }, true);
                });
            //Datetime range selector
            $('.datetimepicker')
                .datetimepicker({
                    format: 'D MMM YYYY, H:mm',
                    stepping: 10,
                    maxDate: new Date(),
                    showClear: true,
                    icons: {
                        clear: 'glyphicon glyphicon-remove'
                    }
                });
            $('#since')
                .on("dp.hide", function () {
                    var since = $(this).data("DateTimePicker").date();
                    util.hash({since: since ? since.format('X') : null}, true);
                    $('#till')
                        .data("DateTimePicker")
                            .minDate(since || false);
                });
            $('#till')
                .on("dp.hide", function (e) {
                    var till = $(this).data("DateTimePicker").date();
                    util.hash({till: till ? till.format('X') : null}, true);
                    $('#since')
                        .data("DateTimePicker")
                            .maxDate(till || new Date());
                });
            $('#period-select')
                .on('click', 'button', function() {
                    var val = $(this).val();
                    util.hash({
                        since: val ? moment().subtract(1, val).format('X') : 0,
                        till: moment().format('X')
                    }, true);
                });
        },
        update: function(hash) {
            // Type selector
            var typeVal = hash.type ? hash.type[0] : 'graph';
            $('#data-type .btn')
                .removeClass('active')
            $('#data-type [value="' + typeVal + '"]')
                .addClass('active')
            // Datetime range selector
            $('#since')
                .data("DateTimePicker")
                    .date(hash.since && hash.since[0] != 0 ? moment(hash.since[0] * 1000) : null)
            $('#till')
                .data("DateTimePicker")
                    .date(hash.till ? moment(hash.till[0] * 1000) : null)
        }
    };
    var graph = {
        lib: null, //Defined on library load. Depend on config.
        init: function(items) {
            var graph = {
                idSel: 'graph',
                yAxisUnits: { left: '', right: '' },
                items: items
            }
            this.lib.init(graph)
        },
        load: function(data) {
            this.lib.load(data)
        },
        show: function() {
            $('#graph')
                .removeClass('hidden')
            this.lib.draw()
        },
        hide: function() {
            $('#graph')
                .addClass('hidden')
            this.lib.destroy()
        }
    };
    var table = {
        init: function(items) {
            var columns = [{
                field: 'Time',
                title: 'Time'
            }];
            this.items = items;
            items.forEach(function(item) {
                columns.push({
                    field: item.itemid,
                    title: item.units ? item.name+' ('+item.units+')' : item.name
                });
            });
            $('<table>')
                .bootstrapTable({
                    striped: true,
                    classes: 'table table-hover table-condensed',
                    //search: true,
                    //pagination: true,
                    //showRefresh: true,
                    //clickToSelect: true,
                    //showToggle: true,
                    //showColumns: true,
                    columns: columns
                })
                .appendTo('#table')
        },
        load: function(data) {
            var items = this.items;
            var tableData = [];
            var dataObj = {};
            items.forEach(function(item, i) {
                data[i].forEach(function(d) {
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
            $('#table table')
                .bootstrapTable('load', tableData)
        },
        show: function() {
            $('#table')
                .removeClass('hidden')
        },
        hide: function() {
            $('#table')
                .addClass('hidden')
        }
    };
    var text = {
        init: function(items) {
            this.items = items;
        },
        load: function(data) {
            var items = this.items;
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
            $('#text')
                .html('<pre>' + textData.join('\n') + '</pre>')
        },
        show: function() {
            $('#text')
                .removeClass('hidden')
        },
        hide: function() {
            $('#text')
                .addClass('hidden')
        }
    };

    var init = function(hashArgs) {
        filter.init();
        // Load chart library, then load history data
        require(['Chart/'+zabimin.chartLib], function(lib) {
            graph.lib = lib;
            update(hashArgs);
        });
    };
    var update = function(hashArgs) {
        filter.update(hashArgs)
        if (page.update) { // if hostids and/or dates changed
            getItemData(hashArgs, function(items) {
                // Compare arrays. Init only if itemid changed
                var a = hashArgs.itemid;
                var b = page.args.itemid;
                if (a.length !== b.length || a.some(function(v, i) { return v !== b[i] })) {
                    var title = items.map(function(i) {
                        return i.hosts[0].name + ': ' + i.name
                    });
                    if (title.length > 2) {
                        title = [title.length + ' Items']
                    }
                    $('#title')
                        .text(title.join(', '));
                    graph.init(items.map(function(i) {
                        i.name = i.hosts[0].name + ': ' + i.name;
                        return i
                    }));
                    table.init(items);
                    text.init(items);
                }
                page.args.itemid = hashArgs.itemid;
                getHistoryData(hashArgs, items, function(data) {
                    graph.load(data);
                    table.load(data);
                    text.load(data);
                    selectView(hashArgs);
                });
            });
        } else {
            selectView(hashArgs);
        }
        page.update = true;
    };

    function selectView(hashArgs) {
        if (hashArgs.type) {
            if (hashArgs.type[0] === 'table') {
                graph.hide();
                text.hide();
                table.show()
            }
            if (hashArgs.type[0] === 'text') {
                graph.hide();
                table.hide();
                text.show()
            }
        } else {
            table.hide();
            text.hide();
            graph.show()
        }
    }
    function getItemData(hashArgs, getItemDataDone) {
        var itemGet = zapi.req('item.get', {
            itemids: hashArgs.itemid || 0,
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
            getItemDataDone(zapiResponse.result)
        });
    };
    function getHistoryData(hash, items, getHistoryDataDone) {
        var histType = 'trends';
        var histReqArray = items.map(function(item) {
            var histGet = zapi.req(histType + '.get', {
                hostids: null,
                itemids: item.itemid,
                history: item.value_type,
                time_from: hash.since ? hash.since[0] : Date.now()/1000 - 68400,
                time_till: hash.till ? hash.till[0] : null
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

    return {
        init: init,
        update: update
    }
});
