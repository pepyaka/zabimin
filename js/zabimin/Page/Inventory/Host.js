// Inventory/Host
define(['Zapi', 'Util', 'moment' ], function(zapi, Util, moment) {
    "use strict";

    var pageArgs;//Permanent 

    var init = function(hashArgs) {
        pageArgs = $.extend({}, hashArgs);
        getHostInfo();
    }
    var update = function(hashArgs) {
        pageArgs = $.extend({}, hashArgs);
        getHostInfo();
    }
    
    function getHostInfo() {
        var req = {
            params: {
                //output: [
                //    'host',
                //    'name'
                //],
                output: 'extend',
                search: {
                    host: null
                },
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
            },
            map: {
                host: function(hosts) {
                    req.params.search.host = hosts[0];
                }
            }
        };
        $.each(pageArgs, function(k, v) {
            req.map[k] ? req.map[k](v) : req.params[k] = v;
        });
        var map = {
            interfaces: {
                tr: {
                    class: [
                        '',
                        'success',
                        'info',
                        'warning',
                        'danger'
                    ]
                }
            }
        }
        
        zapi.req('host.get', req.params).done(function(zapiResponse) {
console.log(req, zapiResponse.result)
            var host = zapiResponse.result[0];
            var groupList = [];
            var appList = [];
            var dRuleList = [];
            var graphList = [];
            var webList = [];
            var itemsList = [];
            var macrosList = [];
            var screenList = [];
            var triggerList = [];
            var intfList = [];
            var invList = [];

            $('#hostName')
                .empty()
                .append(host.host)

            $('#visibleName')
                .empty()
                .append(host.name)

            $.each(host.groups, function(i, group) {
                groupList.push('<li><a href="#!Inventory/Hosts&group='+group.name+'">'+group.name+'</a></li>');
            });
            $('#hostGroups .badge')
                .empty()
                .append(groupList.length);
            $('#hostGroups ul')
                .empty()
                .append(groupList.join(''));

            $.each(host.applications, function(i, app) {
                appList.push('<li><a href="#!Monitoring/Latest&host='+host.host+'&application='+app.name+'">'+app.name+'</a></li>');
            });
            $('#hostApplications .badge')
                .empty()
                .append(appList.length);
            $('#hostApplications ul')
                .empty()
                .append(appList.join(''));

            $.each(host.discoveries, function(i, d) {
                dRuleList.push('<li><a href="#!Monitoring/Latest&host='+host.host+'&discoveries='+d.name+'">'+d.name+'</a></li>');
            });
            $('#hostDiscoveryRules .badge')
                .empty()
                .append(dRuleList.length);
            $('#hostDiscoveryRules ul')
                .empty()
                .append(dRuleList.join(''));

            $.each(host.graphs, function(i, graph) {
                graphList.push('<li><a href="#!Monitoring/Graph&host='+host.host+'&graphid='+graph.graphid+'">'+graph.name+'</a></li>');
            });
            $('#hostGraphs .badge')
                .empty()
                .append(graphList.length);
            $('#hostGraphs ul')
                .empty()
                .append(graphList.join(''));

            $.each(host.httpTests, function(i, web) {
                webList.push('<li><a href="#!Monitoring/Graph&host='+host.host+'&web='+web.name+'">'+web.name+'</a></li>');
            });
            $('#hostWeb .badge')
                .empty()
                .append(webList.length);
            $('#hostWeb ul')
                .empty()
                .append(webList.join(''));
            
            //Items
            $.each(host.items, function(i, item) {
                itemsList.push('<li><a href="#!Monitoring/Latest/Item&itemid='+item.itemid+'" class="text-nowrap">'+item.name+'</a></li>');
            });
            $('#hostItems .badge')
                .empty()
                .append(itemsList.length);
            $('#hostItems ul')
                .empty()
                .append(itemsList.join(''));

            //Macros
            $.each(host.macros, function(i, m) {
                macrosList.push(
                    '<dt>'+m.macro+'</dt>',
                    '<dd>'+m.value+'</dd>'
                );
            });
            $('#hostMacros .badge')
                .empty()
                .append(host.macros.length);
            $('#hostMacros dl')
                .empty()
                .append(macrosList.join(''));

            $.each(host.screens, function(i, s) {
                screenList.push('<li><a href="#!Monitoring/Screen&screenid='+s.screenid+'">'+s.name+'</a></li>');
            });
            $('#hostScreens .badge')
                .empty()
                .append(host.screens.length);
            $('#hostScreens ul')
                .empty()
                .append(screenList.join(''));

            $.each(host.triggers, function(i, t) {
                triggerList.push('<li><a href="#!Monitoring/Triggers&triggerid='+t.triggerid+'" class="text-nowrap">'+t.description+'</a></li>');
            });
            $('#hostTriggers .badge')
                .empty()
                .append(host.triggers.length);
            $('#hostTriggers ul')
                .empty()
                .append(triggerList.join(''));
            //discoveries: function(discoveries) {
            //    var d = [];
            //    $.each(discoveries, function(i, discover) {
            //        d.push(discover.name)
            //    });
            //    return '<dt>Discoveries</dt><dd>'+d.join(', ')+'</dd>'
            //},
            //discoveryRule: function(app) {
            //},
            //interfaces: function(interfaces) {
            //    var intf = [];
            //    $.each(interfaces, function(k, v) {
            //        intf.push('<dt>'+k+'</dt><dd>'+v+'</dd>')
            //    });
            //    return intf.join('')
            //},
            //parentTemplates: function(app) {
            //},
            host.interfaces.sort(function(a, b) {
                return a.type - b.type
            });
            $.each(host.interfaces, function(i, intf) {
                intfList.push(
                    '<tr class="'+map.interfaces.tr.class[intf.type]+'">',
                        '<td>'+zapi.map('Host interface', 'type', intf.type).value+'</td>',
                        '<td>'+intf.ip+'</td>',
                        '<td>'+intf.dns+'</td>',
                        '<td>'+zapi.map('Host interface', 'useip', intf.useip).value+'</td>',
                        '<td>'+intf.port+'</td>',
                        '<td>'+zapi.map('Host interface', 'main', intf.main).value+'</td>',
                    '</tr>'
                );
            });
            $('#hostInterfaces tbody')
                .empty()
                .append(intfList.join(''));

            $.each(host.inventory, function(k, dd) {
                var hi = zapi.obj.Host.inventory.values[k]
                hi && dd && invList.push('<dt>'+hi.description+'</dt><dd><pre>'+dd+'</pre></dd>');
            });
            $('#hostInventory')
                .append(invList.join(''));
            
        });
    }
    
    return {
        init: init,
        update: update
    }
});
