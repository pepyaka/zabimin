//http://code.shutterstock.com/rickshaw/
define(['rickshaw', 'd3', 'Util'], function(Rickshaw, d3, util) {
    "use strict";

    var map = {
        series: {
            renderer: {
                'gradient line': 'area'
            }
        }
    };

    var init = function(chart) {
        var scales = {};
        var series = [];
        $('#'+chart.idSel)
            .html([
                '<div id="rickshaw-yAxixLeft" style="width:40px;display:inline-block;"></div>',
                '<div id="rickshaw-chart"></div>',
                '<div id="rickshaw-yAxixRight" style="width:40px;display:inline-block;"></div>'
            ].join(''))
        $.each(chart.items, function(i, gItem) {
            var a = gItem.drawtype === 'gradient line' ? 0.3 : 1;
            var min = Number.MIN_VALUE;
            var max = Number.MAX_VALUE;
            var data = gItem.data.map(function(d) {
                min = Math.min(min, d.value);
                max = Math.max(max, d.value);
                return {
                    x: +d.clock,
                    y: +d.value
                }
            });
            scales[gItem.yaxisside] = scales[gItem.yaxisside] || d3.scale.linear().domain([min, max]).nice()
            series[gItem.sortorder] = {
                color: 'rgba(' + util.hex2rgb(gItem.color).join(',') + ',' + a +')',
                name: gItem.name,
                renderer: map.series.renderer[gItem.drawtype] || 'line',
                scale: scales[gItem.sortorder],
                data: data
            }
        });
        //series.reverse();
        var graph = new Rickshaw.Graph( {
            //element: document.getElementById('rickshaw-'+chart.idSel), 
            element: document.getElementById('rickshaw-chart'), 
            renderer: chart.type === 'stacked' ? 'stack' : 'multi',
            series: series
        });
         
        new Rickshaw.Graph.HoverDetail( {
            graph: graph
        });
        //var legend = new Rickshaw.Graph.Legend( {
        //    graph: graph,
        //    element: document.getElementById('rickshawLegend-'+chart.idSel)
        //
        //});
        //var shelving = new Rickshaw.Graph.Behavior.Series.Toggle( {
        //    graph: graph,
        //    legend: legend
        //});
        new Rickshaw.Graph.Axis.Time( {
            graph: graph
        });
new Rickshaw.Graph.Axis.Y.Scaled({
  element: document.getElementById('rickshaw-yAxixLeft'),
  graph: graph,
  orientation: 'left',
  scale: scales.left,
  tickFormat: Rickshaw.Fixtures.Number.formatKMBT
});

if (scales.right) {
new Rickshaw.Graph.Axis.Y.Scaled({
  element: document.getElementById('rickshaw-yAxisRight'),
  graph: graph,
  grid: false,
  orientation: 'right',
  scale: scales.right,
  tickFormat: Rickshaw.Fixtures.Number.formatKMBT
});
}
        graph.render();
    };
    var reload = function(chart) {
    };
    return {
        init: init,
        reload: reload
    }
})
