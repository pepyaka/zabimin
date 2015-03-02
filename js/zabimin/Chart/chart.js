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
