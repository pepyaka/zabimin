//http://www.jqplot.com/
define(['jqplot.dateAxisRenderer'], function() {
    "use strict";

    function init(chart) {
        var map = {
            series: {
                fill: {
                    'filled region': true,
                    'gradient line': true
                },
                fillAlpha: {
                    'filled region': 0.3,
                    'gradient line': 0.3
                },
                yaxis: {
                    'left': 'yaxis',
                    'right': 'y2axis'
                }
            }
        }

        var series = chart.items.map(function(i) {
            return {
                color: '#' + i.color,
                fill: chart.type === 'stacked' || map.series.fill[i.drawtype],
                fillAlpha: 0.7,
                yaxis: map.series.yaxis[i.yaxisside],
            }
        });
        var data = chart.items.map(function(gItem) {
            var gItemData = gItem.data.map(function(d) {
                return [d.clock * 1000, +d.value]
            });
            return gItemData
        });
        var briefChart = false
        $('#'+chart.idSel).empty()
        $.jqplot(chart.idSel, data, {
            title: chart.name,
            stackSeries: chart.type === 'stacked',
            grid: {
                background: '#f0f0f0',
            },
            cursor:{ 
                //show: !briefChart,
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
            //legend: {
            //    show: true,
            //    renderer: $.jqplot.EnhancedLegendRenderer
            //    //placement: 'outsideGrid',
            //},
            axesDefaults:{
                //show: undefined,
                //showTicks: !briefChart,
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
                        formatString: '%R'
                    }
                }, 
            //    yaxis: { 
            //        min: chart.prop.ymin_type == 1 ? +chart.prop.yaxismin : undefined,
            //        max: chart.prop.ymax_type == 1 ? +chart.prop.yaxismax : undefined,
            //        tickOptions: {
            //            showGridline: !briefChart,
            //        } 
            //    },
            }, 
            seriesDefaults: {
                shadow: false,
                rendererOptions: {
                    highlightMouseOver: false
                },
                showMarker: false,
                //fill: true,
            },
            series: series
        });
    };
    function reload() {
    };

    return {
        init: init,
        reload: reload
    }
});
