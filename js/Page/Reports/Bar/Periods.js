define(['Zapi', 'Util', 'moment', 'config', 'bootstrap-select', 'bootstrap-datetimepicker'], function(zapi, util, moment, zabimin) {
    "use strict";
    var now = moment();
    var monthAgo = moment().subtract(1, 'month');

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
            $('#scale-select')
                .on('change', function () {
                    var val = $(this).val();
                    util.hash({
                        scale: val === 'day' ? null : val
                    }, true);
                });
            $('#period-since')
                .datetimepicker({
                    format: 'll',
                    defaultDate: monthAgo
                })
                .on('dp.change', function (e) {
                    util.hash({
                        since: moment(e.date).format('YYYY-MM-DDTHH:mm')
                    }, true);
                });
            $('#period-till')
                .datetimepicker({
                    format: 'll',
                    defaultDate: now
                })
                .on('dp.change', function (e) {
                    util.hash({
                        till: moment(e.date).format('YYYY-MM-DDTHH:mm')
                    }, true);
                });
        },
        update: function (hashArgs) {
            $('#scale-select')
                .selectpicker(
                    'val',
                    hashArgs.scale ? hashArgs.scale[0] : 'day'
                );
            if (hashArgs.since) {
                $('#period-since')
                    .data('DateTimePicker')
                        .date(moment(hashArgs.since[0]));
            }
            if (hashArgs.till) {
                $('#period-till')
                    .data('DateTimePicker')
                        .date(moment(hashArgs.till[0]));
            }
        }
    };
    var chart = {
        prev: {},
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
            };
            var itemids = chartArgs.items.map(function (i) {
                return i.itemid;
            });
            var sameItemIds = (
                itemids.equals(chart.prev.itemids)
            ) || (
                chart.prev.itemids = itemids,
                false
            );
            var sameTimePeriod = (
                chartArgs.since === chart.prev.since &&
                chartArgs.till === chart.prev.till
            ) || (
                chart.prev.since = chartArgs.since,
                chart.prev.till = chartArgs.till,
                false
            );
            chart.prep.done(function (chartLib) {
                // get items only if it changed
                if (!sameItemIds) {
                    chart.itemGet = zapi.req('item.get', {
                        itemids: itemids.length > 0 ? itemids : 0,
                        selectHosts: ['name'],
                        output: [
                            'name',
                            'description',
                            'value_type'
                        ]
                    });
                }
                chart.itemGet.done(function (zapiResponse) {
                    var items = zapiResponse.result;
                    var scale = createCategories(
                        chartArgs.scale,
                        chartArgs.mSince,
                        chartArgs.mTill
                    );
                    barChart.categories = scale.map(function (c) {
                        return c.date
                    });
                    barChart.items = chartArgs.items.map(function (item) {
                        var i = items.filter(function (i, index) {
                            return (
                                item.itemid === i.itemid &&
                                (item.dataSrc = index, true)
                            )
                                
                        })[0];
                        return $.extend(item, i);
                    });
                    chartLib.init(barChart);
                    // get history data if time period or items was changed
                    if (!sameTimePeriod || !sameItemIds) {
                        // Add fake deffered object for zapi requests to 
                        // always pass multiple Deferred objects to jQuery.when()
                        chart.trendsGetArr = [ $.Deferred() ];
                        items.forEach(function (item) {
                            chart.trendsGetArr.push(
                                zapi.req('trends.get', {
                                    itemids: item.itemid,
                                    history: item.value_type,
                                    time_from: chartArgs.mSince.format('X'),
                                    time_till: chartArgs.mTill.format('X')
                                })
                            );
                        });
                        // Process chart data after ALL history items loaded
                        chart.trendsGetArr[0].resolve(false);
                    }
                    $.when.apply(null, chart.trendsGetArr).done(function() {
                        // extract all responses except fake deferred
                        var args = Array.prototype.slice.call(arguments, 1);
                        var trendsData = args.map(function (zapiResponse) {
                            return zapiResponse[0].result
                        });
                        var data = procData(trendsData, scale);
                        chartLib.load(
                            barChart.items.map(function (item) {
                                return data[item.dataSrc]
                            }),
                            barChart
                        );
                    });
                });
            });
            function createCategories(period, mSince, mTill) {
                var period = (
                    [
                        'hour',
                        'day',
                        'week',
                        'month',
                        'year'
                    ].indexOf(period) > -1 ?
                    period :
                    'day'
                );
                var formatDate = function(period, start, end) {
                    return {
                        hour: start.format('HH:mm'),
                        day: start.format('dd, D MMM'),
                        week: start.format('ll') + ' - ' + end.format('ll'),
                        month: start.format('MMMM'),
                        year: start.format('YYYY')
                    }[period]
                };
                var mCur = moment(mSince);
                var scale = [];
                while (mCur.isBefore(mTill)) {
                    var start = moment(mCur).startOf(period);
                    var end = moment(mCur).endOf(period);
                    scale.push({
                        date: formatDate(period, start, end),
                        start: start.unix(),
                        end: end.unix()
                    });
                    // Protect period name (infiloop cause)
                    mCur.add(1, period);
                }
                return scale
            };
            function procData(trendsData, scale) {
                var data = [];
                scale.forEach(function (s) {
                    trendsData.forEach(function (item, i) {
                        var preData = item.filter(function (d) {
                            var clock = Number(d.clock);
                            return clock >= s.start && clock < s.end
                        });
                        var d = {
                            min: Math.min.apply(null,
                                preData.map(function (d) {
                                    return Number(d.value_min)
                                })
                            ),
                            max: Math.max.apply(null,
                                preData.map(function (d) {
                                    return Number(d.value_max)
                                })
                            ),
                            sum: preData.reduce(function (sum, d) {
                                return sum + Number(d.value_avg)
                            }, 0),
                            cnt: preData.length
                        };
                        d.avg = d.sum / d.cnt;
                        if (data[i]) {
                            data[i].push(d);
                        } else {
                            data[i] = [d];
                        }
                    });
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
            mSince: moment(
                hashArgs.since ?
                hashArgs.since[0] :
                monthAgo
            ),
            mTill: moment(
                hashArgs.till &&
                hashArgs.till[0]
            )
        });
    };

    return {
        init: init,
        update: update
    }
});
