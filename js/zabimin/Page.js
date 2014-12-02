"use strict";

var Page = (function () {
    var current;
    //  Function for load content from url and put in $('#ajaxPage') block
    var load = function () {
        var hash = Util.parseHash();
        var page = Page;
        // default page here
        //if (!hash.page) {
        //    hash.page = 'Monitoring/Dashboard';
        //}
        $.each(hash.page.split('/'), function(i, p) {
            if (page[p]) {
                page = page[p];
            } else {
                return false
            }
        });
        // Check if we have same page    
        if (hash.page === current) {
            page.hashChange && page.hashChange(hash.args);
        } else {
            // Update global hash variable
            current = hash.page;
            // load page
            var jqxhr = $.ajax({
                mimeType: 'text/html; charset=utf-8', // ! Need set mimeType only when run from local file
                url: 'ajax/' + hash.page + '.html',
                type: 'GET',
                dataType: "html"
            });
            jqxhr.done(function(data) {
                    anyPageInit(data)
                    // Exec js code for ajax page
                    page.init && page.init(hash.args);
            });
        }
    };
    function anyPageInit(data) {
        $('#ajaxPage')
            .spin('off')
            .html(data);
        // Load classes for ajax pages
        $('.selectpicker').selectpicker()
        $('.datetimepicker').datetimepicker({
            useCurrent: false,
            language: localStorage.lang
        })
    };

    return {
        current: current,
        load: load,
        nav: {},
        // Sections
        Monitoring: {},
        Inventory: {},
        Reports: {},
        Configuration: {},
        Administration: {}
    }
})();

