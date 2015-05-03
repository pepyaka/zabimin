define(['Zapi', 'Util', 'moment', 'config', 'bootstrap-select', 'bootstrap-datetimepicker'], function(zapi, util, moment, zabimin) {
    "use strict";

    var itemsFilter = {
        prep: $.Deferred(),
        init: function() {
            var _this = this;
            var done = $.Deferred();
            var hostGet = zapi.req('host.get', {
                output: ['name'],
                selectItems: ['itemid', 'name', 'value_type'],
                selectGroups: ['name'],
                with_simple_graph_items: true
            });
            $('.selectpicker').selectpicker();
            hostGet.done(function(zapiResponse) {
                var hosts = zapiResponse.result;
                var groups = [];
                var groupList = [];
                var hostList = ['<option value="">Nothing selected</option>'];
                var iitemList = ['<option value="">Nothing selected</option>'];
                //Array.prototype.push.apply(hosts, zapiResponse.result);
                hosts.forEach(function(host) {
                    host.groups.forEach(function(group) {
                        if (groups[group.groupid]) {
                            groups[group.groupid].hosts.push(host)
                        } else {
                            groups[group.groupid] = group
                            groups[group.groupid].hosts = [host]
                        }
                    });
                });
                groups.forEach(function (g) {
                    groupList.push(
                        '<option value="' + g.groupid + '">' +
                            g.name +
                        '</option>'
                    );
                });
                $('#group-select')
                    .append(groupList)
                    .prop('disabled', false)
                    .selectpicker('refresh')
                    .on('change', function () {
                        var selHostList = ['<option value="">Nothing selected</option>'];
                        var selGroupId = $(this).val();
                        groups[selGroupId].hosts.forEach(function (h) {
                            selHostList.push(
                                '<option value="' + h.hostid + '">' +
                                    h.name +
                                '</option>'
                            );
                        })
                        $('#host-select')
                            .html(selHostList)
                            .selectpicker('refresh');
                    });
                hosts.forEach(function (h) {
                    hostList.push(
                        '<option value="' + h.hostid + '">' +
                            h.name +
                        '</option>'
                    );
                });
                $('#host-select')
                    .append(hostList)
                    .prop('disabled', false)
                    .selectpicker('refresh')
                    .on('change', function () {
                        var selItemList = ['<option value="">Nothing selected</option>'];
                        var selHostId = $(this).val();
                        var selHost = hosts.filter(function (h) {
                            return h.hostid === selHostId
                        })[0];
                        selHost.items.forEach(function (i) {
                            // Add item to list only if it number
                            if (['0', '3'].indexOf(i.value_type) > -1) {
                                selItemList.push(
                                    '<option value="' + i.itemid + '">' +
                                        i.name +
                                    '</option>'
                                );
                            }
                        })
                        $('#item-select')
                            .html(selItemList)
                            .prop('disabled', false)
                            .selectpicker('refresh');
                    });
                $('#item-add')
                    .on('click', function () {
                        var $selHost = $('#host-select option:selected');
                        var $selItem = $('#item-select option:selected');
                        var selItemid = Number($selItem.val());
                        var $itemList = $('#item-list');
                        var itemArr = getItemsList($itemList);
                        if (itemArr.indexOf(selItemid) < 0) {
                            $itemList
                                .append(
                                    '<li class="list-group-item" data-itemid="' + selItemid + '">' +
                                        $selHost.text() + ': ' + $selItem.text() +
                                        '<button type="button" class="close">' +
                                            '<span aria-hidden="true">&times;</span>' +
                                        '</button>' +
                                    '</li>'
                                );
                            util.hash({
                                itemid: getItemsList($('#item-list'))
                            }, true);
                            
                        }
                    });
                $('#item-list')
                    .on('click', 'button.close', function () {
                        var itemid = getItemsList($('#item-list'))
                        $(this).parent('li').remove();
                        util.hash({
                            itemid: itemid.length > 0 ? itemid : null
                        }, true);
                    });
                function getItemsList($ul) {
                    var itemid = [];
                    $ul.children('li').each(function () {
                        itemid.push($(this).data('itemid'));
                    });
                    return itemid
                };
                itemsFilter.prep.resolve();
            });
        },
        update: function(hashArgs) {
        }
    };
    var periodFilter = {
        init: function () {
            var customScale = null;
            $('.datetimepicker').datetimepicker();
            $('#scale-select')
                .on('change', function () {
                    var val = $(this).val();
                    if (val === 'custom') {
                        $('#custom-scale-list').collapse('show')
                        $('#period-range').collapse('hide')
                    } else {
                        $('#period-range').collapse('show')
                        $('#custom-scale-list').collapse('hide')
                    }
                    util.hash({
                        scale: val || null
                    }, true);
                });
        },
        update: function (hashArgs) {
        }
    };
    var chart = {
        prep: $.Deferred(),
        init: function (hashArgs) {
            var chartLibName = hashArgs.chartLib ? hashArgs.chartLib[0] : zabimin.chartLib;
            require(['chartLib/' + chartLibName], function (chartLib) {
                chart.prep.resolve(chartLib);
            })
        },
        draw: function (chartLib, hashArgs) {
            var barChart = {
                form: 'Reports/Bar',
                idSel: 'bar-report-chart'
            };
            var itemGet = zapi.req('item.get', {
                itemids: hashArgs.itemid || 0
            });
            itemGet.done(function (zapiResponse) {
                var items = zapiResponse.result;
console.log(items)
                // Add fake deffered object for zapi requests to 
                // always pass multiple Deferred objects to jQuery.when()
                var reqArray = [ new $.Deferred() ];
                var time_from = hashArgs.since ?
                                moment(hashArgs.since[0]).format('X') :
                                Date.now() - 86400;
                var time_till = hashArgs.till && hashArgs.till[0];
                barChart.items = items;
                chartLib.init(barChart);
                items.forEach(function (item) {
                    reqArray.push(
                        zapi.req('trends.get', {
                            itemids: item.itemid,
                            history: item.value_type,
                            time_from: time_from,
                            time_till: time_till
                        })
                    );
                });
                $.when.apply(null, reqArray).done(function() {
                    // extract all responses except fake deferred
                    var args = Array.prototype.slice.call(arguments, 1);
                    var data = args.map(function (zapiResponse) {
                        return zapiResponse[0].result
                    });
                    chartLib.load(data, barChart);
                });
                reqArray[0].resolve(false);
            });
        }
    };

    var init = function(hashArgs) {
        chart.init(hashArgs);
        itemsFilter.init();
        periodFilter.init();
        update(hashArgs);
    };
    var update = function(hashArgs) {
        itemsFilter.prep.done(function () {
            itemsFilter.update(hashArgs);
        });
        periodFilter.update(hashArgs);
        chart.prep.done(function (chartLib) {
            chart.draw(chartLib, hashArgs);
        });
    };

    return {
        init: init,
        update: update
    }
});
