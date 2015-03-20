//http://nvd3.org/index.html
define(['d3', 'nvd3', 'moment'], function(d3, nv, moment) {
    "use strict";

    // Chart lib global variables
    var chart;
    var nvChart;
    var data = [];
    var options;

    // Chart methods
    var init = function(chartOpts, idSel) {
        chart = chartOpts;
        if (chart.graphtype === '1') {
            nvChart = nv.models.stackedAreaChart().options({
                useInteractiveGuideline: true,
                x: function (d) {
                    return d.clock
                },
                y: function (d) {
                    return d.value || d.value_avg
                }
            });
        } else {
            //nvChart = nv.models.multiChart().options({
            nvChart = nv.models.lineChart().options({
            //    showLegend: !chart.thumbnail,
            //    interactive: !chart.thumbnail,
            //    interactive: false,
            //    useInteractiveGuideline: true,
            //    showXAxis: !chart.thumbnail,
            //    showYAxis: !chart.thumbnail,
            //    x: function (d) {
            //        return +d.clock
            //    },
            //    y: function (d) {
            //        return +d.value || +d.value_avg
            //    }
            });
        }
        nvChart.xAxis     //Chart x-axis settings
            .tickFormat(function(d) {
                return moment(d, 'X').format('HH:mm')
            })
        //nvChart.yAxis1.tickFormat(d3.format(',.1f'));
        //nvChart.yAxis2.tickFormat(d3.format(',.1f'));

        //nvChart.yAxis     //Chart y-axis settings
        //    .axisLabel('Voltage (v)')
        //    .tickFormat(d3.format('.02f'));
        //nvChart.tooltip.enabled;
    };
    var load = function(rawData) {
        chart.gItems.forEach(function (gItem, i) {
            data[i] = {
                type: 'line',
                key: gItem.name,
                color: '#' + gItem.color,
                yAxis: gItem.yaxisside === '0' ? 1 : 2,
                values: rawData[i].map(function (d) {
                    return {
                        x: +d.clock,
                        y: +d.value || +d.value_avg
                    }
                }),
                area: gItem.drawtype === '1' || gItem.drawtype === '5'
            };
        });
    };
    var draw = function(idSel) {
        $('#' + idSel)
           .html('<svg height="100%" width="100%"></svg>')
        nv.addGraph(function() {
            d3.select('#' + idSel + ' svg') //Select the <svg> element you want to render the chart in.   
                .datum(data)                //Populate the <svg> element with chart data...
                .call(nvChart);             //Finally, render the chart!
            //Update the chart when window resizes.
            nv.utils.windowResize(function() { nvChart.update() });
            return nvChart;
        });
    };
    return {
        init: init,
        load: load,
        draw: draw
    }
})
