"use strict";

var Zapi = (function() {
    var id = 0;
    var host = {
        get: function(params) {
            var defaults = {
                output: 'extend',
                selectGroups: 'extend',
                selectGraphs: 'extend',
                sortfield: 'name'
            };
            return zapiReq('host.get', $.extend({}, defaults, params))
        }
    };
    var trigger = {
        get: function(params, allReqSuccessful, eitherOneHasError) {
            var req = {
                method: 'trigger.get',
                params: {
                    output: 'extend',
                    selectHosts: 'extend',
                    sortfield: 'lastchange',
                    sortorder: 'DESC',
                    expandComment: true,
                    expandDescription: true,
                    expandExpression: true
                }
            };
            $.extend(req.params, params)
            zapi([req], allReqSuccessful, eitherOneHasError);
        }
    };
    var event = {
        get: {
            output: 'extend'
        }
    };
    // Zabbix API with multi request support
    function zapi(zapiReqs, allReqSuccessful, eitherOneHasError) {
        var ajaxReqs = [], zapiData = [];
        $.each(zapiReqs, function(i, req) {
            var reqData = { jsonrpc: "2.0" };
            reqData.method = req.method
            // try to login
            if (req.method == "user.login") {
                reqData.id = 0
                reqData.params = {
                    user: req.params.user,
                    password: req.params.password,
                    userData: true
                }
            } else {
                reqData.id = 1
                reqData.params = req.params
                if (localStorage.sessionid == undefined) {
                    window.location = "login.html"
                }
                reqData.auth = localStorage.sessionid
            }
            var jqxhr = $.ajax({
                url: zabimin.api.url,
                type: "POST",
                contentType: 'application/json-rpc',
                dataType: 'json',
                cache: false,
                processData: false,
                data: JSON.stringify(reqData)
            });
            ajaxReqs.push(
                jqxhr.done(function(zapiResponse) {
                    zapiData.push({
                        method: reqData.method,
                        request: reqData.params,
                        result: zapiResponse.result
                    })
                })
            );
        });
        // The reason that .apply is needed is because $.when can take multiple arguments,
        // but not an array of arguments.
        $.when.apply(undefined, ajaxReqs).then(
            function() {
                console.log("zapi response: ", zapiData)
                allReqSuccessful(zapiData)
            },
            function() {
                eitherOneHasError(zapiData)
            }
        );
    }
    function zapiReq(method, params, extSettings) {
        var req = {
            jsonrpc: "2.0",
            method: method,
            params: params,
            auth: localStorage.sessionid,
            id: id
        };
        var settings = {
            url: zabimin.api.url,
            type: "POST",
            contentType: 'application/json-rpc',
            dataType: 'json',
            cache: false,
            processData: false,
            data: JSON.stringify(req)
        };
        $.extend(settings, extSettings)
        if (req.method === 'user.login') {
            id = 0;
        } else {
            if (!localStorage.sessionid) {
                var loginSettings = {
                    async: false,
                    success: function(loginData) {
                        $.extend(localStorage, loginData.result);
                    }
                };
                zapiReq('user.login', {user: 'Guest', password: '', userData: true}, loginSettings)
            }
            id++;
        }
        return $.ajax(settings)
    };
    
    zapiReq.host = host;
    zapiReq.trigger = trigger;
    zapiReq.req = zapiReq;
    return zapiReq
})();
