// Inventory/Hosts
define(['Page','Zapi', 'Util', 'Page/nav', 'moment', 'bootstrap-table'], function(Page, zapi, Util, nav, moment) {
    var hosts;
    var hostGroups;

    var init = function(hashArgs) {
        getData(function() {
            createHostGroupSelect(hostGroups);
            createInventoryTable(hosts, hashArgs)
        });
    };
    var update = function(hashArgs) {
        createInventoryTable(hosts, hashArgs)
    };

    function getData(callback) {
        var hostGroupGet = zapi.req('hostgroup.get', {
        });
        var hostGet = zapi.req('host.get', {
            selectInventory: 'extend',
            selectInterfaces: ['ip', 'type']
        });
        $.when(hostGroupGet, hostGet)
            .done(function(hostGroupResponse, hostResponse) {
                hosts = hostResponse[0].result;
                hostGroups = hostGroupResponse[0].result;
                callback();
            });
    };
    function createHostGroupSelect(hostGroups) {
        var hostGroupList = [];
        $.each(hostGroups, function(i, group) {
            hostGroupList.push(
                '<li>',
                    '<a href="#!Inventory/Hosts&hostgroup='+group.name+'">'+group.name+'</a>',
                '</li>'
            );
        });
        $('#hostGroupSelect')
            .append(hostGroupList.join(''))
            .on('click', 'a', function(e) {
                var $this = $(this)
                var btnText = $this.text() == 'All' ? 'Host groups' : $this.text()
                $this.parents('.dropdown')
                    .find('button')
                        .html(
                            btnText + ' <span class="caret"></span>'
                        )
            })
    };
    function createInventoryTable(hosts, hashArgs) {
        var data = $.map(hosts, function(host) {
            var groupList = $.map(host.groups, function(group) {
                return group.name
            })
            if (!hashArgs.hostgroup || $.inArray(hashArgs.hostgroup[0], groupList) > -1) {
                var d = {
                    host: host.host,
                    interfaces: host.interfaces
                }
                d.interfaces.sort(function(a, b) {
                    return a.type > b.type
                });
                return $.extend(d, host.inventory)
            }
        });
        var map = {
            formatter: {
                host: function(host) {
                    return '<a href="#!Inventory/Host&host='+host+'">'+host+'</a>'
                },
                interfaces: function(intfs) {
                    var dl = $.map(intfs, function(i) {
                        return '<strong>'+zapi.map('Host interface', 'type', i.type).value+' </strong>'+i.ip
                    });
                    return dl.join('<br>')
                }
            }
        };
        var columns = [{
                field: 'host',
                title: 'Host',
                sortable: true,
                formatter: map.formatter.host
            }, {
                field: 'interfaces',
                title: 'Interfaces',
                sortable: true,
                formatter: map.formatter.interfaces
            }, {
                field: 'name',
                title: 'Name',
                visible: false
            }, {
                field: 'type',
                title: 'Type',
            }, {
                field: 'os',
                title: 'OS',
            }, {
                field: 'model',
                title: 'Model',
            }, {
                field: 'serial_a',
                title: 'Serial',
            }, {
                field: 'vendor',
                title: 'Vendor'
        }];
        $('#hostsInventory')
            .bootstrapTable('destroy')
            .bootstrapTable({
                data: data,
                search: true,
                pagination: true,
                //showRefresh: true,
                showToggle: true,
                showColumns: true,
                columns: columns
            })
            .prop('disabled', false)
            .fadeTo('fast', 1)

    };
    
    return {
        init: init,
        update: update
    }
});
