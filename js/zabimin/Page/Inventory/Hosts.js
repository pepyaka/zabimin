// Inventory/Hosts
define(['Zapi', 'bootstrap-table'], function(zapi) {
    "use strict";
    var page = '#!Inventory/Hosts';

    var filter = {
        init: function(initDone) {
            var hostGroupGet = zapi.req('hostgroup.get', {
                real_hosts: true
            });
            hostGroupGet.done(function(groupResponse) {
                var groups = groupResponse.result;
                var groupList = groups.map(function(group) {
                    return [
                        '<li data-groupid="'+group.groupid+'">',
                            '<a href="#!Inventory/Hosts&groupid='+group.groupid+'">'+group.name+'</a>',
                        '</li>'
                    ].join('')
                });
                $('#group-list')
                    .append(groupList.join(''))
                initDone()
            });
        },
        update: function(hash) {
            var gid = hash.groupid ? hash.groupid[0] : 0;
            $('#group-list li')
                .removeClass('active')
            $('[data-groupid="'+gid+'"]')
                .addClass('active')
        }
    };
    var inventoryTable = {
        init: function() {
            var columns = [{
                    field: 'name',
                    title: 'Host',
                    sortable: true,
                    formatter: function(name, host) {
                        return '<a href="#!Inventory/Host&hostid='+host.hostid+'">'+name+'</a>'
                    }
                }, {
                    field: 'groups',
                    title: 'Groups',
                    searchable: false,
                    sortable: true,
                    formatter: function(groups) {
                        var groupList = groups.map(function(g) {
                            return g.name
                        });
                        return '<a class="hint--right hint--info hint--rounded" data-hint="'+groupList.join('\n')+'"><span class="badge">'+groupList.length+'</span></a>'
                    }
                }, {
                    field: 'interfaces',
                    title: 'Interfaces',
                    sortable: true,
                    formatter: function(intfs) {
                        var intList = $.map(intfs, function(i) {
                            return i.ip
                        });
                        return intList.join(', ')
                    }
                }, {
                    field: 'inventory',
                    title: 'Name',
                    visible: false,
                    formatter: function(inventory) {
                        return inventory.name
                    },
                }, {
                    field: 'inventory',
                    title: 'Type',
                    visible: false,
                    formatter: function(inventory) {
                        return inventory.type
                    }
                }, {
                    field: 'inventory',
                    title: 'OS',
                    sortable: true,
                    formatter: function(inventory) {
                        return inventory.os
                    }
                }, {
                    field: 'inventory',
                    title: 'Model',
                    searchable: true,
                    formatter: function(inventory) {
                        return inventory.model
                    }
                }, {
                    field: 'inventory',
                    title: 'Serial',
                    formatter: function(i) {
                        var a = i.serialno_a ? '<span class="text-info">'+i.serialno_a+'</span>' : ''
                        var b = i.serialno_b ? ' <span class="text-muted">'+i.serialno_b+'</span>' : ''
                        return a + b
                    }
                }, {
                    field: 'inventory',
                    title: 'Tag',
                    visible: false,
                    formatter: function(i) {
                        return i.tag
                    }
                }, {
                    field: 'inventory',
                    title: 'MAC Address',
                    searchable: true,
                    visible: false,
                    formatter: function(i) {
                        return i.macaddress_a
                    },
                }, {
                    field: 'inventory',
                    title: 'Vendor',
                    formatter: function(inventory) {
                        return inventory.vendor
                    }
            }];
            $('#hosts-inventory')
                .bootstrapTable({
                    search: true,
                    //pagination: true,
                    //showRefresh: true,
                    showToggle: true,
                    showColumns: true,
                    columns: columns
                })
                .css('opacity', 0.3)
        },
        update: function(hash) {
            var hostGet = zapi.req('host.get', {
                groupids: hash.groupid,
                selectInventory: 'extend',
                selectInterfaces: ['ip', 'type']
            });
            $('#hosts-inventory')
                .fadeTo('fast', 0.3)
            hostGet.done(function(hostResponse) {
                var hosts = hostResponse.result;
                $('#hosts-inventory')
                    .bootstrapTable('load', hosts)
                    .fadeTo('fast', 1)
            });
        }
    };

    var init = function(hash) {
        filter.init(function() {
            filter.update(hash);
        });
        inventoryTable.init();
        inventoryTable.update(hash);
    };
    var update = function(hash) {
        filter.update(hash);
        inventoryTable.update(hash);
    };

    function filterSelHosts(hash) {
        var selHosts = hosts.slice(0)
        if (hash.groupid) {
            hash.groupid.forEach(function(selGroupId) {
                selHosts = selHosts.filter(function(host) {
                    return host.groups.some(function(g) {
                        return g.groupid == selGroupId
                    });
                });
            });
        }
        if (hash.hostgroup) {
            hash.hostgroup.forEach(function(selGroup) {
                selHosts = selHosts.filter(function(host) {
                    return host.groups.some(function(g) {
                        return g.name == selGroup
                    });
                });
            });
        }
        createInventoryTable(selHosts)
    };
    
    return {
        init: init,
        update: update
    }
});
