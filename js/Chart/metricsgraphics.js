//http://metricsgraphicsjs.org/
define(['d3', '/dist/metrics-graphics/dist/metricsgraphics.js'], function(d3, MG) {
    "use strict";

    var init = function(chart) {
        //add a multi-line chart
        var legend = chart.items.map(function(item) {
            return item.item.name
        });
        var data = chart.items.map(function(item) {
            var d = item.data.map(function(p) {
                return {
                    clock: new Date(p.clock * 1000),
                    value: p.value
                }
            });
            //return d
            return item.data
        });
        MG.data_graphic({
            title: chart.name,
            //description: "This line chart contains multiple lines.",
            data: data,
            full_height: true,
            full_width: true,
            width: 840,
            height: 480,
            max_y: null,
            target: '#' + chart.idSel,
            x_accessor: 'clock',
            y_accessor: 'value'
        })

    };
    var reload = function(chart) {
    };
    return {
        init: init,
        reload: reload
    }
})
