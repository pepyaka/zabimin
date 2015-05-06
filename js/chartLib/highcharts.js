define(['highstock'], function() {
    "use strict";


    var lib = {
        url: 'http://www.highcharts.com/'
    };

    Highcharts.setOptions({
        global: {
            useUTC: false
        }
    });


    // Various chart looks like. Each form has own option and data converters
    var forms = {
        'Monitoring/Graphs: chart': {
            init: function (chart) {
                var percentChart = chart.gItems.some(function (gItem) {
                    return gItem.units === '%'
                });
                var twoSideChart = chart.gItems.some(function (gItem) {
                    return gItem.yaxisside === '1'
                });
                var opts = {
                    chart: {
                        zoomType: 'x',
                    },
                    navigator: {
                        enabled : false
                    },
                    rangeSelector: {
                        enabled : false,
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
                    yAxis: twoSideChart ? [
                        {
                            startOnTick: false,
                            endOnTick: false,
                            reversedStacks: false,
                            opposite: false,
                            max: chart.ymax_type === '1' ? +chart.yaxismax : null,
                            min: chart.ymin_type === '1' ? +chart.yaxismin : null
                        }, {
                            startOnTick: false,
                            endOnTick: false,
                            max: chart.ymax_type === '1' ? +chart.yaxismax : null,
                            min: chart.ymin_type === '1' ? +chart.yaxismin : null
                        }
                    ] : {
                        startOnTick: false,
                        endOnTick: false,
                        reversedStacks: false,
                        opposite: false,
                        max: chart.ymax_type === '1' ? +chart.yaxismax : null,
                        min: chart.ymin_type === '1' ? +chart.yaxismin : null
                    },
                    plotOptions: {
                        series: {
                            connectNulls: false,
                            dataGrouping: {
                                smoothed: true,
                                groupPixelWidth: 3,
                            },
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
                            },
                            states: {
                                hover: {
                                    enabled: false
                                }
                            }
                        }
                    },
                    series: chart.gItems.map(function (gItem, i) {
                        return {
                            type: [
                                'line',
                                'area',
                                'line',
                                'line',
                                'line',
                                'area'
                            ][gItem.drawtype],
                            itemid: gItem.itemid,
                            name: gItem.name,
                            color: gItem.color ? '#' + gItem.color : null,
                            yAxis: +gItem.yaxisside || 0,
                            data: [],
                        }
                    })
                };
                opts.stock = true;
                return opts
            },
            load: function (data, chart) {
                var timeObj = {};
                var timeArr = [];
                var series = [];
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
                        series[i] = [];
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
                        var dataArr = [];
                        p.items.forEach(function (pd, i) {
                            series[i].push([
                                p.ms, 
                                pd.value === undefined ? +pd.value_avg : +pd.value
                            ]);
                        })
                    });
                } else {
                    data.forEach(function (iData, i) {
                        var v = iData[0].value === undefined ? 'value_avg' : 'value';
                        var dataArr = [];
                        iData.forEach(function (d) {
                            dataArr.push([ d.clock * 1000, Number(d[v]) ]);
                        });
                        series[i] = dataArr;
                    });
                }
                return series
            }
        },
        'Monitoring/Graphs: thumbnail': {
            init: function (chart) {
                var percentChart = chart.gItems.some(function (gItem) {
                    return gItem.units === '%'
                });
                var twoSideChart = chart.gItems.some(function (gItem) {
                    return gItem.yaxisside === '1'
                });
                var opts = {
                    credits: {
                        enabled: false
                    },
                    legend: {
                        enabled: false
                    },
                    tooltip: {
                        enabled: false
                    },
                    scrollbar: {
                        enabled : false
                    },
                    navigator: {
                        enabled : false
                    },
                    rangeSelector: {
                        enabled : false,
                    },
                    xAxis: {
                        labels: {
                            enabled: false
                        }
                    },
                    yAxis: twoSideChart ? [
                        {
                            startOnTick: false,
                            endOnTick: false,
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
                            startOnTick: false,
                            endOnTick: false,
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
                        startOnTick: false,
                        endOnTick: false,
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
                            connectNulls: false,
                            dataGrouping: {
                                smoothed: true,
                                groupPixelWidth: 3,
                            },
                            animation: !chart.thumbnail,
                            enableMouseTracking: !chart.thumbnail,
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
                            },
                            states: {
                                hover: {
                                    enabled: false
                                }
                            }
                        }
                    },
                    series: chart.gItems &&
                        chart.gItems.map(function (gItem, i) {
                            return {
                                type: [
                                    'line',
                                    'area',
                                    'line',
                                    'line',
                                    'line',
                                    'area'
                                ][gItem.drawtype],
                                itemid: gItem.itemid,
                                name: gItem.name,
                                color: gItem.color ? '#' + gItem.color : null,
                                yAxis: +gItem.yaxisside || 0,
                                data: [],
                            }
                        })
                };
                opts.stock = true;
                return opts
            }
        },
        'Reports/Zabbix': {
            init: function (chart) {
                return {
                    chart: {
                        plotBackgroundColor: null,
                        plotBorderWidth: null,
                        plotShadow: false
                    },
                    credits: {
                        enabled: false
                    },
                    tooltip: {
                        pointFormat: '{point.percentage:.1f}%'
                    },
                    plotOptions: {
                        pie: {
                            allowPointSelect: true,
                            cursor: 'pointer',
                            dataLabels: {
                                enabled: true,
                                format: '<b>{point.name}</b>: {point.percentage:.1f} %',
                                style: {
                                    //color: (Highcharts.theme && Highcharts.theme.contrastTextColor) || 'black'
                                }
                            }
                        }
                    },
                    series: [{
                        type: 'pie',
                    }]
                }
            },
            load: function (data) {
                return [data]
            }
        },
        'Reports/Bar': {
            init: function (chart) {
                return {
                    chart: {
                        type: 'column'
                    },
                    title: {
                        text: null
                    },
                    xAxis: {
                        //type: 'datetime'
                        categories: chart.categories
                    },
                    tooltip: {
                        //headerFormat: '<span style="font-size:10px">{point.key}</span><table>',
                        //pointFormat: '<tr><td style="color:{series.color};padding:0">{series.name}: </td>' +
                        //    '<td style="padding:0"><b>{point.y:.1f} mm</b></td></tr>',
                        //footerFormat: '</table>',
                        //pointFormatter: function () {
                        //    return this.y.toLocaleString() + '<br>'
                        //},
                        shared: true,
                        //useHTML: true
                    },
                    plotOptions: {
                        column: {
                            //pointPlacement: 'between',
                            pointPadding: 0.2,
                            borderWidth: 0
                        }
                    },
                    series: chart.items.map(function (item) {
                        return {
                            name: item.hosts[0].name + ': ' + item.name
                        }
                    })
                };
            },
            load: function (data, chart) {
                return data.map(function (item, i) {
                    return item.map(function (d) {
                        return d[chart.items[i].func]
                    });
                });
            }
        },
        'dflt': {
            init: function () {
                return {}
            },
            load: function (data, chart) {
                return data
            }
        }
    };
    forms['Monitoring/Graphs: thumbnail'].load = forms['Monitoring/Graphs: chart'].load;
    forms['Monitoring/Screens'] = {
        init: forms['Monitoring/Graphs: chart'].init,
        load: forms['Monitoring/Graphs: chart'].load
    };
    forms['Monitoring/Latest/Data'] = {
        init: forms['Monitoring/Graphs: chart'].init,
        load: forms['Monitoring/Graphs: chart'].load
    };

    var init = function(chart) {
        var defaults = {
            title: {
                text: null
            }
        };
        var chartOpts = $.extend(forms[chart.form || 'dflt'].init(chart), defaults);
        $('#' + chart.idSel)
            .highcharts(chartOpts.stock ? 'StockChart' : 'Chart', chartOpts)
            .highcharts()
                .showLoading();
    };
    var load = function(data, chart) {
        var highChart = $('#' + chart.idSel).highcharts();
        var series = forms[chart.form || 'dflt'].load(data, chart);
        highChart.series.forEach(function (s, i) {
            s.setData(series[i], false);
        });
        highChart.hideLoading();
        highChart.redraw();
    };
    var redraw = function(idSel) {
        var oldChart = $('#' + idSel).highcharts();
        oldChart && oldChart.redraw();
    };
    var destroy = function(idSel) {
        var oldChart = $('#' + idSel).highcharts();
        oldChart && oldChart.destroy();
    };


    return {
        init: init,
        load: load,
        destroy: destroy,
        draw: redraw,
        redraw: redraw
    }
})
