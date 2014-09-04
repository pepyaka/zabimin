"use strict";

var chart = {
}
// Get graph data
chart.getData = function(graphReq) {
    var timeFrom = (Date.now()/1000>>0) - 60*60*24
    var chartData = {};
    chartData.type = graphReq.type,
    chartData.div = graphReq.div,
    chartData.timeFrom = timeFrom
    var graphGet = {
        method: "graph.get",
        params: {
            output: "extend",
            filter: { 
                host: graphReq.host || "noHost",
                name: graphReq.graph || "noName"
            },
            selectItems: "extend",
            selectHosts: "extend",
            selectGraphItems: "extend",
            expandName: true
        }
    }
    util.zapi([graphGet], function(zapiResponse) {
        chartData.prop = zapiResponse[0].result[0]
        var graphItemReq = [],
            historyGet = {
                method: 'history.get',
                params: {
                    output: 'extend',
                    //sortfield: 'itemid',
                    time_from: timeFrom
                }
            }
        
        if (graphReq.type == 'trends') {
            historyGet.method = 'trends.get'
        }
        if (graphReq.type == 'thumbnail') {
            historyGet.method = 'trends.get'
        }
        $.each(chartData.prop.items, function(i, item) {
            graphItemReq.push(
                $.extend(true,
                    {},
                    historyGet, 
                    {
                        params: {
                            itemids: item.itemid,
                            history: item.value_type
                        }
                    }
                )
            )
        });
        // fetch graph items data for chart
        util.zapi(graphItemReq, function(zapiData) {
            if (zapiData[0].result[0]) {
                chartData.data = zapiData
                // Create graph itself
                //nvd3Charts(graphData)
                //rickshawGraph(graphData)
                chart[zabimin.chartLib](chartData)
                //chart.amcharts(chartData)
            } else {
                console.warn("Empty zapi results:", zapiData)
            }
        });
    });
}

