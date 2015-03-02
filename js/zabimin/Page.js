define(['Util'], function(util) {
    "use strict";

    var current;
    //  Function for load content from url and put in $('#ajaxPage') block
    var load = function () {
        var hash = util.hash();
        // Dashboard on empty page
        hash.page = hash.page || 'Monitoring/Dashboard';
        //load html firstly for events binding
        require(['text!html/' + hash.page + '.html'],
            function(html) {
                require(['Page/' + hash.page], function(page) {
                    // Check if we have same page    
                    if (hash.page === current) {
                        page.update && page.update(hash.args);
                    } else {
                        current = hash.page;
                        $('#ajaxPage')
                            .removeClass('spinner')
                            .html(html);
                        page.init && page.init(hash.args);
                    };
                });
            },
            function(err) {
                require(['text!html/404.html'], function(html) {
                    anyPageInit(html);
                });
            }
        );
    };

    return {
        current: current,
        load: load
    }
});
