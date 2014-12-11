define(['Page', 'jquery', 'jquery.spin'], function(Page) {
    'use strict';

    $(document).ready(function(){
        $('#ajaxPage').spin();
        $('#userMenu a span').text(localStorage.name + ' ' + localStorage.surname);
        // Ajax pages on hash url changes
        $(window).on("hashchange", function() {
            Page.load()
        })
        // initial page load
        Page.load()
    });
});
