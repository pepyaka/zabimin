define(['Page', 'Zapi', 'jquery', 'bootstrap'], function(Page, zapi) {
    'use strict';

    $(document).ready(function () {

        $('#user-name')
            .text(localStorage.name + ' ' + localStorage.surname);

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