// host selector widget
(function(nav) {
    var hostSelector = {};//Object for public methods
    var hosts;
    var hostGroups = [];
    var selHosts = [];
    var selHostGroups = [];
    var callback;
    
    hostSelector.init = function(hostSelDone, initDone) {
        callback = hostSelDone;
        // set selectors to disabled before ajax request
        $('#hostGroupSelect')
            .prop('disabled', true)
            .selectpicker('refresh');
        $('#hostSelect')
            .prop('disabled', true)
            .selectpicker('refresh');
        
        var hostGet = Zapi.host.get();
        //Util.zapi([req], function(zapiResponse) {
        hostGet.done(function(zapiResponse) {
            hosts = zapiResponse.result;
            // sort hosts by name and create full host list by default
            hosts.sort(function(a, b) {
                return a.name > b.name ? 1 : -1
            })
        
            // Create host group list
            $.each(hosts, function(i, host) {
                // fill host group list
                $.each(host.groups, function(i, group) {
                    if (hostGroups[group.groupid]) {
                        hostGroups[group.groupid].hosts.push(host)
                    } else {
                        hostGroups[group.groupid] = $.extend(group, { hosts: [] })
                    }
                })
            });
            // remove undefined and sort host group list
            hostGroups = hostGroups.filter(Boolean)
            hostGroups.sort(function(a, b) {
                return a.name > b.name ? 1 : -1
            })
            // anyway create full host group list
            createHostGroupList(hostSelDone)
            createHostList()
            if ($.isFunction(initDone)) {
                initDone(hosts, hostGroups);
            };
        })
    }
    // set selectors on hash url
    hostSelector.set = function(hashArgs) {
        var hostSelectorArgs = {};
        var map = {
            host: function(v) {
                $('#hostSelect')
                    .selectpicker('val', v)
            },
            hostgroup: function(v) {
                $('#hostGroupSelect')
                    .selectpicker('val', v[0])
                createHostList(v[0], callback);
            },
            hostid: function(v) {
            },
            hostgroupid: function(v) {
            }
        };
        $.each(hashArgs, function(k, v) {
            if (map[k]) {
                map[k](v);
                hostSelectorArgs[k] = v;
            };
        });
        callback(hostSelectorArgs);
    }
    //// set selectors on hash url and fire events
    //hostSelection.change = function(hash) {
    //    if (hash.hostgroup) {
    //        $.each(selHostGroups, function(i, hostGroup) {
    //            //if ($.inArray
    //        });
    //        selHostGroupNames.sort()
    //        
    //        $('#hostGroupSelect')
    //            .selectpicker('val', hash.hostgroup[0])
    //        selHostGroups = $.grep(hostGroups, function(hostGroup) {
    //            return $.inArray(hostGroup.name, hash.hostgroup) > -1
    //        })
    //    } else {
    //        selHostGroups = hostGroups
    //    }
    //    if (hash.host) {
    //        $('#hostSelect')
    //            .selectpicker('val', hash.host)
    //        selHosts = $.grep(hosts, function(host) {
    //            return $.inArray(host.host, hash.host) > -1
    //        })
    //    } else {
    //        selHosts = []
    //    }
    //    selectionDone(selHosts, selHostGroups)
    //}
    function createHostGroupList(hostSelDone) {
        var hostGroupList = ['<option>All groups</option>']
        $.each(hostGroups, function(i, hostGroup) {
            hostGroupList.push('<option>'+hostGroup.name+'</option>')
        })
        // on each zapi request unbind events listener and bind new one
        $('#hostGroupSelect')
            .prop('disabled', false)
            .empty()
            .append(hostGroupList.join(''))
            .selectpicker('refresh')
            .off('change.hostGroupSelect')
            //.on('change.hostGroupSelect', onHostGroupListChange);
            .on('change.hostGroupSelect', function() {
                var selVal = $(this).val();
                if (selVal === 'All groups') {
                    hostSelDone({hostgroup: null, host: null});
                } else {
                    hostSelDone({hostgroup: selVal, host: null});
                }
                createHostList(selVal, hostSelDone)
            });
    }
    function onHostGroupListChange() {
        var selVal = $(this).val();
        if (selVal && selVal != 'All groups') {
            selHostGroups = $.grep(hostGroups, function(hostGroup) {
                return hostGroup.name === selVal
            })
        } else {
            selHostGroups = hostGroups
        }
        createHostList()
        selHosts = []
        callback({hostgroups: selHostGroups})
    }
    function createHostList(selGroupName, hostSelDone) {
        var hostList = [];
        var selHostNames = [];
        //$.each(selHostGroups, function(i, selHostGroup) {
        //    $.each(selHostGroup.hosts, function(i, host) {
        //        selHostNames.push(host.name);
        //    });
        //});
        //selHostNames = $.grep(selHostNames, function(v, k){
        //    return $.inArray(v, selHostNames) === k;
        //});
        if (selGroupName === 'All groups') {
            $.each(hosts, function(i, host) {
                selHostNames.push(host.host);
            });
        } else {
            $.each(hostGroups, function(i, hostGroup) {
                if (hostGroup.name === selGroupName) {
                    $.each(hostGroup.hosts, function(i, host) {
                        selHostNames.push(host.host);
                    });
                };
            });
        }
        $.each(selHostNames, function(i, hostName) {
            hostList.push('<option>'+hostName+'</option>')
        })
        $('#hostSelect')
            .prop('disabled', false)
            .empty()
            .append(hostList.join(''))
            .selectpicker('refresh')
            .off('change.hostSelect')
            //.on('change.hostSelect', onHostListChange);
            .on('change.hostSelect', function() {
                var selVal = $(this).val();
                hostSelDone({host: selVal || null});
            });
    }
    function onHostListChange() {
        var selVal = $(this).val();
        if (selVal && selVal != 'No host') {
            selHosts = $.grep(hosts, function(host) {
                return $.inArray(host.host, selVal) > -1
            })
        }
        callback({host: selHosts})
    }

    // Common part of Module pattern
    nav.hostSelector = hostSelector
    return nav
})(Page.nav);

// Monitoring/Dashboard page
(function(Monitoring) {
    var Dashboard = {}; // Object for public methods
    var hash = {};
    Dashboard.init = function(hash) {
        console.log(JSON.stringify(hash))
    }

    Monitoring.Dashboard = Dashboard
    return Monitoring
})(Page.Monitoring);

