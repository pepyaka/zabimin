"use strict";

var Zapi = (function() {
    var id = 0;
    var defaults = {
        user: {
            login: {
                user: 'Guest',
                password: '',
                userData: true
            }
        },
        host: {
            get: {
                output: 'extend',
                selectGroups: 'extend',
                selectGraphs: 'extend',
                sortfield: 'name'
            }
        },
        trigger: {
            get: {
                output: 'extend',
                selectHosts: 'extend',
                sortfield: 'lastchange',
                sortorder: 'DESC',
                expandComment: true,
                expandDescription: true,
                expandExpression: true
            }
        },
        event: {
            get: {
                output: 'extend',
                selectHosts: 'extend',
                //selectRelatedObject: 'extend',
                //select_alerts: 'extend',
                //select_acknowledges: 'extend'
                sortfield: 'clock',
                sortorder: 'DESC'
            }
        }
    };
    var settings = {
        url: zabimin.api.url,
        type: "POST",
        contentType: 'application/json-rpc',
        dataType: 'json',
        cache: false,
        processData: false,
    };
    var loginSettings = {
        async: false,
        success: function(loginData) {
            $.extend(localStorage, loginData.result);
        }
    };
    //// Zabbix API with multi request support
    //function zapi(zapiReqs, allReqSuccessful, eitherOneHasError) {
    //    var ajaxReqs = [], zapiData = [];
    //    $.each(zapiReqs, function(i, req) {
    //        var reqData = { jsonrpc: "2.0" };
    //        reqData.method = req.method
    //        // try to login
    //        if (req.method == "user.login") {
    //            reqData.id = 0
    //            reqData.params = {
    //                user: req.params.user,
    //                password: req.params.password,
    //                userData: true
    //            }
    //        } else {
    //            reqData.id = 1
    //            reqData.params = req.params
    //            if (localStorage.sessionid == undefined) {
    //                window.location = "login.html"
    //            }
    //            reqData.auth = localStorage.sessionid
    //        }
    //        var jqxhr = $.ajax({
    //            url: zabimin.api.url,
    //            type: "POST",
    //            contentType: 'application/json-rpc',
    //            dataType: 'json',
    //            cache: false,
    //            processData: false,
    //            data: JSON.stringify(reqData)
    //        });
    //        ajaxReqs.push(
    //            jqxhr.done(function(zapiResponse) {
    //                zapiData.push({
    //                    method: reqData.method,
    //                    request: reqData.params,
    //                    result: zapiResponse.result
    //                })
    //            })
    //        );
    //    });
    //    // The reason that .apply is needed is because $.when can take multiple arguments,
    //    // but not an array of arguments.
    //    $.when.apply(undefined, ajaxReqs).then(
    //        function() {
    //            console.log("zapi response: ", zapiData)
    //            allReqSuccessful(zapiData)
    //        },
    //        function() {
    //            eitherOneHasError(zapiData)
    //        }
    //    );
    //}
    function zapi(method, params, extSettings) {
        var req = {
            jsonrpc: "2.0",
            method: method
        };
        var m = method.split('.', 2)
        var defaultParams = defaults[m[0]] && defaults[m[0]][m[1]] || {}
        req.params = $.extend({}, defaultParams, params)
        $.extend(settings, extSettings)
        if (req.method === 'user.login') {
            id = 0;
        } else {
            if (!localStorage.sessionid) {
                zapi('user.login', null, loginSettings)
            }
            id++;
        }
        req.id = id;
        req.auth = localStorage.sessionid;
        settings.data = JSON.stringify(req);
        return $.ajax(settings)
    };
    
    zapi.id = id;
    return zapi
})();

var apiMap = {
    event: {
        object: [
            ['Trigger'],
            [, 'Discovered Host', 'Discovered service'],
            [,,, 'Auto-registred host'],
            ['Trigger',,,, 'Item', 'LLD rule']
        ],
        source: [
            'Trigger',
            'Discovery rule',
            'Auto registration',
            'Internal event'
        ],
        value: [
            ['OK', 'Problem'],
            ['Up', 'Down', 'Discovered', 'Lost'],
            ,
            ['Normal', 'Unknown']
        ],
        acknowledged: ['No', 'Yes']
    },
    trigger: {
        priority: [
            'Not classified',
            'Information',
            'Warning',
            'Average',
            'High',
            'Disaster'
        ]
    },
    hostinterface: {
        type: [
            'Agent',
            'SNMP',
            'IPMI',
            'JMX'
        ]
    }
};
Object.freeze(apiMap)//change apiMap to read-only
