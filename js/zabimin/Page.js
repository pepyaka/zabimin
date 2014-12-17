define(['Util', 'bootstrap-select', 'bootstrap-datetimepicker'], function(Util) {
    "use strict";

    var current;
    //  Function for load content from url and put in $('#ajaxPage') block
    var load = function () {
        var action;
        var hash = Util.hash();
        // Dashboard on empty page
        hash.page = hash.page || 'Monitoring/Dashboard';
        // Check if we have same page    
        if (hash.page === current) {
            action = 'update';
        } else {
            action = 'init';
            current = hash.page;
        };
        //load html firstly for events binding
        require(['text!html/' + hash.page + '.html'],
            function(html) {
                anyPageInit(html)
                require(['Page/' + hash.page], function(page) {
                    page[action] && page[action](hash.args);
                });
            },
            function(err) {
                require(['text!html/404.html'], function(html) {
                    anyPageInit(html);
                });
            }
        );
    };
    function anyPageInit(data) {
        $('#ajaxPage')
            .spin('off')
            .html(data);
        // Load classes for ajax pages
        // selectors on every page must look nicely first. need to fix
        //$('.selectpicker').selectpicker()
        $('.datetimepicker').datetimepicker({
            useCurrent: false,
            language: localStorage.lang
        })
    };

    return {
        current: current,
        load: load
    }
});