// Monitoring/Triggers page
(function(Monitoring) {
    var Triggers = {}; // Object for public methods
    var data = {};// work data
    var hash = {}; // Each page has own arguments
    var filter = {
        init: function(changeHashArgs) {
            filter.callback = changeHashArgs;
            $('#filterTriggerStatus')
                .on('change', function() {
                    changeHashArgs({
                        triggerStatus: $(this).val() || null
                    });
                })
            $('#filterAcknowledgeStatus')
                .on('change', function() {
                    changeHashArgs({
                        acknowledgeStatus: $(this).val() || null
                    });
                });
            $('#filterEvents')
                .on('change', function() {
                    changeHashArgs({
                        events: $(this).val() || null
                    });
                });
            $('#filterMinSeverity')
                .on('change', function() {
                    changeHashArgs({
                        minSeverity: $(this).val() || null
                    });
                });
            $('#filterLastChangeSince')
                .on('dp.change', function(e) {
                    var m =  moment(e.date);
                    changeHashArgs({
                        lastChangeSince: m.format('YYYY-MM-DD')
                    });
                    $('#filterLastChangeTill').data("DateTimePicker").setMinDate(e.date);
                })
                .on('click', '.datetimepicker-clear', function() {
                    changeHashArgs({
                        lastChangeSince: null
                    });
                    $('#filterLastChangeSince').find('input').val('')
                });
            $('#filterLastChangeTill')
                .on('dp.change', function(e) {
                    var m =  moment(e.date);
                    changeHashArgs({
                        lastChangeTill: m.format('YYYY-MM-DD')
                    });
                    $('#filterLastChangeSince').data("DateTimePicker").setMaxDate(e.date);
                })
                .on('click', '.datetimepicker-clear', function() {
                    changeHashArgs({
                        lastChangeTill: null
                    });
                    $('#filterLastChangeTill').find('input').val('')
                });
            $('#filterByName')
                .on('click', 'button', function() {
                    var searchPattern = $('#filterByName input').val()
                    searchPattern = searchPattern.replace('=', ' ').replace('&', ' ')
                    changeHashArgs({
                        byName: searchPattern
                    });
                });
            $('#filterShowDetails')
                .on('change', function() {
                    changeHashArgs({
                        showDetails: $(this).is(':checked') || null
                    });
                });
            $('#filterMaintenance')
                .on('change', function() {
                    changeHashArgs({
                        maintenance: $(this).is(':checked') || null
                    });
                });
            $('#filterReset')
                .on('click', function(e) {
                    e.preventDefault();
                    filter.reset();
                });
        },
        set: function(hashArgs) {
            var filterArgs = {};
            // we need only filter args
            var map = {
                triggerStatus: function(v) {
                    $('#filterTriggerStatus').selectpicker('val', v)
                },
                acknowledgeStatus: function(v) {
                    $('#filterAcknowledgeStatus').selectpicker('val', v)
                },
                events: function(v) {
                    $('#filterEvents').selectpicker('val', v)
                },
                minSeverity: function(v) {
                    $('#filterMinSeverity').selectpicker('val', v)
                },
                lastChangeSince: function(v) {
                    $('#filterLastChangeSince input').val(v)
                },
                lastChangeTill: function(v) {
                    $('#filterLastChangeTill input').val(v)
                },
                byName: function(v) {
                    $('#filterByName input').val(v)
                },
                showDetails: function(v) {
                    $('#filterShowDetails').prop('checked', v)
                },
                maintenance: function(v) {
                    $('#filterMaintenance').prop('checked', v)
                }
            };
            $.each(hashArgs, function(k, v) {
                if (map[k]) {
                    map[k](v[0]);
                    filterArgs[k] = v;
                };
            });
            filter.callback(filterArgs)
        },
        reset: function() {
            filter.callback({
                triggerStatus: null,
                acknowledgeStatus: null,
                events: null,
                minSeverity: null,
                lastChangeSince: null,
                lastChangeTill: null,
                byName: null,
                showDetails: null,
                maintenance: null
            });
            $('#filterTriggerStatus').selectpicker('val', '')
            $('#filterAcknowledgeStatus').selectpicker('val', '')
            $('#filterEvents').selectpicker('val', '')
            $('#filterMinSeverity').selectpicker('val', '')
            $('#filterLastChangeSince input').val('')
            $('#filterLastChangeTill input').val('')
            $('#filterByName input').val('')
            $('#filterShowDetails').prop('checked', false)
            $('#filterMaintenance').prop('checked', false)
        }
    };

    Triggers.init = function(hashArgs) {
        Page.nav.hostSelector.init(hostSelDone, hostSelInit)

        filter.init(function(filterArgs) {
            console.log('filterArgs callback: ', filterArgs)
            Util.setHash(filterArgs);
        });
        filter.set(hashArgs);


        function hostSelDone(selected) {
            console.log('hostSelector callback: ', selected)
            Util.setHash(selected);
        };
        function hostSelInit(hosts, hostGroups) {
            console.log('hostSelector init: ', hosts, hostGroups)
            data.hosts = hosts;
            data.hostGroups = hostGroups;
            Page.nav.hostSelector.set(hashArgs);
            setTriggersReqParams(hashArgs)
        };
    }
    Triggers.hashChange = function(hashArgs) {
        filter.set(hashArgs);
        //Page.nav.hostSelector.set(hashArgs);
        setTriggersReqParams(hashArgs); 
    }
    
    function separateHashArgs(args, mod) {
        var hashArgsMap = {
            filter: [
                'triggerStatus',
                'acknowledgeStatus',
                'events',
                'minSeverity',
                'lastChangeSince',
                'lastChangeTill',
                'byName',
                'showDetails',
                'maintenance'
            ],
            hostSelector: [
                'host',
                'hostgroup',
                'hostid',
                'groupid'
            ]
        };
        var refArgs = $.grep(args, function(k, v) {
            return $.inArray(k, hashArgsMap[mod]) > -1
        });
        return refArgs
    };

    function convertSelectedHostData(selectedHostData) {
        triggerGetReqParams.hostids = [];
        $.each(selectedHostData.hosts, function(i, host) {
            if (host.selected) {
                triggerGetReqParams.hostids.push(host.hostid)
            }
        });
        if (triggerGetReqParams.hostids.length === 0) {
            delete triggerGetReqParams.hostids
        }
        triggerGetReqParams.groupids = [];
        $.each(selectedHostData.hostGroups, function(i, hostGroup) {
            if (hostGroup.selected) {
                triggerGetReqParams.groupids.push(hostGroup.groupid)
            }
        });
        if (triggerGetReqParams.groupids.length === 0) {
            delete triggerGetReqParams.groupids
        }
    }
    function setTriggersReqParams(args) {
        var reqParams = {
            //filter: {
            //    'value': 1
            //},
            only_true: true,
            skipDependent: true,
            //active: true,
            monitored: true
            //search: {description: 'ping'}
        };
        var map = {
            triggerStatus: function(v) {
                if (v[0] == 'Problem') {
                    reqParams.filter = {value: 1};
                }
                if (v[0] == 'Any') {
                    delete reqParams.only_true;
                }
            },
            acknowledgeStatus: function(v) {
                var map = {
                    Acknowledged: 'withAcknowledgedEvents',
                    Unacknowledged: 'withUnacknowledgedEvents',
                    LastUnacknowledged: 'withLastEventUnacknowledged'
                };
                reqParams[map[v[0]]] = true;
            },
            events: function(v) {
            },
            minSeverity: function(v) {
                var severity = {
                    'Not classified': 0,
                    'Information': 1,
                    'Warning': 2,
                    'Average': 3,
                    'High': 4,
                    'Disaster': 5
                };
                reqParams.min_severity = severity[v[0]];
            },
            lastChangeSince: function(v) {
                var timestamp = new Date(v[0]).getTime() / 1000;
                reqParams.lastChangeSince = timestamp;
            },
            lastChangeTill: function(v) {
                var timestamp = new Date(v[0]).getTime() / 1000;
                reqParams.lastChangeTill = timestamp;
            },
            byName: function(v) {
                reqParams.search = {description: v[0]};
            },
            showDetails: function(v) {
                reqParams.expandExpression = !!v[0];
            },
            maintenance: function(v) {
                reqParams.maintenance = !!v[0];
            },
            host: function(v) {
                reqParams.hostids = [];
                $.each(v, function(i, hostname) {
                    $.each(data.hosts, function(i, host) {
                        if (hostname === host.host) {
                            reqParams.hostids.push(host.hostid)
                        }
                    });
                });
            },
            hostgroup: function(v) {
                reqParams.groupids = [];
                $.each(v, function(i, groupname) {
                    $.each(data.hostGroups, function(i, group) {
                        if (groupname === group.name) {
                            reqParams.groupids.push(group.groupid)
                        }
                    });
                });
            }
        }
        $.each(args, function(k, v) {
            map[k] && map[k](v);
        });
        createStatusTable(reqParams);
    }
    function createStatusTable(reqParams) {
        console.log(reqParams)
        var thead = [];
        var tbody = [];
        var rowDataMap = {
            lastchange: function(rowData, unixtime) {
                var d = moment(unixtime * 1000);
                rowData.lastchange = d.format('lll')
                rowData.age = d.fromNow()
            },
            hosts: function(rowData, hostsArray) {
                rowData.hosts = hostsArray[0].host
            },
            priority: function(rowData, priority) {
                rowData.priority = [
                    'info',
                    'info',
                    'warning',
                    'warning',
                    'danger',
                    'danger'][priority];
                rowData.severity = [
                    'Not classified',
                    'Information',
                    'Warning',
                    'Average',
                    'High',
                    'Disaster'
                ][priority];
            },
            value: function(rowData, val) {
                rowData.value = [
                    '<span class="text-success">OK</span>',
                    '<span class="text-danger">Problem</span>'
                ][val];
            }
        };
        $('#triggers th').each(function() {
            thead.push(this.abbr)
        })
        //Util.zapi([req], function(zapiResponse) {
        Zapi.trigger.get(reqParams, function(zapiResponse) {
            $.each(zapiResponse[0].result, function(i, trigger) {
                var tr = [];
                var rowData = {};
                $.each(trigger, function(k, v) {
                    if (rowDataMap[k]) {
                        rowDataMap[k](rowData, v)
                    } else {
                        rowData[k] = v
                    }
                })
                $.each(thead, function(i, th) {
                    tr.push('<td>' + rowData[th] + '</td>')
                })
                tbody.push('<tr class="'+rowData.priority+'">'+tr.join('')+'</tr>')
            })
            $('#triggers tbody')
                .empty()
                .append(tbody.join(''))
        })
    }
    
    Monitoring.Triggers = Triggers;
    return Monitoring
})(Page.Monitoring);

