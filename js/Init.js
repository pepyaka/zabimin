define(['Page', 'Zapi', 'jquery', 'bootstrap'], function(Page, zapi) {
    "use strict";

    // attach the .equals method to Array's prototype to call it on any array
    Array.prototype.equals = function (array, similar) {
        // if the other array is a falsy value, return
        if (!array)
            return false;
    
        // compare lengths - can save a lot of time 
        if (this.length != array.length)
            return false;
    
        for (var i = 0; i < this.length; i++) {
            // Check if we have nested arrays
            if (this[i] instanceof Array && array[i] instanceof Array) {
                // recurse into the nested arrays
                if (!this[i].equals(array[i], similar))
                    return false;
            }
            else if (!similar && this[i] != array[i]) {
                // Warning - two different object instances will never be equal: {x:20} != {x:20}
                return false;
            }
            else if (similar) {
                return this.sort().equals(array.sort(), true);
            }
        }
        return true;
    }

    $(document).ready(function () {

        //Check zabbix api version
        var apiInfo = zapi.req('apiinfo.version', {});
        apiInfo.done(function (zapiResponse) {
            var version = zapiResponse.result;
            $('#user-name')
                .text(localStorage.name + ' ' + localStorage.surname);
        })

        $('#modal-login-buttons button')
            .on('click', function () {
                var guest = $(this).data('login') === 'Guest'
                var login = zapi.req('user.login', {
                    user: guest ? 'Guest' : $('#modal-login-user').val(),
                    password: guest ? '' : $('#modal-login-password').val()
                });
                login.done(function (zapiResponse) {
                    if (zapiResponse.error) {
                        $('#modal-login .alert')
                            .append(zapiResponse.error.data)
                            .removeClass('hidden')
                    } else {
                        $.extend(localStorage, zapiResponse.result)
                        $('#modal-login').modal('hide')
                        location.reload()
                    }
                });
            });

        // Ajax pages on hash url changes
        $(window)
            .on("hashchange", function() {
                Page.load()
            })
            .trigger('hashchange');//initial page load

        function initGlobalSearch(hosts) {
            var hostGroups = [];
            var ip = [];
            $.each(hosts, function(i, host) {
                $.each(host.groups, function(i, group) {
                    hostGroups[group.groupid] = {
                        name: group.name,
                        id: group.groupid
                    };
                });
                $.each(host.interfaces, function(i, iface) {
                    ip.push({
                        ip: iface.ip,
                        type: zapi.map('Host interface', 'type', iface.type)
                    })
                });
            });
            hostGroups = hostGroups.filter(Boolean);
            $('#global-search input')
                .prop('disabled', false);
            initMultidataTypeahead(hosts, hostGroups, ip);

            //function initMultidataTypeahead(hosts, hostGroups, ip) {
            //    var hostsEngine = new Bloodhound({
            //      datumTokenizer: Bloodhound.tokenizers.obj.whitespace('host'),
            //      queryTokenizer: Bloodhound.tokenizers.whitespace,
            //      local: hosts
            //    });
            //    var hostGroupsEngine = new Bloodhound({
            //      datumTokenizer: Bloodhound.tokenizers.obj.whitespace('name'),
            //      queryTokenizer: Bloodhound.tokenizers.whitespace,
            //      local: hostGroups
            //    });
            //    var ipEngine = new Bloodhound({
            //      datumTokenizer: Bloodhound.tokenizers.obj.whitespace('ip'),
            //      queryTokenizer: Bloodhound.tokenizers.whitespace,
            //      local: ip
            //    });
            //     
            //    hostsEngine.initialize();         
            //    hostGroupsEngine.initialize();         
            //    ipEngine.initialize();         
            //    $('#globalSearch .typeahead')
            //        .typeahead({
            //            highlight: true,
            //        }, {
            //            name: 'hosts',
            //            displayKey: 'host',
            //            source: hostsEngine.ttAdapter(),
            //            templates: {
            //                header: '<span class="typeahead-multidata-group">Hosts</span>'
            //            }
            //        }, {
            //            name: 'hostGroups',
            //            displayKey: 'name',
            //            source: hostGroupsEngine.ttAdapter(),
            //            templates: {
            //                header: '<span class="typeahead-multidata-group">Host groups</span>'
            //            }
            //        }, {
            //            name: 'ip',
            //            displayKey: 'ip',
            //            source: ipEngine.ttAdapter(),
            //            templates: {
            //                header: '<span class="typeahead-multidata-group">ip</span>'
            //            }
            //        })
            //        .on('typeahead:selected', function(e, selObj, selGr) {
            //            console.log(selObj, selGr)
            //        });
            //};
        };
    });
});
