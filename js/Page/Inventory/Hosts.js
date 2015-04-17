define(['Zapi', 'Util', 'bootstrap-table', 'bootstrap-select'], function(zapi, util) {
    "use strict";

    //Page global variables
    var page = '#!Inventory/Hosts';

    //Page components
    var filter = {
        init: function(initDone) {
            var hostGroupGet = zapi.req('hostgroup.get', {
                real_hosts: true,
                selectHosts: 'count'
            });
            $('.selectpicker')
                .selectpicker()
                .on('change', function () {
                    var $opt = $(this);
                    var args = {};
                    if ($opt.data('hashArgs')) {
                        args[$opt.data('hashArgs')] = $opt.val() || null;
                        util.hash(args, true)
                    }
                });
            $('#inventory-prop-search')
                .on('click', function () {
                    var args = {};
                    var k = $('#field-select').val();
                    var v = $('#inventory-prop-value').val();
                    args['inventory.' + k] = v || null;
                    util.hash(args, true);
                });
            hostGroupGet.done(function(groupResponse) {
                var groups = groupResponse.result;
                $('#group-select')
                    .append(groups.map(function(g) {
                        var dataContent = '<span class="badge pull-right">' + g.hosts + '</span>' + g.name;
                        return (
                            '<option value="' + g.groupid + '" data-content=\'' + dataContent + '\'>' +
                                    g.name +
                            '</option>'
                        )
                    }))
                    .prop('disabled', false)
                    .selectpicker('refresh');
                initDone();
            });
        },
        update: function(hashArgs) {
            $.each(hashArgs, function (k, v) {
                $('[data-hash-args="' + k + '"]')
                    .selectpicker('val', v);
            });
        }
    };
    var inventoryTable = {
        init: function() {
            var columns = [{
                    field: 'name',
                    title: 'Host',
                    sortable: true,
                    class: "text-nowrap",
                    formatter: function(name, host) {
                        return (
                            '<a href="#!Inventory/Host&hostid='+host.hostid+'">' +
                                name +
                            '</a>'
                        )
                    }
                }, {
                    field: 'groups',
                    title: 'Groups',
                    searchable: false,
                    sortable: true,
                    align: 'center',
                    valign: 'middle',
                    formatter: function(groups) {
                        var groupList = groups.map(function(g) {
                            return (
                                '<a class="list-group-item" href="'+page+'&groupid='+g.groupid+'">' +
                                    g.name +
                                '</a>'
                            )
                        });
                        return (
                            '<span class="expanded-info badge alert-info">' +
                                groupList.length +
                                '<div class="expanded-info-content-left">' +
                                    '<div class="panel panel-default">' +
                                        '<div class="list-group list-group-sm text-left text-nowrap">' +
                                            groupList.join('') +
                                        '</div>' +
                                    '</div>' +
                                '</div>' +
                            '</span>'
                        )
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
                        var a = i.serialno_a ? '<span class="label label-primary">'+i.serialno_a+'</span>' : ''
                        var b = i.serialno_b ? ' <span class="label label-default">'+i.serialno_b+'</span>' : ''
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
                    showToggle: true,
                    showColumns: true,
                    showPaginationSwitch: true,
                    pagination: true,
                    pageSize: 20,
                    pageList: [10, 20, 50, 100],
                    columns: columns
                })
                .css('opacity', 0.3)
        },
        update: function(hashArgs) {
            var hostGet = zapi.req('host.get', {
                groupids: hashArgs.groupid,
                selectInventory: 'extend',
                selectInterfaces: ['ip', 'type']
            });
            $('#hosts-inventory')
                .fadeTo('fast', 0.3)
            hostGet.done(function(hostResponse) {
                var inventoryProp;
                $.each(hashArgs, function (k, v) {
                    var p = k.split('.');
                    if (p[0] === 'inventory') {
                        inventoryProp = [ p[1], v[0] ];
                    }
                });
                var hosts = inventoryProp ?
                            hostResponse.result.filter(function (h) {
                                var filter = false;
                                $.each(h.inventory, function (k, v) {
                                    if (inventoryProp[0] === k && inventoryProp[1] === v) {
                                        filter = true
                                    }
                                });
                                return filter
                            }) :
                            hostResponse.result;
                $('#hosts-inventory')
                    .bootstrapTable('load', hosts)
                    .fadeTo('fast', 1)
            });
        }
    };

    //Page external methods
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

    return {
        init: init,
        update: update
    }
});