// jqplot charts
chart.jqplot = function(chart) {
/*
    var zapi = {
        graph: {
            graphtype: [
                { lineAlpha: 1 }, //normal
                { stackSeries: true }, //stacked
                {}, //pie
                {}  //exploded
            ],
            ymax_type: [
                {}, //"(default) calculated"
                {}, //"fixed"
                {} //"item"
            ],
            ymin_type: [
                {}, //"(default) calculated"
                {}, //"fixed"
                {} //"item"
            ]
        },
        graphItem: {
            drawtype: [// Draw style of the graph item
                { lineThickness: 1 }, //line
                { fillAlphas: 0.8 }, // filled region
                { lineThickness: 2 }, // bold line
                { dashLength: 1 }, // dot
                { dashLength: 3 }, // dashed line
                { fillAlphas: 0.5 } // gradient line
            ],
            
            yaxisside: [// Side of the graph where the graph item's Y scale will be drawn
                { valueAxis: 'left' }, //0 - (default) left side
                { valueAxis: 'right' }  //1 - right side
            ]
        },
        item: {
            units: {
                B: { //B (byte), which are divided by 1024.
                },
                Bps: { //Bps (bytes per second) units, which are divided by 1024.
                },
                unixtime: { //translated to “yyyy.mm.dd hh:mm:ss”
                },
                uptime: { //translated to “hh:mm:ss” or “N days, hh:mm:ss”
                },
                s: { //translated to “yyy mmm ddd hhh mmm sss ms”; parameter is treated as number of seconds.
                }
            }
        }
    }
*/

    var briefChart = chart.type == 'thumbnail'
    //Set jqplot graph options
    var jqplotOptions = {
        stackSeries: chart.prop.graphtype == 1,
        //title: !briefChart ? chart.prop.name : undefined,
        title: {
            text: chart.prop.name,
        },
        cursor:{ 
            show: !briefChart,
            style: '',
            zoom:true, 
            //showTooltip: true,
            //tooltipLocation: 'nw',
            //followMouse: true,
            //showTooltipUnitPosition: false,
            //showTooltipDataPosition: true,
            showVerticalLine: true,
            constrainZoomTo: 'x'
        },
        legend: briefChart ? undefined : {
            show: true,
            renderer: $.jqplot.EnhancedLegendRenderer
            //placement: 'outsideGrid',
        },
        axesDefaults:{
            show: briefChart ? false : undefined,
            showTicks: !briefChart,
            autoscale: true,
            //pad: 1,
            //padMin: 0,
            //padMax: 0,
            rendererOptions: {
                // align ticks for each axis across the grid
                alignTicks: true
            }
        }, 
        axes: { 
            xaxis: { 
                renderer: $.jqplot.DateAxisRenderer,
                tickOptions: {
                    showGridline: briefChart,
                    formatString: '%X'
                }
            }, 
            yaxis: { 
                min: chart.prop.ymin_type == 1 ? +chart.prop.yaxismin : undefined,
                max: chart.prop.ymax_type == 1 ? +chart.prop.yaxismax : undefined,
                tickOptions: {
                    showGridline: !briefChart,
                } 
            },
        }, 
        seriesDefaults: {
            rendererOptions: {
                highlightMouseOver: false
            },
            showMarker: false,
            //fill: true,
        },
        series: []
    };
    // init jqplot data array
    var jqplotData = [];
    var interval = 60;
    var data = [];
    // prepare data
    $.each(chart.data, function(i, itemData) {
        // prepare jqplotData array for further using
        jqplotData.push([])
        // get item and graphic item properties
        var itemid = itemData.request.itemids;
        var itemProp = $.grep(chart.prop.items, function(item) {
            return item.itemid == itemid
        })[0]
        var gitemProp = $.grep(chart.prop.gitems, function(gitem) {
            var ss = gitem.itemid == itemid
            //return gitem.itemid == itemid
            return ss
        })[0]
        if (chart.type != 'thumbnail') {
            // if ever one y2axis exist? we must create it
            if (gitemProp.yaxisside == 1) {
                var seriesYaxis = 'y2axis';
                jqplotOptions.axes.y2axis = $.extend(true,
                    {},
                    jqplotOptions.axes.yaxis,
                    {
                        tickOptions: {
                            formatter: function(format, val) {
                                return util.createMetricPrefix(val, itemProp.units)+itemProp.units
                            }
                        }
                    }
                )
            } else {
                var seriesYaxis = 'yaxis'
                jqplotOptions.axes.yaxis.tickOptions.formatter = function(format, val) {
                    return util.createMetricPrefix(val, itemProp.units)+itemProp.units
                }
            }
        }
        // options for each series
        jqplotOptions.series[gitemProp.sortorder] = {
            label: itemProp.name,
            color: '#' + gitemProp.color,
            yaxis: seriesYaxis,
            fill: jqplotOptions.stackSeries || gitemProp.drawtype == 5,
            fillAlpha: jqplotOptions.stackSeries ? 0.8 : 0.5
        };
        // create series dataset
        $.each(itemData.result, function(i, sample) {
            // we need integer division
            var stepTimeItem = (sample.clock - chart.timeFrom) / interval >>0
            if (! data[stepTimeItem]) {
                data[stepTimeItem] = new Array(chart.data.length)
            }
            sample.date = new Date(sample.clock*1000)
            data[stepTimeItem][gitemProp.sortorder] = sample
        });
    })
    //if (true) {
    if (jqplotOptions.stackSeries) {
        $.each(data, function(stepTimeItem, sampleArr) {
            if (sampleArr) {
                // check if values for all items exist
                var realLength = $.grep(sampleArr, function(dataPoint) {
                    return dataPoint
                })
                if (sampleArr.length == realLength.length) {
                    $.each(sampleArr, function(i, dataPoint) {
                        var x = (chart.timeFrom - (chart.timeFrom % interval) + stepTimeItem * interval) * 1000,
                            y = chart.type == 'thumbnail' ? +dataPoint.value_avg : +dataPoint.value
                        jqplotData[i].push([x, y])
                    })
                }
            }
        })
    } else {
        $.each(data, function(stepTimeItem, sampleArr) {
            if (sampleArr) {
                $.each(sampleArr, function(i, dataPoint) {
                    if (dataPoint) {
                        var x = dataPoint.clock * 1000,
                            y = chart.type == 'thumbnail' ? +dataPoint.value_avg : +dataPoint.value
                        jqplotData[i].push([x, y])
                    }
                })
            }
        })
    }
    jqplotOptions.axes.xaxis.min = jqplotData[0][0][0]
    jqplotOptions.axes.xaxis.max = jqplotData[0][jqplotData[0].length -1][0]
    console.log(jqplotOptions.title.text, jqplotData)
    $('#'+chart.div).empty()
    $.jqplot(chart.div, jqplotData, jqplotOptions)
}
     
