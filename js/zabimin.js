require.config({
    baseUrl: 'js/zabimin',
    paths: { 
        //RequireJS plugins
        'text': ['//cdnjs.cloudflare.com/ajax/libs/require-text/2.0.12/text'],
        //Common libs
        'jquery': ['//code.jquery.com/jquery-2.1.1.min', 'lib/jquery.min'],
        'moment': ['//cdnjs.cloudflare.com/ajax/libs/moment.js/2.8.4/moment-with-locales.min'],
        'typeahead': ['//cdnjs.cloudflare.com/ajax/libs/typeahead.js/0.10.4/typeahead.bundle.min'],
        'bootstrap': ['//maxcdn.bootstrapcdn.com/bootstrap/3.3.1/js/bootstrap.min', 'libs/bootstrap.min'],
        'bootstrap-select': ['//cdnjs.cloudflare.com/ajax/libs/bootstrap-select/1.6.3/js/bootstrap-select.min'],
        'bootstrap-datetimepicker': ['//cdnjs.cloudflare.com/ajax/libs/bootstrap-datetimepicker/3.1.3/js/bootstrap-datetimepicker.min'],
        'jquery.jqplot': ['//cdn.jsdelivr.net/jqplot/1.0.8/jquery.jqplot'],
        'jqplot.dateAxisRenderer': ['//cdn.jsdelivr.net/jqplot/1.0.8/plugins/jqplot.dateAxisRenderer'],
        'jqplot.cursor': ['//cdn.jsdelivr.net/jqplot/1.0.8/plugins/jqplot.cursor'],
        'jqplot.highlighter': ['//cdn.jsdelivr.net/jqplot/1.0.8/plugins/jqplot.highlighter'],
        'jqplot.enhancedLegendRenderer': ['//cdn.jsdelivr.net/jqplot/1.0.8/plugins/jqplot.enhancedLegendRenderer'],
        'amcharts': ['//cdnjs.cloudflare.com/ajax/libs/amcharts/3.10.0/amcharts'],
        'serial': ['//cdnjs.cloudflare.com/ajax/libs/amcharts/3.10.0/serial'],
        'spin': ['//cdnjs.cloudflare.com/ajax/libs/spin.js/2.0.1/spin.min'],
        'jquery.spin': ['//cdnjs.cloudflare.com/ajax/libs/spin.js/2.0.1/jquery.spin.min'],
        // Separate paths for html,css, etc.
        'html': ['/html'],
        'css': ['/css'],
    },
    shim: {
        'bootstrap': ['jquery'],
        'bootstrap-select': ['bootstrap'],
        'bootstrap-datetimepicker': ['bootstrap'],
        'jquery.spin': ['spin'],
    },
    config: {
        moment: {
            noGlobal: true
        }
    }
});

require(['main'], function() {
        console.log("Main loaded :)");    
});
