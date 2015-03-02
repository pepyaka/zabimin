require.config({
    baseUrl: 'js/zabimin',
    paths: { 
        //RequireJS plugins
        'text': ['//cdnjs.cloudflare.com/ajax/libs/require-text/2.0.12/text'],
        //Common libs
        'jquery': ['//code.jquery.com/jquery-2.1.1', 'lib/jquery.min'],
        'moment': ['//cdnjs.cloudflare.com/ajax/libs/moment.js/2.8.4/moment-with-locales.min'],
        'typeahead': ['//cdnjs.cloudflare.com/ajax/libs/typeahead.js/0.10.4/typeahead.bundle.min'],
        'bootstrap': ['//maxcdn.bootstrapcdn.com/bootstrap/3.3.1/js/bootstrap', 'libs/bootstrap.min'],
        'bootstrap-select': ['//cdnjs.cloudflare.com/ajax/libs/bootstrap-select/1.6.3/js/bootstrap-select'],//http://silviomoreto.github.io/bootstrap-select/
        'bootstrap-datetimepicker': ['//cdnjs.cloudflare.com/ajax/libs/bootstrap-datetimepicker/4.0.0/js/bootstrap-datetimepicker.min'],//http://eonasdan.github.io/bootstrap-datetimepicker/
        'bootstrap-table': ['//cdnjs.cloudflare.com/ajax/libs/bootstrap-table/1.6.0/bootstrap-table.min'], //http://bootstrap-table.wenzhixin.net.cn/
        'jqplot': ['//cdnjs.cloudflare.com/ajax/libs/jqPlot/1.0.8/jquery.jqplot.min'],
        'jqplot.cursor': ['//cdn.jsdelivr.net/jqplot/1.0.8/plugins/jqplot.cursor'],
        'jqplot.highlighter': ['//cdn.jsdelivr.net/jqplot/1.0.8/plugins/jqplot.highlighter'],
        'jqplot.dateAxisRenderer': ['//cdn.jsdelivr.net/jqplot/1.0.8/plugins/jqplot.dateAxisRenderer'],
        'jqplot.enhancedLegendRenderer': ['//cdn.jsdelivr.net/jqplot/1.0.8/plugins/jqplot.enhancedLegendRenderer'],
        'flot': ['//cdnjs.cloudflare.com/ajax/libs/flot/0.8.3/jquery.flot'],
        'flot.time': ['//cdnjs.cloudflare.com/ajax/libs/flot/0.8.3/jquery.flot.time'],
        'flot.resize': ['//cdnjs.cloudflare.com/ajax/libs/flot/0.8.3/jquery.flot.resize'],
        'flot.stack': ['//cdnjs.cloudflare.com/ajax/libs/flot/0.8.3/jquery.flot.stack'],
        'flot.crosshair': ['//cdnjs.cloudflare.com/ajax/libs/flot/0.8.3/jquery.flot.crosshair'],
        'amcharts'          : '//cdn.amcharts.com/lib/3/amcharts',
        'amcharts.funnel'   : '//cdn.amcharts.com/lib/3/funnel',
        'amcharts.gauge'    : '//cdn.amcharts.com/lib/3/gauge',
        'amcharts.pie'      : '//cdn.amcharts.com/lib/3/pie',
        'amcharts.radar'    : '//cdn.amcharts.com/lib/3/radar',
        'amcharts.serial'   : '//cdn.amcharts.com/lib/3/serial',
        'amcharts.xy'       : '//cdn.amcharts.com/lib/3/xy',
        'd3': ['//cdnjs.cloudflare.com/ajax/libs/d3/3.5.3/d3'],
        'rickshaw': ['//cdnjs.cloudflare.com/ajax/libs/rickshaw/1.5.1/rickshaw'],
        'Flotr2': ['../../dist/Flotr2/flotr2'],
        'underscore': ['//cdnjs.cloudflare.com/ajax/libs/underscore.js/1.7.0/underscore'],
        'bean': ['//cdnjs.cloudflare.com/ajax/libs/bean/1.0.15/bean'],
        'xcharts': ['../../dist/xcharts-build/xcharts'],
        'select2': ['//cdnjs.cloudflare.com/ajax/libs/select2/4.0.0-beta.3/js/select2.min'],
        // Separate paths for html,css, etc.
        'html': ['../../html'],
        'css': ['../../css'],
    },
    shim: {
        'jqplot': ['jquery'],
        'jqplot.cursor': ['jqplot'],
        'jqplot.highlighter': ['jqplot'],
        'jqplot.dateAxisRenderer': ['jqplot'],
        'jqplot.enhancedLegendRenderer': ['jqplot'],
        'flot': ['jquery'],
        'flot.time': ['flot'],
        'flot.resize': ['flot'],
        'flot.stack': ['flot'],
        'flot.crosshair': ['flot'],
        'Flotr2': ['underscore', 'bean'],
        'rickshaw': ['d3', 'jquery'],
        'xcharts': ['d3'],
        'datatables': ['jquery'],
        'datatables.bootstrap': ['datatables'],
        'bootstrap': ['jquery'],
        'bootstrap-datetimepicker': ['jquery', 'moment', 'bootstrap'],
        'bootstrap-select': ['bootstrap'],
        'bootstrap-table': ['jquery', 'bootstrap'],
        'amcharts.funnel'   : {
            deps: ['amcharts'],
            exports: 'AmCharts',
            init: function() {
                AmCharts.isReady = true;
            }
        },
        'amcharts.gauge'    : {
            deps: ['amcharts'],
            exports: 'AmCharts',
            init: function() {
                AmCharts.isReady = true;
            }
        },
        'amcharts.pie'      : {
            deps: ['amcharts'],
            exports: 'AmCharts',
            init: function() {
                AmCharts.isReady = true;
            }
        },
        'amcharts.radar'    : {
            deps: ['amcharts'],
            exports: 'AmCharts',
            init: function() {
                AmCharts.isReady = true;
            }
        },
        'amcharts.serial'   : {
            deps: ['amcharts'],
            exports: 'AmCharts',
            init: function() {
                AmCharts.isReady = true;
            }
        },
        'amcharts.xy'       : {
            deps: ['amcharts'],
            exports: 'AmCharts',
            init: function() {
                AmCharts.isReady = true;
            }
        }
    },
    config: {
        moment: {
            noGlobal: true
        }
    }
});

require(['main'], function() {
});

// Hack for moment js 
define(['moment'], function(moment) {
    moment.locale('ru');
    return moment;
});