// http://amcharts.com
chart.amcharts = function(chart) {
    // mapping zabbix api to amcharts
    var zapiGraph = {
        graphtype: [
            { lineAlpha: 1 }, //normal
            { fillAlphas: 0.8 }, //stacked
            {}, //pie
            {}  //exploded
        ]
    }
    var zapiGraphItem = {
        // Draw style of the graph item
        drawtype: [
            { lineThickness: 1 }, //line
            { fillAlphas: 0.8 }, // filled region
            { lineThickness: 2 }, // bold line
            { dashLength: 1 }, // dot
            { dashLength: 3 }, // dashed line
            { fillAlphas: 0.5 } // gradient line
        ],
        // Side of the graph where the graph item's Y scale will be drawn
        yaxisside: [
            { valueAxis: 'left' }, //0 - (default) left side
            { valueAxis: 'right' }  //1 - right side
        ]
    }
    var zapiItem = {
        units: {
            B: { //B (byte), Bps (bytes per second) units, which are divided by 1024.
                prefixesOfBigNumbers: [
                    { number: Math.pow(2, 10), prefix:"K" },
                    { number: Math.pow(2, 20), prefix:"M" },
                    { number: Math.pow(2, 30), prefix:"G" },
                    { number: Math.pow(2, 40), prefix:"T" },
                    { number: Math.pow(2, 50), prefix:"P" },
                    { number: Math.pow(2, 60), prefix:"E" },
                    { number: Math.pow(2, 70), prefix:"Z" },
                    { number: Math.pow(2, 80), prefix:"Y" },
                ]
            },
            Bps: {
                prefixesOfBigNumbers: [
                    { number: Math.pow(2, 10), prefix:"K" },
                    { number: Math.pow(2, 20), prefix:"M" },
                    { number: Math.pow(2, 30), prefix:"G" },
                    { number: Math.pow(2, 40), prefix:"T" },
                    { number: Math.pow(2, 50), prefix:"P" },
                    { number: Math.pow(2, 60), prefix:"E" },
                    { number: Math.pow(2, 70), prefix:"Z" },
                    { number: Math.pow(2, 80), prefix:"Y" },
                ]
            },
            unixtime: { //translated to “yyyy.mm.dd hh:mm:ss”
            },
            uptime: { //translated to “hh:mm:ss” or “N days, hh:mm:ss”
            },
            s: { //translated to “yyy mmm ddd hhh mmm sss ms”; parameter is treated as number of seconds.
            }
        }
    }

    // amcharts config (data set apply lately)
    var chartConf = {
        pathToImages: "img/amcharts/",
        type: 'serial',
        categoryField: 'date',
        usePrefixes: true,
        titles: [{
            text: chart.prop.name,
        }],
        categoryAxis: {
            minPeriod: 'ss',
            parseDates: true
        },
        legend: {
            //valueText: ''
            //periodValueText: '[[value]]'
            valueFunction: function(GraphDataItem, formattedtext) {
                //console.log(GraphDataItem, formattedtext)
                return formattedtext
            }
        },
        chartCursor: {
            adjustment: 1,
            //valueBalloonsEnabled: false,
            //oneBalloonOnly: true,
            categoryBalloonAlpha: 0.7,
            categoryBalloonDateFormat: 'YYYY MMM D HH:NN:SS',
            cursorAlpha: 0.7,
            showNextAvailable: true,
            animationDuration: 0,
            //bulletsEnabled: true,
            fullWidth: true,
            //cursorPosition: 'mouse'
        },
        chartScrollbar: {
            color: "FFFFFF"
        },
        valueAxes: [ // zabbix can't recognize more then 2 data axis
            {
                id: 'left',
                position: 'left',
                labelsEnabled: chart.type != 'thumbnail'
            }, {
                id: 'right',
                position: 'right',
                labelsEnabled: chart.type != 'thumbnail'
            }
        ],
        graphs: [],
        dataProvider: []
    }

    // zabbix api graph type ['normal', 'stacked', 'pie', 'exploded']
    // amcharts stack type differ then zabbix's
    if (chart.prop.graphtype == 1) {
        // stacked type '100%' if units in '%'and max chart value 100
        var p = $.grep(chart.prop.items, function(i) {
            return i.units == '%'
        })
        chartConf.valueAxes[0].stackType = (chart.prop.yaxismax == 100 && p.length > 0) ? '100%' : 'regular'
    } else {
        chartConf.valueAxes[0].stackType = 'none'
    }

    // prepare data
    var dataObj = {}, dataArray = [], data = [], balloonText = [];
    $.each(chart.data, function(i, itemData) {
        // get item and graphic item properties
        var itemid = itemData.request.itemids;
        var itemProp = $.grep(chart.prop.items, function(item) {
            return item.itemid == itemid
        })[0]
        var gitemProp = $.grep(chart.prop.gitems, function(gitem) {
            return gitem.itemid == itemid
        })[0]

        // value axis label defined by last item properties
        chartConf.valueAxes[gitemProp.yaxisside].labelFunction = function(value, valueText, valueAxis) {
            return util.createMetricPrefix(value, itemProp.units) + itemProp.units
        }

        // baloon text array for all items
        balloonText[gitemProp.sortorder] = itemProp.name+':<b>[['+itemProp.name+']]</b>'
        // graph prop merging
        chartConf.graphs[gitemProp.sortorder] = $.extend(
            { 
                type: 'smoothedLine',
                minDistance: 5, // Increase for best perfomance
            },
            zapiGraph.graphtype[chart.prop.graphtype],
            zapiGraphItem.drawtype[gitemProp.drawtype], 
            zapiGraphItem.yaxisside[gitemProp.yaxisside], 
            {
                id: itemProp.itemid,
                title: itemProp.name,
                lineColor: "#"+gitemProp.color,
                valueField: itemProp.name,
                zapiItemUnits: itemProp.units
            }
        )
        // create series dataset
        // 2 ways for stackable and non-stackable data
        // find if any stacka
        if (chartConf.valueAxes[0].stackType == 'none') {
            $.each(itemData.result, function(i, point) {
                var dateAxis = point.clock;
                // Create equally data lenght time ticks
                dataObj[dateAxis] = dataObj[dateAxis] || new Array(chart.data.length)
                dataObj[dateAxis][gitemProp.sortorder] = (chart.type == 'thumbnail') ? +point.value_avg : +point.value
            });
        } else {
            $.each(itemData.result, function(i, point) {
                // If stacked charts we need equal time ticks for all series.
                // round to time points with "delay" interval
                var dateAxis = point.clock - (point.clock % itemProp.delay)
                // Create equally data lenght time ticks
                dataObj[dateAxis] = dataObj[dateAxis] || new Array(chart.data.length)
                //dataObj[dateAxis][gitemProp.sortorder] = +point.value
                dataObj[dateAxis][gitemProp.sortorder] = (chart.type == 'thumbnail') ? +point.value_avg : +point.value
            });
        }
    });
    /*
    // Convert object to array for time sorting
    $.each(dataObj, function(dk, dv) {
        //var dva = $.grep(dv, function(v) {
        //    return typeof v != 'undefined'
        //});
        // only add data if all datapoints at same tick
        //if (dva.length == chart.data.length) {
            dataArray.push([dk].concat(dv))
        //} else {
        //    console.log(dk, dva)
        //}
    });
    dataArray.sort(function(a, b) {
        return a[0] - b[0]
    });
    //dataArray.reverse()
    */
    // fill main data array
    $.each(dataObj, function(k, v) {
        var tObj = {
            date: new Date(k * 1000)
        }
        $.each(v, function(i, value) {
            tObj[chartConf.graphs[i].valueField] = value
        });
        data.push(tObj)
    });
/*
    // Add same text to baloon for all graphs
    $.each(chartConf.graphs, function(i, graph) {
        //graph.balloonText = balloonText.join('<br>')
        graph.balloonFunction = function(GraphDataItem, AmGraph) {
            //console.log(GraphDataItem, AmGraph)
            var balloonText = [];
            $.each(GraphDataItem.dataContext, function(k, v) {
                if (k != 'date') {
                    if (v) balloonText.push(k + ': ' + util.createMetricPrefix(v) + graph.zapiItemUnits )
                }
            })
            return balloonText.join('<br>')
        }
    })
*/
    chartConf.dataProvider = data;
    if (chart.type == 'thumbnail') {
        //delete chartConf.titles
        delete chartConf.legend
        delete chartConf.chartCursor
        delete chartConf.chartScrollbar
        chartConf.categoryAxis.labelsEnabled = false
    }
    console.log('amchartsChartData', chartConf)
    AmCharts.makeChart(chart.div, chartConf)
}

