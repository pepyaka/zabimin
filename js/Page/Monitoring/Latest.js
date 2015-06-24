// Monitoring/Triggers page
define(['Zapi', 'Util', 'moment', 'bootstrap-table', 'bootstrap-select'], function(zapi, util, moment) {
    "use strict";

    var page = '#!Monitoring/Latest';

    var filter = {
        prep: $.Deferred(),
        init: function(hosts, groups, apps) {
            var hostGet = zapi.req('host.get', {
                selectGroups: ['name'],
                selectApplications: 'extend'
            });
            $('.selectpicker')
                .selectpicker()
            $('[data-hash-arg]')
                .on('change', function(e) {
                    var $this = $(this);
                    var val = $this.val() || null;
                    var hashArg = {};
                    if ($this.prop('type') === 'checkbox') {
                        val = $this.prop('checked') || null
                    }
                    hashArg[$this.data('hashArg')] =  val;
                    util.hash(hashArg, true);
                });
            $('[type=reset]')
                .on('click', function() {
                    util.hash(null, true)
                });
            hostGet.done(function(zapiResponse) {
                var hosts = zapiResponse.result;
                var groups = [];
                var groupList = [];
                hosts.forEach(function(host) {
                    host.groups.forEach(function(g) {
                        if (groups[g.groupid]) {
                            groups[g.groupid].hosts.push(host);
                        } else {
                            groups[g.groupid] = g;
                            groups[g.groupid].hosts = [host];
                        }
                    });
                });
                // Remove sparse
                groups = groups.filter(Boolean);
                groups.sort(function(a, b) {
                    return a.name > b.name ? 1 : -1
                });
                groups.forEach(function (g) {
                    groupList.push(
                        '<option value="' + g.groupid + '">' +
                            g.name +
                        '</option>'
                    );
                });
                $('.selectpicker')
                    .prop('disabled', false)
                $('[data-hash-arg="groupid"]')
                    .append(groupList)
                    .selectpicker('refresh')
                filter.prep.resolve(groups, hosts);
            });
        },
        update: function(groups, hosts, hashArgs) {
            var selHosts = hosts;
            var selApps = [];
            if (hashArgs.groupid) {
                selHosts = groups.filter(function(g) {
                    return g.groupid === hashArgs.groupid[0]
                })[0].hosts;
            }
            selHosts.forEach(function(h) {
                selApps = selApps.concat(h.applications.map(function(a) {
                        return a.name
                }));
            });
            // Uniq app names array
            selApps = selApps.filter(function(v, i, s) {
                return s.indexOf(v) === i
            });
            selApps.sort(function(a, b) {
                return a.toLowerCase() > b.toLowerCase() ? 1 : -1
            });
            
            $('[data-hash-arg="groupid"]')
                .val(hashArgs.groupid && hashArgs.groupid[0])
                .selectpicker('refresh');
            $('[data-hash-arg="hostid"]')
                .html(
                     selHosts.map(function(h) {
                         return (
                             '<option value="' + h.hostid + '">' +
                                h.name +
                             '</option>'
                         )
                     })
                )
                .val(hashArgs.hostid ? hashArgs.hostid : '')
                .selectpicker('refresh');
            $('[data-hash-arg="app"]')
                .html(
                    '<option value="">Nothing selected</option>' +
                     selApps.map(function(a) {
                         return (
                             '<option value="' + a + '">' +
                                a +
                             '</option>'
                         )
                     })
                )
                .val(hashArgs.app ? hashArgs.app[0] : '')
                .selectpicker('refresh');
            $('[data-hash-arg="name"]')
                .val(hashArgs.name && hashArgs.name[0])
        }
    };
    var table = {
        init: function() {
            var columns = [{
                    checkbox: true,
                    formatter: function(undefined, i) {
                        if (i.value_type !== "0" && i.value_type !== "3" ) {
                            return {
                                disabled: true
                            }
                        }
                    },
                }, {
                    formatter: function(hosts) {
                        return hosts[0].name
                    },
                    sorter: function(a, b) {
                        return a > b ? -1 : 1
                    }
                }, {
                    formatter: function(apps) {
                        return apps.map(function(a) {
                            return a.name
                        }).join(', ')
                    }
                }, {
                    formatter: function(name, i) {
                        var link = '#!Monitoring/Latest/Data&itemid=' + i.itemid;
                        var desc = i.description || name;
                        if (i.value_type === "0" || i.value_type === "3" ) {
                            return '<a href="'+link+'" class="hint--top hint--rounded" data-hint="'+desc+'">'+name+'</a>'
                        } else {
                            return name
                        }
                    }
                }, {
                }, {
                }, {
                }, {
                    formatter: function(type) {
                        return zapi.map('Item', 'type', type).value
                    }
                }, {
                    formatter: function(lastclock) {
                        var v = '-';
                        if (lastclock != 0) {
                            v = moment(lastclock, 'X').format('lll');
                        }
                        return v
                    }
                }, {
                    formatter: function(lv, i) {
                        var v = util.showUnit(lv, i.units);
                        v = v[0] + ' ' + v[1] + v[2]
                        if (lv.length > 16) {
                            v = '<span class="hint--left hint--rounded" data-hint="'+lv+'">'+lv.slice(0,16)+'...</span>'
                        }
                        return v
                    }
                }, {
                    formatter: function(prevvalue, item) {
                        var v = '-';
                        if (item.value_type == 0 || item.value_type == 3) {
                            v = (item.lastvalue - prevvalue).toLocaleString() + ' '
                        }
                        return v + item.units
                    }
                }, {
                    formatter: function(error) {
                        return error ? '<span class="label label-danger hint--left hint--rounded hint--error" data-hint="'+error+'">Error</span>' : ''
                    }
            }];
            $('#items')
                .bootstrapTable({
                    search: true,
                    clickToSelect: true,
                    showToggle: true,
                    showColumns: true,
                    showPaginationSwitch: true,
                    pagination: true,
                    pageSize: 20,
                    pageList: [10, 20, 50, 100],
                    columns: columns
                })
                .css('opacity', 0.3)
                .on('check.bs.table uncheck.bs.table', function(e) {
                    var allSel = $(this).bootstrapTable('getAllSelections');
                    var itemids = allSel.map(function(r) {
                        return r.itemid
                    });
                    $('#graph-links a').each(function() {
                        var $a = $(this);
                        $a.prop('href', $a.data('href') + '&itemid=' + itemids.join(','))
                        if (itemids.length > 0) {
                            $a.removeClass('disabled');
                        } else {
                            $a.addClass('disabled');
                        }
                    });
                })
                       
        },
        update: function(hash) {
            var itemid = hash.hostid || hash.groupid || hash.host
                || hash.group || hash.application || hash.name
                ? null : 0;
            var itemGet = zapi.req('item.get', {
                itemids: itemid,
                hostids: hash.hostid,
                groupids: hash.groupid,
                host: hash.host && hash.host[0],
                group: hash.group && hash.group[0],
                application: hash.app && hash.app[0],
                search: {
                    name: hash.name && hash.name[0]
                },
                filter: {
                    status: 0
                },
                output: [
                    'name',
                    'description',
                    'delay',
                    'history',
                    'trends',
                    'type',
                    'lastclock',
                    'units',
                    'lastvalue',
                    'value_type',
                    'prevvalue',
                    'error'
                ],
                //selectGraphs: 'count',
                //with_monitored_items: true,
                //preservekeys: true,
                selectApplications: ['name'],
                selectHosts: ['name'],
                monitored: true,
                limit: 10000
            });
            $('#items')
                .fadeTo('fast', 0.3)
            itemGet.done(function(zapiResponse) {
                $('#items')
                    .bootstrapTable('load', zapiResponse.result)
                    .fadeTo('fast', 1)
            });
        }
    };

    var init = function(hashArgs) {
        filter.init(hashArgs);
        table.init();
        update(hashArgs);
    };
    var update = function(hashArgs) {
        filter.prep.done(function (groups, hosts) {
            filter.update(groups, hosts, hashArgs);
        });
        table.update(hashArgs);
    };

    return {
        init: init,
        update: update
    }
});
