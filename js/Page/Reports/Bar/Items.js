define(['Zapi', 'Util', 'moment', 'config', 'bootstrap-select', 'bootstrap-datetimepicker'], function(zapi, util, moment, zabimin) {
    "use strict";
    var now = moment();
    var monthAgo = moment().subtract(1, 'month');
    var perSep = '_';//Period separator in URL

    var itemsFilter = {
        prep: $.Deferred(),
        init: function() {
            var _this = this;
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
                groups = groups.filter(Boolean);
                groups.sort(function (a, b) {
                    return a.name > b.name ? 1 : -1
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
                            selHosts = groups.filter(function (g) {
                                return g.groupid === selGroupId
                            })[0].hosts;
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
                _this.prep.resolve(hosts);
            });
        },
        update: function(args) {
            this.prep.done(function (hosts) {
                var itemTable = [];
                args.items.forEach(function (argItem) {
                    hosts.forEach(function (h) {
                        var item = h.items.filter(function (i) {
                            return i.itemid === argItem[0];
                        })[0];
                        if (item) {
                            itemTable.push(
                                '<tr data-item="' + argItem.join(':') + '">' +
                                    '<td>' + h.name + '</td>' +
                                    '<td>' + item.name + '</td>' +
                                    '<td>' + argItem[1] + '</td>' +
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
                $('#item-table tbody')
                    .html(itemTable);
            });
        }
    };
    var periodFilter = {
        init: function () {
            $('#period-since')
                .datetimepicker({
                    format: 'll',
                    defaultDate: monthAgo
                })
            $('#period-till')
                .datetimepicker({
                    format: 'll',
                    defaultDate: now
                })
            $('#period-add')
                .on('click', function () {
                    var p = (
                        $('#period-since')
                            .data('DateTimePicker')
                            .date()
                            .format('YYYY-MM-DDTHH:mm') +
                        perSep +
                        $('#period-till')
                            .data('DateTimePicker')
                            .date()
                            .format('YYYY-MM-DDTHH:mm')
                    );
                    var period = util.hash().args.period || [];
                    var pIndex = period.indexOf(p);
                    if (period.indexOf(p) < 0) {
                        period.push(p);
                        util.hash({
                            period: period
                        }, true);
                    }
                });
            $('#period-table')
                .on('click', 'button.close', function () {
                    var p = $(this).parents('tr').data('period');
                    var period = util.hash().args.period;
                    var pIndex = period.indexOf(p);
                    if (pIndex > -1) {
                        period.splice(pIndex, 1);
                    }
                    util.hash({
                        period: period.length > 0 ? period : null
                    }, true);
                });
        },
        update: function (args) {
            var periodTable = [];
            args.periods.forEach(function (p) {
                periodTable.push(
                    '<tr data-period="' + p.join(perSep) + '">' +
                        '<td>' + moment(p[0]).format('lll') + '</td>' +
                        '<td>' + moment(p[1]).format('lll') + '</td>' +
                        '<td>' + '' + '</td>' +
                        '<td>' +
                            '<button type="button" class="close">' +
                                '<span aria-hidden="true">&times;</span>' +
                            '</button>' +
                        '</td>' +
                    '</tr>'
                );
            });
            $('#period-table tbody')
                .html(periodTable);
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
        draw: function (args) {
            var barChart = {
                form: 'Reports/Bar',
                idSel: 'bar-report-chart',
                categories: [],
                series: [],
            };
            var sameItems = (
                args.items.equals(chart.prev.items)
            ) || (
                chart.prev.items = args.items,
                false
            );
            var samePeriods = (
                args.periods.equals(chart.prev.periods)
            ) || (
                chart.prev.periods = args.periods,
                false
            );
            var itemids = args.items.map(function (i) {
                return i[0]
            });
            chart.prep.done(function (chartLib) {
                // get items only if it changed
                if (!sameItems) {
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
                    var dataSkel = [];
                    var categories = [];
                    args.items.forEach(function (argItem) {
                        var item = items.filter(function (i) {
                            return i.itemid === argItem[0]
                        })[0];
                        var catName = argItem[2] ? argItem[2] : item.hosts[0].name + ': ' + item.name;
                        categories.push({
                            itemid: item.itemid,
                            func: argItem[1],
                            name: catName
                        });
                        barChart.categories.push(catName)
                    });
                    args.periods.forEach(function (p) {
                        dataSkel.push({
                            series: p.join(perSep),
                            categories: categories
                        })
                        barChart.series.push({
                            name: moment(p[0]).format('lll') + ' - ' + moment(p[1]).format('lll')
                        });
                    });
                    chartLib.destroy(barChart.idSel);
                    chartLib.init(barChart);
                    // get history data if time period or items was changed
                    if (!samePeriods || !sameItems) {
                        // Add fake deffered object for zapi requests to 
                        // always pass multiple Deferred objects to jQuery.when()
                        chart.trendsGetArr = [ $.Deferred() ];
                        args.periods.forEach(function (p, pIndex) {
                            items.forEach(function (item, iIndex) {
                                var zapiReq = zapi.req('trends.get', {
                                        itemids: item.itemid,
                                        history: item.value_type,
                                        time_from: moment(p[0]).format('X'),
                                        time_till: moment(p[1]).format('X')
                                });
                                zapiReq.itemid = item.itemid;
                                zapiReq.period = p.join(perSep);
                                chart.trendsGetArr.push(zapiReq);
                            });
                        });
                        // Process chart data after ALL history items loaded
                        chart.trendsGetArr[0].resolve(false);
                    }
                    $.when.apply(null, chart.trendsGetArr).done(function() {
                        // extract all responses except fake deferred
                        var args = Array.prototype.slice.call(arguments, 1);
                        var trendsData = args.map(function (zapiResponse) {
                            return {
                                itemid: zapiResponse[2].itemid,
                                period: zapiResponse[2].period,
                                data: zapiResponse[0].result
                            }
                        });
                        var data = procData(trendsData, dataSkel);
                        chartLib.load(data, barChart)
                        //    barChart.items.map(function (item) {
                        //        return data[item.dataSrc]
                        //    }),
                        //    barChart
                        //);
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
            function procData(trendsData, dataSkel) {
                return dataSkel.map(function (s) {
                    return s.categories.map(function (c) {
                        var data = trendsData.filter(function (td) {
                            return s.series === td.period && c.itemid === td.itemid
                        })[0].data;
                        var min = Math.min.apply(null,
                            data.map(function (d) {
                                return Number(d.value_min)
                            })
                        );
                        var max = Math.max.apply(null,
                            data.map(function (d) {
                                return Number(d.value_max)
                            })
                        );
                        var sum = data.reduce(function (sum, d) {
                                return sum + Number(d.value_avg)
                        }, 0);
                        var cnt = data.length;

                        return {
                            min: $.isNumeric(min) ? min : null,
                            max: $.isNumeric(max) ? max : null,
                            sum: sum,
                            cnt: cnt,
                            avg: cnt > 0 ? sum / cnt : null
                        };
                    });
                });
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
        var args =  {
            items: [],
            periods: [],
        };
        if (hashArgs.item) {
            hashArgs.item.forEach(function (i) {
                args.items.push(i.split(':'));
            });
        }
        if (hashArgs.period) {
            hashArgs.period.forEach(function (p) {
                args.periods.push(p.split(perSep));
            });
        }
        itemsFilter.update(args);
        periodFilter.update(args);
        chart.draw(args);
    };

    return {
        init: init,
        update: update
    }
});
