// http://amcharts.com
define(['amcharts.serial', 'Zapi', 'Util'], function(AmCharts, zapi, util) {
    "use strict";

    function init(chart) {
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
            pathToImages: 'http://www.amcharts.com/lib/3/images/',
            type: 'serial',
            categoryField: 'clock',
            usePrefixes: true,
            titles: [{
                text: chart.name,
            }],
            categoryAxis: {
                minPeriod: 'ss',
                parseDates: true,
                labelsEnabled: false
            },
            //legend: {
            //    //valueText: ''
            //    //periodValueText: '[[value]]'
            //    valueFunction: function(GraphDataItem, formattedtext) {
            //        //console.log(GraphDataItem, formattedtext)
            //        return formattedtext
            //    }
            //},
            //chartCursor: {
            //    adjustment: 1,
            //    //valueBalloonsEnabled: false,
            //    //oneBalloonOnly: true,
            //    categoryBalloonAlpha: 0.7,
            //    categoryBalloonDateFormat: 'YYYY MMM D HH:NN:SS',
            //    cursorAlpha: 0.7,
            //    showNextAvailable: true,
            //    animationDuration: 0,
            //    //bulletsEnabled: true,
            //    fullWidth: true,
            //    //cursorPosition: 'mouse'
            //},
            //chartScrollbar: {
            //    color: "FFFFFF"
            //},
            valueAxes: [ // zabbix can't recognize more then 2 data axis
                {
                    id: 'left',
                    position: 'left',
                    //labelsEnabled: chart.type != 'thumbnail'
                }, {
                    id: 'right',
                    position: 'right',
                    //labelsEnabled: chart.type != 'thumbnail'
                }
            ],
            graphs: [],
            dataProvider: []
        }
    
        // zabbix api graph type ['normal', 'stacked', 'pie', 'exploded']
        // amcharts stack type differ then zabbix's
        if (chart.type === 'stacked') {
            // stacked type '100%' if units in '%'and max chart value 100
            var p = $.grep(chart.prop.items, function(i) {
                return i.units == '%'
            })
            chartConf.valueAxes[0].stackType = (chart.prop.yaxismax == 100 && p.length > 0) ? '100%' : 'regular'
        } else {
            chartConf.valueAxes[0].stackType = 'none'
        }
    
        // prepare data
        $.each(chart.items, function(i, itemData) {
            chartConf.graphs.push({
                title: itemData.item.name,
                valueField: itemData.gitem.gitemid,
                valueAxis: zapi.map('Graph item', 'yaxisside', itemData.gitem.yaxisside).value
            });
            $.each(itemData.data, function(i, d) {
                var r = {clock: +d.clock}
                r[itemData.gitem.gitemid] = +d.value
                chartConf.dataProvider.push(r)
            });
        });
        console.log('amchartsChartData', chartConf)
        AmCharts.makeChart(chart.idSel, chartConf)
/*
var chart = AmCharts.makeChart("chart",{
    "type": "serial",
    "categoryField": "clock",
    "categoryAxis": {
        "gridPosition": "start",
                minPeriod: 'ss',
                parseDates: true,
    },
    "graphs": [
        {
            "title": "Graph title",
            "valueField": 24168
        }
    ],
    "valueAxes": [
        {
            "title": "Axis title"
        }
    ],

    "legend": {
        "useGraphSettings": true
    },
    "titles": [
        {
            "size": 15,
            "text": "Chart Title"
        }
    ],
    "dataProvider": chartConf.dataProvider
});
*/
    }
    
    return {
        init: init
    }
});
