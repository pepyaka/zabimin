//http://c3js.org/
define(['c3'], function(c3) {
    "use strict";


    var c3Chart;

    var init = function(chart, idSel) {
        var data = {
            order: null,
            xs: {},
            names: {},
            types: {},
            colors: {},
            axes: {},
            groups: [[]],
            columns: []
        };
        chart.gItems.forEach(function (gItem, i) {
            data.names[gItem.itemid] = gItem.name;
            data.colors[gItem.itemid] = '#' + gItem.color;
            data.types[gItem.itemid] = (gItem.drawtype === '1' || gItem.drawtype === '5') ? 'area' : 'line';
            data.axes[gItem.itemid] = gItem.yaxisside === '1' ? 'y2' : 'y';
            if (chart.graphtype === '1') {
                data.groups[0].push(gItem.itemid);
            } else {
            }
                data.xs[gItem.itemid] = 'clock_' + gItem.itemid;
            //data.columns.push([gItem.itemid])

        });
        c3Chart = c3.generate({
            bindto: '#' + idSel,
            data: data,
            axis: {
                x: {
                    show: !chart.thumbnail,
                    type: 'timeseries',
                    tick: {
                        format: '%H:%M:%S'
                    }
                },
                y: {
                    show: !chart.thumbnail,
                    tick: {
                        format: d3.format('s')
                    },
                    max: chart.ymax_type === '1' && chart.yaxismax,
                    min: chart.ymin_type === '1' && chart.yaxisin
                },
                y2: {
                    show: Object.keys(data.axes).some(function (k) {
                        return data.axes[k] === 'y2'
                    }) && !chart.thumbnail,
                    tick: {
                        format: d3.format('s')
                    },
                    max: chart.ymax_type === '1' && chart.yaxismax,
                    min: chart.ymin_type === '1' && chart.yaxisin
                }
            },
            legend: {
                show: !chart.thumbnail
            },
            tooltip: {
                show: !chart.thumbnail
            },
            point: {
                show: false
            },
            zoom: {
                //enabled: true
            },
            subchart: {
                //show: true
            }
        });
    };
    var load = function(data) {
        var columnsX = [];
        var columnsY = [];
        data.forEach(function (i) {
            var x = ['clock_' + i[0].itemid];
            var y = [i[0].itemid];
            i.forEach(function (d) {
                x.push(d.clock * 1000);
                y.push(d.value || d.value_avg);
            });
            //columns.push(x, y);
            columnsX.push(x);
            columnsY.push(y);
        });
        var columns = columnsY.concat(columnsX);
            c3Chart.load({
                columns: columns,
                order: null
            });
    };
    var draw = function(chart) {
    };
    return {
        init: init,
        load: load,
        draw: draw
    }
})