// Graphs
(function(Monitoring) {
    var hash = {};
    var Graphs = {};
    Graphs.init =  function() {
        this.createHostSelector(hash, function(data) {
            if (hash.host) {
                var selHost = $.grep(data.hosts, function(host) {
                    return host.host == hash.host
                })[0]
                // sort graphs by name
                selHost.graphs.sort(function(a, b) {
                    return a.name > b.name ? 1 : -1
                })
                var selGraphs = [], thumbGraphs = [];
                $("#graphList")
                    .empty()
                $.each(selHost.graphs, function(i, thumbGraph) {
                    var o = {
                        type: 'thumbnail',
                        div: 'graphThumb-' + i,
                        host: selHost.host,
                        graph: thumbGraph
                    }
                    var h = util.createHash({
                        page: hash.page,
                        host: selHost.host,
                        graph: thumbGraph.name
                    })
                    $("#graphList")
                        .append('<li><a id="'+o.div+'" href="'+h+'" class="graph-thumbnail pull-left"></a></li>')
                    chart.getData(o)
                })
            }
            if (hash.host && hash.graph) {
                var o = {
                    type: 'history',
                    div: 'graph',
                    host: hash.host,
                    graph: hash.graph
                }
                $("#graphs").append('<div id="'+o.div+'" class="graph"></div>')
                chart.getData(o)
            }
        })
    }

    Page.Graphs = Graphs
    return Page
})(Page.Monitoring);

/********************************* Errors ***********************************/
// 404
(function(Page) {
    var name = 'E404';
    var hash = {};
    
    Page.E404 = {
        name: name,
        hash: hash
    }
    return Page
})(Page || {});

