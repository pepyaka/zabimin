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
                        var hostList = ['<option value="0">Nothing selected</option>'];
                        var selGroupId = $(this).val();
                        var selHosts;
                        if (selGroupId > 0) {
                            selHosts = groups[selGroupId].hosts
                        } else {
                            selHosts = hosts;
                        }
                        selHosts.forEach(function (h) {
                            hostList.push(
                                '<option value="' + h.hostid + '">' +
                                    h.name +
                                '</option>'
                            );
                        });
                        $('#host-select')
                            .html(hostList)
                            .prop('disabled', false)
                            .selectpicker('refresh');
                    })
                    .trigger('change');
                $('#host-select')
                    .on('change', function () {
                        var disabled = true;
                        var itemList = ['<option value="0">Nothing selected</option>'];
                        var selHostId = $(this).val();
                        var selHost = hosts.filter(function (h) {
                            return h.hostid === selHostId
                        })[0];
                        if (selHost) {
                            selHost.items.forEach(function (i) {
                                // Add item to list only if it number
                                if (['0', '3'].indexOf(i.value_type) > -1) {
                                    itemList.push(
                                        '<option value="' + i.itemid + '">' +
                                            i.name +
                                        '</option>'
                                    );
                                }
                            });
                            disabled = false;
                        }
                        $('#item-select')
                            .html(itemList)
                            .prop('disabled', disabled)
                            .selectpicker('refresh');
                    })
                    .trigger('change');
                
                $('#item-select')
                    .on('change', function () {
                        $('#item-add').prop('disabled', $(this).val() === '0')
                        //$('#item-label').val($(this).find('option:selected').text())
                    });
                
                $('#item-add')
                    .on('click', function () {
                        var item = [
                            $('#item-select option:selected').val(),
                            $('#func-select option:selected').val(),
                            $('#side-select input:checked').val(),
                            $('#item-label').val()
                        ].filter(Boolean).join(':');
                        var items = util.hash().args.item || [];
                        var itemIndex = items.indexOf(item);
                        if (items.indexOf(item) < 0) {
                            items.push(item);
                            util.hash({
                                item: items
                            }, true);
                        }
                    });
                $('#item-table')
                    .on('click', 'button.close', function () {
                        var item = $(this).parents('tr').data('item');
                        var items = util.hash().args.item;
                        var itemIndex = items.indexOf(item);
                        if (itemIndex > -1) {
                            items.splice(itemIndex, 1);
                        }
                        util.hash({
                            item: items.length > 0 ? items : null
                        }, true);
                    });
                itemsFilter.prep.resolve(hosts);
            });
        },
        update: function(hashArgs) {
            itemsFilter.prep.done(function (hosts) {
                var itemTable = [];
                if (hashArgs.item) {
                    hashArgs.item.forEach(function (hashItem) {
                        var iArr = hashItem.split(':');
                        var iId = iArr[0];
                        var iFunc = iArr[1];
                        var iSide = iArr[2];
                        var iLabel = iArr[3];
                        hosts.forEach(function (h) {
                            var item = h.items.filter(function (i) {
                                return i.itemid === iId;
                            })[0];
                            if (item) {
                                itemTable.push(
                                    '<tr data-item="' + hashItem + '">' +
                                        '<td>' + h.name + '</td>' +
                                        '<td>' + item.name + '</td>' +
                                        '<td>' + iFunc + '</td>' +
                                        '<td>' + iSide + '</td>' +
                                        '<td>' +
                                            '<button type="button" class="close">' +
                                                '<span aria-hidden="true">&times;</span>' +
                                            '</button>' +
                                        '</td>' +
                                    '</tr>'
                                );
                                
                            }
                        })
                    });
                }
                $('#item-table tbody')
                    .html(itemTable);
            });
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
        init: function () {
            require(['chartLib/' + zabimin.chartLib], function (chartLib) {
                chart.prep.resolve(chartLib);
            })
        },
        draw: function (chartArgs) {
            var barChart = {
                form: 'Reports/Bar',
                idSel: 'bar-report-chart',
                scale: chartArgs.scale
            };
            var itemids = chartArgs.items.map(function (i) {
                return i.itemid;
            });
            var itemGet = zapi.req('item.get', {
                itemids: itemids.length > 0 ? itemids : 0,
                selectHosts: ['name'],
                output: [
                    'name',
                    'description',
                    'value_type'
                ]
            });
            chart.prep.done(function (chartLib) {
                itemGet.done(function (zapiResponse) {
                    var items = zapiResponse.result;
                    // Add fake deffered object for zapi requests to 
                    // always pass multiple Deferred objects to jQuery.when()
                    var reqArray = [ $.Deferred() ];
                    barChart.items = items.map(function (item) {
                        var i = chartArgs.items.filter(function (i) {
                            return item.itemid === i.itemid
                        })[0];
                        return $.extend(i, item);
                    });
                    chartLib.init(barChart);
                    items.forEach(function (item) {
                        reqArray.push(
                            zapi.req('trends.get', {
                                itemids: item.itemid,
                                history: item.value_type,
                                time_from: chartArgs.since,
                                time_till: chartArgs.till
                            })
                        );
                    });
                    $.when.apply(null, reqArray).done(function() {
                        // extract all responses except fake deferred
                        var args = Array.prototype.slice.call(arguments, 1);
                        var trendsData = args.map(function (zapiResponse) {
                            return zapiResponse[0].result
                        });
                        var data = procData(trendsData, 86400);
                        chartLib.load(data, barChart);
                    });
                    reqArray[0].resolve(false);
                });
            });
            function procData(trendsData, scale) {
                var tzOffset = new Date().getTimezoneOffset() * 60;
                var clockObj = {};
                var data = trendsData.map(function (itemData, i) {
                    itemData.forEach(function (d) {
                        var scaleClock = d.clock - d.clock % scale + tzOffset;
                        if (clockObj[scaleClock]) {
                            if (clockObj[scaleClock][i]) {
                                clockObj[scaleClock][i].push(d);
                            } else {
                                clockObj[scaleClock][i] = [d];
                            }
                        } else {
                            clockObj[scaleClock] = [];
                            clockObj[scaleClock][i] = [d];
                        }
                    });
                    // Create data array of arrays, exactly length as rawData array
                    return []
                });
                Object.keys(clockObj).forEach(function (clock) {
                    clockObj[clock].forEach(function (itemData, i) {
                        var avgArr = itemData.map(function (d) {
                            return d.value_avg
                        });
                        var minArr = itemData.map(function (d) {
                            return d.value_min
                        });
                        var maxArr = itemData.map(function (d) {
                            return d.value_max
                        });
                        var sum = avgArr.reduce(function(sum, value) {
                            return sum + Number(value)
                        }, 0);
                        data[i].push({
                            ms: clock * 1000,
                            avg: sum / avgArr.length,
                            min: Math.min.apply(null, minArr),
                            max: Math.max.apply(null, maxArr)
                        })
                    });
                });
                data.sort(function (a, b) {
                    return a.ms - b.ms
                })
                return data
            }
        }
    };

    var init = function(hashArgs) {
        itemsFilter.init();
        periodFilter.init();
        chart.init();

        update(hashArgs);
    };
    var update = function(hashArgs) {
        itemsFilter.update(hashArgs);
        periodFilter.update(hashArgs);
        chart.draw({
            items: (
                hashArgs.item ? 
                hashArgs.item.map(function (i) {
                    var iArr = i.split(':');
                    return {
                        itemid: iArr[0],
                        func: iArr[1],
                        side: iArr[2],
                        label: iArr[3],
                    };
                }) :
                []
            ),
            scale: hashArgs.scale ? hashArgs.scale[0] : 'day',
            since: (
                hashArgs.since ?
                moment(hashArgs.since[0]).format('X') :
                Date.now()/1000 - 86400 * 30
            ),
            till: hashArgs.till && moment(hashArgs.till[0]).format('X')
        });
    };

    return {
        init: init,
        update: update
    }
});
