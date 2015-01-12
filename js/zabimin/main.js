define(['Page', 'Zapi', 'jquery'], function(Page, zapi) {
    'use strict';
    var login;

    $(document).ready(function(){
        $('#userMenu a span').text(localStorage.name + ' ' + localStorage.surname);
        $('#modalLoginBtn')
            .on('click', function(){
                login = zapi.req('user.login', {
                    user: $('#modalLoginUser').val(),
                    password: $('#modalLoginPassword').val()
                });
                login.done(loginDone);
            });
        $('#modalLoginAsGuestBtn')
            .on('click', function(){
                login = zapi.req('user.login', {
                    user: 'Guest',
                    password: ''
                });
                login.done(loginDone);
            });
        function loginDone(zapiResponse) {
            console.log(zapiResponse)
            if (zapiResponse.error) {
                $('#modalLogin .alert')
                    .append(zapiResponse.error.data)
                    .removeClass('hidden')
            } else {
                $.extend(localStorage, zapiResponse.result)
                $('#modalLogin').modal('hide')
                location.reload()
            }
        }

        // Ajax pages on hash url changes
        $(window).on("hashchange", function() {
            Page.load()
        })
        // initial page load
        Page.load()
    });
});