// http://dygraphs.com/
chart.dygraphs = function(graphData) {
    /* data should look like:
     * [
     *    [ new Date("2009/07/12"), 100, 200 ],
     *    [ new Date("2009/07/19"), 150, 220 ]
     * ]
     */
}
chart.xcharts = function(graphData) {
    /* data should look like:
     *{
     *  "xScale": "ordinal",
     *  "yScale": "linear",
     *  "type": "bar",
     *  "main": [
     *    {
     *      "className": ".pizza",
     *      "data": [
     *        {
     *          "x": "Pepperoni",
     *          "y": 12
     *        },
     *        {
     *          "x": "Cheese",
     *          "y": 8
     *        }
     *      ]
     *    }
     *  ],
     *  "comp": [
     *    {
     *      "className": ".pizza",
     *      "type": "line-dotted",
     *      "data": [
     *        {
     *          "x": "Pepperoni",
     *          "y": 10
     *        },
     *        {
     *          "x": "Cheese",
     *          "y": 4
     *        }
     *      ]
     *    }
     *  ]
     *}
     */
    var xchartsData = {
        main: [
            {
                data: []
            }
        ]
    }
    function prepareData(data) {
        $.each(data, function(i, series) {
            $.each(series, function(i, point) {
                xchartsData.main[0].data.push({
                    x: point.clock,
                    y: point.value
                });
            });
        });
    }
}
chart.rickshaw = function(graphData) {
    var rickshawSeries = [];
    // prepare data
    $.each(graphData.data, function(i, itemData) {
        // get item and graphic item properties
        var itemid = itemData.request.itemids;
        var itemProp = $.grep(graphData.prop.items, function(item) {
            return item.itemid == itemid
        })
        var gitemProp = $.grep(graphData.prop.gitems, function(gitem) {
            return gitem.itemid == itemid
        })
        // create series dataset
        var data = [];
        $.each(itemData.result, function(i, point) {
            data.push({
                x: point.clock * 1000,
                y: parseFloat(point.value)
            });
        });
        rickshawSeries.push({
            name: itemProp[0].name,
            //color: gitemProp[0].color,
            data: data
        });
    });
    console.log("rickshawSeries", rickshawSeries)
    /*
        var rickshawGraph = new Rickshaw.Graph({
                element: document.querySelector("#xchart-3"),
                renderer: 'line',
                width: 580,
                height: 250,
                series: rickshawSeries
        });
    */
    var seriesData = [ [], [], [] ];
    var random = new Rickshaw.Fixtures.RandomData(150);
    
    for (var i = 0; i < 150; i++) {
        random.addData(seriesData);
    }
    
    // instantiate our graph!
    
    var graph = new Rickshaw.Graph( {
        element: document.getElementById("xchart-3"),
        width: 960,
        height: 500,
        renderer: 'line',
        series: rickshawSeries
    } );
    
    graph.render();
    
    var hoverDetail = new Rickshaw.Graph.HoverDetail({
        graph: graph,
        formatter: function(series, x, y) {
            var date = '<span class="date">' + new Date(x * 1000).toUTCString() + '</span>';
            var swatch = '<span class="detail_swatch" style="background-color: ' + series.color + '"></span>';
            var content = swatch + series.name + ": " + parseInt(y) + '<br>' + date;
            return content;
        }
    });
}
// http://nvd3.org/
chart.nvd3 = function(graphData) {
    // create initiate graph data
    var graph = {
        name: graphData.prop.name,
        gitems: []
    };
    // iterate over graph items
    $.each(graphData.prop.gitems, function(i, gitem) {
        //delete unneeded properties
        delete gitem.graphs
        // find items for graph items
        var items = $.grep(graphData.prop.items, function(item) {
            return item.itemid == gitem.itemid
        });
        gitem.item = items[0]
        // find item serial data for each item
        $.each(graphData.data, function(i, itemSerial) {
            var itemValues = [];
            $.each(itemSerial, function(i, itemPoint) {
                if (gitem.itemid == itemPoint.itemid) {
                    itemValues.push([itemPoint.clock * 1000, itemPoint.value])
                }
            });
            if (itemValues != 0) {
                gitem.values = itemValues
            }
        });
        gitem.key = gitem.item.name
        graph.gitems.push(gitem)
    });
    console.log("graph", graph)
    //var myData = graph.gitems
    var myData = [{},{}];
    myData[0].key = "Ping"
    myData[0].yAxis = 1
    myData[0].type = "line"
    myData[0].values = graphData.data[0]
    myData[1].key = "Ping 2"
    myData[1].yAxis = 2
    myData[1].type = "area"
    myData[1].values = graphData.data[1]
    $.each(myData, function(i, md) {
        $.each(md.values, function(i, d) {
            d.x = d.clock * 1000
            delete d.clock
            d.y = d.value
            delete d.value
        });
    });
   /* 
    testdata[0].type = "area"
    testdata[0].yAxis = 1
    testdata[1].type = "area"
    testdata[1].yAxis = 1
    testdata[2].type = "line"
    testdata[2].yAxis = 1
    testdata[3].type = "line"
    testdata[3].yAxis = 2
    testdata[4].type = "bar"
    testdata[4].yAxis = 2
    testdata[5].type = "bar"
    testdata[5].yAxis = 2
    testdata[6].type = "bar"
    testdata[6].yAxis = 2
    */
    console.log(myData)
    nv.addGraph(function() {
        var chart = nv.models.multiChart()
            .margin({top: 30, right: 60, bottom: 50, left: 70})
            .color(d3.scale.category10().range())
            //.x(function(d) { return d.clock })
            //.y(function(d) { return d.value })
            ;
    
        chart.xAxis
            .tickFormat(function(d) {
                //var dx = data[0].values[d] && data[0].values[d][0] || 0;
                return d3.time.format('%X')(new Date(d))
            })
            ;
        chart.yAxis1
            .tickFormat(d3.format('%'))
            ;
    
        chart.yAxis2
            .tickFormat(d3.format('.3f'))
            ;
    
        d3.select('#xchart-3')
            .datum(myData)
            .transition()
            .duration(500)
            .call(chart);
    
        nv.utils.windowResize(chart.update);
        return chart;
    });
}
