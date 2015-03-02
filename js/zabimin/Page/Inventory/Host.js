// Inventory/Host
define(['Zapi', 'Util', 'moment' ], function(zapi, Util, moment) {
    "use strict";
    var page = '#!Inventory/Host';

    var init = function(hash) {
        getHostInfo(hash);
    }
    var update = function(hash) {
        getHostInfo(hash);
    }
    
    function getHostInfo(hash) {
        var hostGet = zapi.req('host.get', {
            //output: [
            //    'host',
            //    'name'
            //],
            output: 'extend',
            hostids: hash.hostid,
            selectGroups: ['name'],
            selectApplications: ['name'],
            selectDiscoveries: ['name'],
            selectGraphs: ['name'],
            //selectDiscoveryRule: 'extend',
            selectHttpTests: ['name'],
            selectInterfaces: 'extend',
            selectInventory: 'extend',
            selectItems: ['name', 'itemid'],
            selectMacros: ['macro', 'value'],
            selectScreens: ['name'],
            selectTriggers: 'extend',
            search: {
                name: hash.name && hash.name[0], 
                host: hash.host && hash.host[0] 
            },
            limit: 1
        });
        hostGet.done(function(zapiResponse) {
            var host = zapiResponse.result[0];
            var invList = [];

            $('#host-name')
                .text(host.host)

            $('#visible-name')
                .text(host.name)

            //Host groups
            var groupList = host.groups.map(function(group) {
                return [
                    '<li class="ellipsis">',
                        '<a href="#!Inventory/Hosts&groupid='+group.groupid+'">',
                            group.name,
                        '</a>',
                    '</li>'
                ].join('')
            });
            $('#host-groups ul')
                .html(groupList.join(''));

            //Applications
            var appList = host.applications.map(function(app) {
                return [
                    '<li class="ellipsis">',
                        '<a href="#!Monitoring/Latest&host='+host.host+'&application='+app.name+'">',
                            app.name,
                        '</a>',
                    '</li>'
                ].join('')
            });
            $('#host-applications .badge')
                .text(host.applications.length)
                .data('content', '<ul class="list-unstyled">' + appList.join('') + '</ul>');

            //Discovery rules
            var dRuleList = host.discoveries.map(function(d) {
                return [
                    '<li>',
                        '<a href="#!Monitoring/Latest&host='+host.host+'&discoveries='+d.name+'">',
                            d.name,
                        '</a>',
                    '</li>'
                ].join('')
            });
            $('#host-discovery-rules .badge')
                .text(host.discoveries.length)
                .data('content', '<ul class="list-unstyled">' + dRuleList.join('') + '</ul>');

            //Graphs
            var graphList = host.graphs.map(function(graph) {
                return [
                    '<li class="ellipsis">',
                        '<a href="#!Monitoring/Graphs&hostid='+host.hostid+'&graphid='+graph.graphid+'">',
                            graph.name,
                        '</a>',
                    '</li>'
                ].join('')
            });
            $('#host-graphs .badge')
                .text(host.graphs.length)
                .data('content', '<ul class="list-unstyled">' + graphList.join('') + '</ul>');

            //Web
            if (host.httpTests.length > 0) {
                var webList = host.httpTests.map(function(web) {
                    return [
                        '<li class="text-nowrap">',
                            '<a href="#!Monitoring/Graph&host='+host.host+'&web='+web.name+'">',
                                web.name,
                            '</a>',
                        '</li>'
                    ].join('')
                });
                $('#host-web .badge')
                    .text(host.httpTests.length)
                    .data('content', '<ul class="list-unstyled">' + webList.join('') + '</ul>');
            } else {
                $('#host-web .badge')
                    .text(0)
            }
            
            //Items
            var itemsList = $.map(host.items, function(item) {
                return [
                    '<li class="text-nowrap">',
                        '<a href="#!Monitoring/Latest/Data&itemid='+item.itemid+'">',
                            item.name,
                        '</a>',
                    '</li>'
                ]
            });
            $('#host-items .badge')
                .empty()
                .append(host.items.length)
                .data('content', '<ul class="list-unstyled">' + itemsList.join('') + '</ul>');

            //Macros
            var macrosList = host.macros.map(function(m) {
                return [
                    '<dt>'+m.macro+'</dt>',
                    '<dd>'+m.value+'</dd>'
                ].join('')
            });
            $('#host-macros .badge')
                .text(host.macros.length)
                .data('content', '<dl>' + macrosList.join('') + '</dl>');

            //Screens
            var screenList = host.screens.map(function(s) {
                return [
                    '<li class="ellipsis">',
                        '<a href="#!Monitoring/Screen&screenid='+s.screenid+'">',
                            s.name,
                        '</a>',
                    '</li>'
                ].join('')
            });
            $('#host-screens .badge')
                .text(host.screens.length)
                .data('content', '<ul class="list-unstyled">' + screenList.join('') + '</ul>');

            //Triggers
            var triggerList = host.triggers.map(function(t) {
                return [
                    '<li class="text-nowrap">',
                        '<a href="#!Monitoring/Triggers&triggerids='+t.triggerid+'" title="'+t.description+'">',
                            t.description,
                        '</a>',
                    '</li>'
                ].join('')
            });
            $('#host-triggers .badge')
                .text(host.triggers.length)
                .data('content', '<ul class="list-unstyled">' + triggerList.join('') + '</ul>')
            
            host.interfaces.sort(function(a, b) {
                return a.type - b.type
            });
            var intfList = host.interfaces.map(function(intf) {
                return [
                    '<tr class="'+['','success','info','warning','danger'][intf.type]+'">',
                        '<td>'+zapi.map('Host interface', 'type', intf.type).value+'</td>',
                        '<td>'+intf.ip+'</td>',
                        '<td>'+intf.dns+'</td>',
                        '<td>'+zapi.map('Host interface', 'useip', intf.useip).value+'</td>',
                        '<td>'+intf.port+'</td>',
                        '<td>'+zapi.map('Host interface', 'main', intf.main).value+'</td>',
                    '</tr>'
                ].join('')
            });
            $('#host-interfaces tbody')
                .html(intfList.join(''));

            $.each(host.inventory, function(k, dd) {
                //var hi = zapi.obj.Host.inventory.values[k]
                var hi = zapi.map('Host', 'inventory', k).value
                hi.description && dd && invList.push('<dt>'+hi.description+'</dt><dd><pre>'+dd+'</pre></dd>');
            });
            $('#host-inventory')
                .html(invList.join(''));

            // Common actions
            $('#host-info [data-toggle="popover"]')
                .popover({
                    html: true,
                    viewport: '#host-info',
                });
            $('body').on('click', function (e) {
                $('[data-toggle="popover"]').each(function () {
                    //the 'is' for buttons that trigger popups
                    //the 'has' for icons within a button that triggers a popup
                    if (!$(this).is(e.target) && $(this).has(e.target).length === 0 && $('.popover').has(e.target).length === 0) {
                        $(this).popover('hide');
                    }
                });
            });
            
        });
    }
    
    return {
        init: init,
        update: update
    }
});
