define(['Zapi', 'Util', 'bootstrap-table', 'bootstrap-select'], function(zapi, util) {
    "use strict";

    // Page global variables
    var page = '#!Inventory/Overview';
    var hosts;

    // Page components
    var filter = {
        init: function(initDone) {
            var hostGet = zapi.req('host.get', {
                withInventory: true,
                output: 'host',
                selectGroups: ['name'],
                selectInventory: 'extend'
            });
            $('.selectpicker')
                .selectpicker()
                .on('change', function () {
                    var $opt = $(this);
                    var args = {};
                    args[$opt.data('hashArgs')] = $opt.val() || null;
                    util.hash(args, true)
                });
            hostGet.done(function(groupResponse) {
                var groups = [];
                hosts = groupResponse.result;
                hosts.forEach(function (h) {
                    h.groups.forEach(function (g) {
                        if (groups[g.groupid]) {
                            groups[g.groupid].hosts++
                        } else {
                            groups[g.groupid] = g;
                            groups[g.groupid].hosts = 1;
                        }
                    });
                });
                groups = groups.filter(Boolean);
                groups.sort(function (a, b) {
                    return a.name > b.name ? 1 : -1
                });
                $('#group-select')
                    .append(groups.map(function (g) {
                        var dataContent = '<span class="badge pull-right">' + g.hosts + '</span>' + g.name;
                        return ( 
                            '<option value="' + g.groupid + '" data-content=\'' + dataContent + '\'>' +
                                    g.name +
                            '</option>'
                        )
                    }))
                    .prop('disabled', false)
                    .selectpicker('refresh');
                initDone()
            });
        },
        update: function(hashArgs) {
            $.each(hashArgs, function (k, v) {
                $('[data-hash-args="' + k + '"]')
                    .selectpicker('val', v);
            });
        }
    };
    var tables = {
        init: function () {
            //$('[data-toggle="table"]').bootstrapTable();
        },
        update: function (hashArgs) {
            var selHosts = hashArgs.groupid ?
                hosts.filter(function (h) {
                    return h.groups.some(function (g) {
                        return g.groupid === hashArgs.groupid[0]
                    })
                }) : hosts;
            $('[data-toggle="table"]')
                .each(function (i) {
                    var inventoryObj = {};
                    var data = []
                    var prop = hashArgs.inventoryProperty &&
                               hashArgs.inventoryProperty[i];
                    var fieldValue = zapi.map('Host', 'inventory', prop).value;
                    var groupidArg = hashArgs.groupid ? '&groupid=' + hashArgs.groupid.join('') : '';
                    selHosts.forEach(function (h) {
                        var propVal = h.inventory[prop]
                        if (propVal) {
                            inventoryObj[propVal] ?
                            inventoryObj[propVal]++ :
                            inventoryObj[propVal] = 1;
                        }
                    });
                    $.each(inventoryObj, function (k, v) {
                        data.push({
                            field: k,
                            count: '<a href="#!Inventory/Hosts' + groupidArg + '&inventory.' + prop + '=' + k + '">' + v + '</a>'
                        });
                    });
                    $(this)
                        .bootstrapTable('destroy')
                        .find('th:first')
                            .text(fieldValue ? fieldValue.description : 'Field')
                        .end()
                        .bootstrapTable({ data: data })
                });
        },
    };

    // Page external methods
    var init = function(hashArgs) {
        filter.init(function() {
            filter.update(hashArgs);
            tables.update(hashArgs);
        });
        //tables.init();
    };
    var update = function(hashArgs) {
        filter.update(hashArgs);
        tables.update(hashArgs);
    };


    return {
        init: init,
        update: update
    }
});
