require.config({
    paths: { 
        //RequireJS plugins
        'text': ['//cdnjs.cloudflare.com/ajax/libs/require-text/2.0.12/text'],

        //Common libs
        //http://jquery.com/
        'jquery': [
            '../dist/jquery/dist/jquery.min',
            '//code.jquery.com/jquery-2.1.3.min'
        ],
        //http://getbootstrap.com/
        'bootstrap': [
            '../dist/bootstrap/dist/js/bootstrap.min',
            '//maxcdn.bootstrapcdn.com/bootstrap/3.3.4/js/bootstrap.min'
        ],
        //http://momentjs.com/
        'moment': [
            '../dist/moment/min/moment-with-locales.min',
            '//cdnjs.cloudflare.com/ajax/libs/moment.js/2.9.0/moment-with-locales.min'
        ],
        //https://twitter.github.io/typeahead.js/
        'typeahead': [
            '../typeahead.js/dist/typeahead.bundle.min',
            '//cdnjs.cloudflare.com/ajax/libs/typeahead.js/0.10.5/typeahead.bundle.min'
        ],
        //http://silviomoreto.github.io/bootstrap-select/
        'bootstrap-select': [
            '../dist/bootstrap-select/dist/js/bootstrap-select.min',
            '//cdnjs.cloudflare.com/ajax/libs/bootstrap-select/1.6.3/js/bootstrap-select'
        ],
        //http://eonasdan.github.io/bootstrap-datetimepicker/
        'bootstrap-datetimepicker': [
            '../dist/bootstrap-datetimepicker/src/js/bootstrap-datetimepicker',
            '//cdnjs.cloudflare.com/ajax/libs/bootstrap-datetimepicker/4.7.14/js/bootstrap-datetimepicker.min'
        ],
        //http://bootstrap-table.wenzhixin.net.cn/       
        'bootstrap-table': [
            '../dist/bootstrap-table/src/bootstrap-table',
            '//cdnjs.cloudflare.com/ajax/libs/bootstrap-table/1.8.1/bootstrap-table.min'
        ],
        //https://github.com/dangrossman/bootstrap-daterangepicker
        'bootstrap-daterangepicker': [
            '//cdn.jsdelivr.net/bootstrap.daterangepicker/1.3.19/daterangepicker'
        ],
        //https://github.com/seiyria/bootstrap-slider
        'bootstrap-slider': [
            '../dist/bootstrap-slider/js/bootstrap-slider',
            '//cdn.rawgit.com/seiyria/bootstrap-slider/master/js/bootstrap-slider'
        ],
        //http://ecomfe.github.io/echarts/index-en.html
        'joint': [
            '//cdnjs.cloudflare.com/ajax/libs/jointjs/0.9.0/joint.min'
        ],
        //Chart libs
        //http://ecomfe.github.io/echarts/index-en.html
        'echarts': [
            '../dist/echarts/build/dist/echarts-all',
            '//cdnjs.cloudflare.com/ajax/libs/echarts/2.2.1/echarts-all'
        ],
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
        'Flotr2': ['../dist/Flotr2/flotr2'],
        'underscore': ['//cdnjs.cloudflare.com/ajax/libs/underscore.js/1.7.0/underscore'],
        'bean': ['//cdnjs.cloudflare.com/ajax/libs/bean/1.0.15/bean'],
        'xcharts': ['../dist/xcharts-build/xcharts'],
        'nvd3' : ['//cdnjs.cloudflare.com/ajax/libs/nvd3/1.7.0/nv.d3'],//http://nvd3.org/index.html
        'c3': ['//cdnjs.cloudflare.com/ajax/libs/c3/0.4.10/c3'],//http://c3js.org/
        'dc': ['//cdnjs.cloudflare.com/ajax/libs/dc/1.7.3/dc'],//http://dc-js.github.io/dc.js/
        'crossfilter': ['//cdnjs.cloudflare.com/ajax/libs/crossfilter/1.3.11/crossfilter.min'],//http://square.github.com/crossfilter/
        'highcharts': ['//code.highcharts.com/highcharts'],//http://www.highcharts.com/
        'highstock': ['//code.highcharts.com/stock/highstock'],//http://www.highcharts.com/
        // Separate paths for html
        'html': ['../html'],
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
        'bootstrap-slider': ['jquery', 'bootstrap'],
        'highstock': {
            exports: 'Highcharts',
            deps: ['jquery']
        },
        'highcharts': {
            exports: 'Highcharts',
            deps: ['jquery']
        },
        'nvd3': {
            deps: ['d3'],
            exports: 'nv'
        },
        'c3': ['d3'],
        'dc': ['d3', 'crossfilter'],
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
            noGlobal: true,
        }
    }
});

require(['Init'], function() {
});

// Hack for moment js 
define(['moment'], function(moment) {
    moment.locale(navigator.language);
    return moment;
});
