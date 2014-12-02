"use strict";

$("form").submit( function(event) {
    event.preventDefault();
    username = $("form :text").val()
    password = $("form :password").val()
    var params = {
        user: username,
        password: password
    };
    var zapiLogin = Zapi('user.login', params);
    zapiLogin.done(function(loginData) {
        $.each(loginData.result, function(key, value) {
            if ($.isPlainObject(value)) {
                localStorage[key] = JSON.stringify(value)
            } else {
                localStorage[key] = value
            }
        });
        window.location = document.referrer
    });
});

