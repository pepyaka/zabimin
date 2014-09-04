'use strict';

$(document).ready(function(){
    // Add user welcome message
    $('#user-menu')
        .append(localStorage.name+' '+localStorage.surname+'<b class="caret"></b>');
    // Ajax pages on hash url changes
    $(window).on("hashchange", function() {
        page.load()
    })
    // initial page load
    page.load()
});


/**************** Может пригодиться ***********************/
/*
// http://fgnass.github.io/spin.js/
var spinnerConf = {
  lines: 13, // The number of lines to draw
  length: 20, // The length of each line
  width: 10, // The line thickness
  radius: 30, // The radius of the inner circle
  corners: 1, // Corner roundness (0..1)
  rotate: 0, // The rotation offset
  direction: 1, // 1: clockwise, -1: counterclockwise
  className: 'spinner', // The CSS class to assign to the spinner
  zIndex: 2e9, // The z-index (defaults to 2000000000)
  top: '50%', // Top position relative to parent
  left: '50%' // Left position relative to parent
};
var target = document.getElementById('foo');
var spinner = new Spinner(opts).spin(target);
*/
