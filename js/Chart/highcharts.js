//http://c3js.org/
define(['highstock'], function() {
    "use strict";


    var highChart;
    var chart;


    var init = function(graph) {
        chart = graph;
        var percentChart = chart.gItems.some(function (gItem) {
            return gItem.units === '%'
        });
        var twoSideChart = chart.gItems.some(function (gItem) {
            return gItem.yaxisside === '1'
        });
        percentChart = false
        highChart = {
            chart: {
                //zoomType: 'x',
                //minRange: 1000
                //minRange: 60 * 60 * 1000
            },
            credits: {
                enabled: !chart.thumbnail
            },
            legend: {
                enabled: !chart.thumbnail
            },
            tooltip: {
                enabled: !chart.thumbnail,
            },
            title: {
                text: null
            },
            scrollbar: {
                enabled : false
            },
            navigator: {
                enabled : !chart.thumbnail
            },
            rangeSelector: {
                enabled : !chart.thumbnail,
                buttons: [{
                    type: 'hour',
                    count: 1,
                    text: 'Hour'
                }, {
                    type: 'day',
                    count: 1,
                    text: 'Day'
                }, {
                    type: 'week',
                    count: 1,
                    text: 'Week'
                }, {
                    type: 'month',
                    text: 'Month'
                }, {
                    type: 'year',
                    count: 1,
                    text: 'Year'
                }, {
                    type: 'all',
                    text: 'All'
                }],
                selected: chart.trends ? 3 : 1
            },
            //xAxis: {
            //    type: 'datetime',
            //    labels: {
            //        enabled: !chart.thumbnail
            //    }
            //},
            yAxis: twoSideChart ? [
                {
                    reversedStacks: false,
                    opposite: false,
                    labels: {
                        enabled: !chart.thumbnail
                    },
                    title: {
                        text: null
                    },
                    max: chart.ymax_type === '1' ? +chart.yaxismax : null,
                    min: chart.ymin_type === '1' ? +chart.yaxismin : null
                }, {
                    labels: {
                        enabled: !chart.thumbnail
                    },
                    title: {
                        text: null
                    },
                    max: chart.ymax_type === '1' ? +chart.yaxismax : null,
                    min: chart.ymin_type === '1' ? +chart.yaxismin : null
                }
            ] : {
                reversedStacks: false,
                opposite: false,
                labels: {
                    enabled: !chart.thumbnail
                },
                title: {
                    text: null
                },
                max: chart.ymax_type === '1' ? +chart.yaxismax : null,
                min: chart.ymin_type === '1' ? +chart.yaxismin : null
            },
            plotOptions: {
                series: {
                    animation: !chart.thumbnail,
                    stacking: chart.graphtype === '1' ?
                        (percentChart ? 'percent' : 'normal') :
                        null,
                    fillOpacity: chart.graphtype === '1' ? 0.8 : 0.2,
                    marker: {
                        enabled: false,
                        states: {
                            hover: {
                                enabled: false
                            }
                        }
                    }
                }
            },
        };
    };
    var load = function(data) {
        var timeObj = {};
        var timeArr = [];
        var series = chart.gItems.map(function (gItem, i) {
            return {
                type: [
                    'line',
                    'area',
                    'line',
                    'line',
                    'line',
                    'area'
                ][gItem.drawtype],
                name: gItem.name,
                color: gItem.color ? '#' + gItem.color : null,
                yAxis: +gItem.yaxisside || 0,
                data: [],
            }
        });
        if (chart.graphtype === '1' && !chart.trends) {
            // on stacked chart all timestamp must be same
            data.forEach(function (iData, i) {
                var interval = +chart.gItems[i].delay || 3600;
                iData.forEach(function (d) {
                    var sec = d.clock  - (d.clock % interval);
                    if (timeObj[sec]) {
                        timeObj[sec][i] = d;
                    } else {
                        timeObj[sec] = [];
                        timeObj[sec][i] = d;
                    }
                });
            });
            Object.keys(timeObj).forEach(function (s) {
                timeArr.push({
                    ms: s * 1000,
                    items: timeObj[s]
                });
            });
            timeArr.sort(function(a, b) {
                return a.ms - b.ms
            });
            timeArr.forEach(function (p) {
                p.items.forEach(function (pd, i) {
                    series[i].data.push([
                        p.ms, 
                        typeof pd.value === 'undefined' ? +pd.value_avg : +pd.value
                    ]);
                })
            });
        } else {
            data.forEach(function (iData, i) {
                var v = typeof iData[0].value === 'undefined' ? 'value_avg' : 'value';
                iData.forEach(function (d) {
                    series[i].data.push([ d.clock * 1000, +d[v] ]);
                });
            });
        }
        highChart.series = series;
    };
    var draw = function(idSel) {
        $('#' + idSel)
            .highcharts("StockChart", highChart);
    };
    return {
        init: init,
        load: load,
        draw: draw
    }
})
