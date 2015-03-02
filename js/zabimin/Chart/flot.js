//http://www.flotcharts.org/
define(['Util', 'flot.time', 'flot.resize', 'flot.stack', 'flot.crosshair'], function(util) {
    "use strict";

    var data;
    var options;
    var chart;

    var init = function(chartProp) {
        chart = chartProp;
        $('#'+chart.idSel)
            .html([
                '<div id="flot-chart" class="chart"></div>',
                '<div id="flot-legend" class="col-xs-12"></div>'
            ].join(''))

        options = {
            legend: {
                show: !chart.thumbnail,
                //labelFormatter: null or (fn: string, series object -> string)
                //labelBoxBorderColor: color
                //noColumns: 2
                //position: "ne" or "nw" or "se" or "sw"
                //margin: number of pixels or [x margin, y margin]
                //backgroundColor: null or color
                //backgroundOpacity: number between 0 and 1
                container: $('#flot-legend'),
                sorted: "reverse"
            },
            xaxes: [ 
                { 
                    show: chart.thumbnail ? false : null,
                    mode: "time" 
                } 
            ],
            yaxes: [
                {
                    show: !chart.thumbnail,
                    min: chart.yMinType === 'fixed' ? chart.yAxisMin : null,
                    max: chart.yMaxType === 'fixed' ? chart.yAxisMax : null,
                    tickFormatter: function(val, axis) {
                        var v = util.showUnit(val, chart.yAxisUnits.left)
                        return v.join('')
                    }
                }, {
                    show: chart.thumbnail ? false : null,
                    position: 'right',
                    min: chart.yMinType === 'fixed' ? chart.yAxisMin : null,
                    max: chart.yMaxType === 'fixed' ? chart.yAxisMax : null,
                    tickFormatter: function(val, axis) {
                        var v = util.showUnit(val, chart.yAxisUnits.right)
                        return v.join('')
                    }
                }
            ],
            series: {
                stack: chart.type === 'stacked'
            },
            crosshair: {
                mode: chart.thumbnail ? null : "x"
            },
            grid: {
                //background: '#f0f0f0',
                hoverable: true
            },
            //cursor:{ 
            //    //show: !briefChart,
            //    style: '',
            //    zoom:true, 
            //    //showTooltip: true,
            //    //tooltipLocation: 'nw',
            //    //followMouse: true,
            //    //showTooltipUnitPosition: false,
            //    //showTooltipDataPosition: true,
            //    showVerticalLine: true,
            //    constrainZoomTo: 'x'
            //},
            ////legend: {
            ////    show: true,
            ////    renderer: $.jqplot.EnhancedLegendRenderer
            ////    //placement: 'outsideGrid',
            ////},
            //axesDefaults:{
            //    //show: undefined,
            //    //showTicks: !briefChart,
            //    autoscale: true,
            //    //pad: 1,
            //    //padMin: 0,
            //    //padMax: 0,
            //    rendererOptions: {
            //        // align ticks for each axis across the grid
            //        alignTicks: true
            //    }
            //}, 
            //axes: { 
            //    xaxis: { 
            //        //renderer: $.jqplot.DateAxisRenderer,
            //        tickOptions: {
            //            showGridline: briefChart,
            //            formatString: '%R'
            //        }
            //    }, 
            ////    yaxis: { 
            ////        min: chart.prop.ymin_type == 1 ? +chart.prop.yaxismin : undefined,
            ////        max: chart.prop.ymax_type == 1 ? +chart.prop.yaxismax : undefined,
            ////        tickOptions: {
            ////            showGridline: !briefChart,
            ////        } 
            ////    },
            //}, 
            //seriesDefaults: {
            //    shadow: false,
            //    rendererOptions: {
            //        highlightMouseOver: false
            //    },
            //    showMarker: false,
            //    //fill: true,
            //},
            //series: series
        };
    };
    var draw = function() {
        $('#flot-chart')
            .removeClass('hidden')
            .plot(data, options);
        //$("#flot-chart").bind("plothover",  function (event, pos, item) {
        //    console.log(pos);
        //    if (!updateLegendTimeout) {
        //        var updateLegendTimeout = setTimeout(updateLegend, 100);
        //    }
        //});
    };
    var load = function(rawData) {
        data = chart.items.map(function(gItem, i) {
            var gItemData = rawData[i].map(function(d) {
                return [d.clock * 1000, d.value ? +d.value : +d.value_avg]
            });
            return {
                label: gItem.name,
                color: gItem.color && '#' + gItem.color,
                units: gItem.units,
                data: gItemData,
                yaxis: gItem.yaxisside === 'right' ? 2 : 1,
                lines: {
                    //lineWidth: gItem.drawtype === 'bold line' ? 2 : null,
                    fill: gItem.drawtype === 'gradient line' || chart.type === 'stacked',
                    fillColor: {
                        colors: [
                            { opacity: gItem.drawtype === 'gradient line' ? 0.2 : 0.8 },
                            { opacity: 0.8 } 
                        ]
                    }
                }
            }
        })
    };
    var destroy = function() {
        var flot = $('#flot-chart')
            .data('plot')
        if (flot) {
            flot.shutdown();
        }
    };

    return {
        init: init,
        draw: draw,
        load: load,
        destroy: destroy
    }
})
