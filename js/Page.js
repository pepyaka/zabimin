define(['Util'], function(util) {
    "use strict";

    var current;
    var timeoutId;
    var intervalId;

    //  Function for load content from url and put in $('#ajaxPage') block
    var load = function () {
        var hash = util.hash();
        //Page statistics
        util.visit.update(hash);
        // Dashboard on empty page
        if (!hash.page) {
             location.hash = '#!Monitoring/Dashboard';
             return
        }
        //load html firstly for events binding
        require(['text!html/' + hash.page + '.html'],
            function(html) {
                require(['Page/' + hash.page], function(page) {
                    // Check if we have same page    
                    if (hash.page === current) {
                        page.update && page.update(hash.args);
                    } else {
                        current = hash.page;

                        $('#ajax-page')
                            .removeClass('spinner')
                            .html(html);
                        $('#nav-title')
                            .text(hash.page.split('/').join(' / '));

                        //Reset any timers of previous page
                        window.clearTimeout(timeoutId);
                        timeoutId = page.timeoutId;
                        window.clearInterval(intervalId);
                        intervalId = page.intervalId;

                        page.init && page.init(hash.args);
                    };
                });
            },
            function(err) {
                require(['text!html/404.html'], function(html) {
                    $('#ajax-page')
                        .removeClass('spinner')
                        .html(html);
                });
            }
        );
    };

    return {
        current: current,
        load: load
    }
});
