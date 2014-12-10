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
                url: 'html/' + hash.page + '.html',
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
    var hostGroups;
    var hostSelDone;
    
    hostSelector.init = function(initDone) {
        var hostGet = Zapi('host.get');
        // set selectors to disabled before ajax request
        $('#hostGroupSelect')
            .prop('disabled', true)
            .selectpicker('refresh');
        $('#hostSelect')
            .prop('disabled', true)
            .selectpicker('refresh');
        
        hostGet.done(function(zapiResponse) {
            hosts = zapiResponse.result;
            // sort hosts by name and create full host list by default
            hosts.sort(function(a, b) {
                return a.name > b.name ? 1 : -1
            })
        
            // Create host group list
            hostGroups = [];
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
            createHostGroupList()
            createHostList()
            if ($.isFunction(initDone)) {
                initDone(hosts, hostGroups);
            };
        })
    };
    hostSelector.done = function(callback) {
        hostSelDone = callback;
    };
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
                createHostList(v[0]);
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
        hostSelDone(hostSelectorArgs);
    };

    function createHostGroupList() {
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
                createHostList(selVal)
            });
    }
    function createHostList(selGroupName) {
        var hostList = [];
        var selHostNames = [];
        if (!selGroupName || selGroupName === 'All groups') {
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
            .on('change.hostSelect', function() {
                var selVal = $(this).val();
                hostSelDone({host: selVal || null});
            });
    }

    // Common part of Module pattern
    nav.hostSelector = hostSelector
    return nav
})(Page.nav);

// Monitoring/Dashboard page
(function(Monitoring) {
    var Dashboard = {}; // Object for public methods

    Dashboard.init = function(hash) {
        initGlobalSearch();
        showLastIssues();
    }
    Dashboard.hashchange = function(hash) {
        console.log(JSON.stringify(hash))
    }

    function initGlobalSearch() {
        var hostGet = Zapi('host.get', {selectInterfaces: 'extend'});

        hostGet.done(createGlobalSearchDatums);

        function createGlobalSearchDatums(zapiResponse) {
            var hosts = [];
            var hostGroups = [];
            var ip = [];
            $.each(zapiResponse.result, function(i, host) {
                hosts.push({
                    host: host.host,
                    name: host.name,
                    id: host.hostid
                });
                $.each(host.groups, function(i, group) {
                    hostGroups[group.groupid] = {
                        name: group.name,
                        id: group.groupid
                    };
                });
                $.each(host.interfaces, function(i, iface) {
                    ip.push({
                        ip: iface.ip,
                        type: apiMap.hostinterface.type[iface.type]
                    })
                });
            });
            hostGroups = hostGroups.filter(Boolean);
            $('#globalSearch input').prop('disabled', false);
            initMultidataTypeahead(hosts, hostGroups, ip);
        };
        function initMultidataTypeahead(hosts, hostGroups, ip) {
            var hostsEngine = new Bloodhound({
              datumTokenizer: Bloodhound.tokenizers.obj.whitespace('host'),
              queryTokenizer: Bloodhound.tokenizers.whitespace,
              local: hosts
            });
            var hostGroupsEngine = new Bloodhound({
              datumTokenizer: Bloodhound.tokenizers.obj.whitespace('name'),
              queryTokenizer: Bloodhound.tokenizers.whitespace,
              local: hostGroups
            });
            var ipEngine = new Bloodhound({
              datumTokenizer: Bloodhound.tokenizers.obj.whitespace('ip'),
              queryTokenizer: Bloodhound.tokenizers.whitespace,
              local: ip
            });
             
            hostsEngine.initialize();         
            hostGroupsEngine.initialize();         
            ipEngine.initialize();         
            $('#globalSearch .typeahead')
                .typeahead({
                    highlight: true,
                }, {
                    name: 'hosts',
                    displayKey: 'host',
                    source: hostsEngine.ttAdapter(),
                    templates: {
                        header: '<span class="typeahead-multidata-group">Hosts</span>'
                    }
                }, {
                    name: 'hostGroups',
                    displayKey: 'name',
                    source: hostGroupsEngine.ttAdapter(),
                    templates: {
                        header: '<span class="typeahead-multidata-group">Host groups</span>'
                    }
                }, {
                    name: 'ip',
                    displayKey: 'ip',
                    source: ipEngine.ttAdapter(),
                    templates: {
                        header: '<span class="typeahead-multidata-group">ip</span>'
                    }
                })
                .on('typeahead:selected', function(e, selObj, selGr) {
                    console.log(selObj, selGr)
                });
        };
    };
    function showLastIssues() {
        var req = {
            monitored: 1,
            filter: {
                value: 1
            },
            skipDependent: 1,
            output: [
                'triggerid',
                'state',
                'error',
                'url',
                'expression',
                'description',
                'priority',
                'lastchange'
            ],
            selectHosts: [
                'hostid',
                'name'
            ],
            selectLastEvent: [
                'eventid',
                'acknowledged',
                'objectid',
                'clock',
                'ns'
            ],
            limit: 20
        };
        var triggerGet = Zapi('trigger.get', req);

        triggerGet.done(createStatusTable);

        function createStatusTable(zapiResponse) {
console.log(zapiResponse)
            var dataMap = {
                hosts: function(hosts) {
                    var hostNames = [];
                    $.each(hosts, function(i, host) {
                        hostNames.push(host.name)
                    });
                    return {
                        host: hostNames.join(', ')
                    }
                },
                lastchange: function(unixtime) {
                    var d = moment(unixtime * 1000);
                    return {
                        lastchange: d.format('lll'),
                        age: d.fromNow()
                    }
                },
                lastEvent: function(v, e) {
                    return {
                        ack: apiMap.event.acknowledged[v.acknowledged]
                    }
                },
                //source: function(src) {
                //    return {
                //        type: apiMap.event.source[src]
                //    }
                //},
                //priority: function(v) {
                //},
                //value: function(v, e) {
                //    return {
                //        value: apiMap.event.value[e.source][v]
                //    }
                //},
                //relatedObject: function(ro, e) {
                //    return {
                //        description: ro.description,
                //        severity: apiMap.trigger.priority[ro.priority]
                //    }
                //},
                //acknowledged: function(ack) {
                //    return {
                //        acknowledged: apiMap.event.acknowledged[ack]
                //    }
                //}
            };
            var tdMap = {
                description: function(row) {
                    var td = [
                        '<td>' + row.description + '</td>',
                        '<td class="info">' + row.description + '</td>',
                        '<td class="warning">' + row.description + '</td>',
                        '<td class="warning text-danger">' + row.description + '</td>',
                        '<td class="danger">' + row.description + '</td>',
                        '<td class="danger text-danger">' + row.description + '</td>'
                    ];
                    return td[row.priority]
                },
                host: function(row) {
                    return '<td><a href="#!Inventory/Hosts&host=' + row.host + '">' + row.host + '</a></td>'
                }
            };

            createTableData(zapiResponse.result);

            function createTableData(zapiResult) {
                var data = [];
                $.each(zapiResult, function(i, event) {
                    var row = {};
                    $.each(event, function(e, v) {
                        dataMap[e] ? $.extend(row, dataMap[e](v, event)) : row[e] = v;
                    })
                    data.push(row);
                });
                createTable(data);
            };
            function createTable(data) {
                var thead = [];
                var tbody = [];
                if (data.length > 0) {
                    $('#lastIssues th').each(function() {
                        thead.push(this.abbr)
                    })
                    $.each(data, function(i, row) {
                        var tr = [];
                        $.each(thead, function(i, th) {
                            if (tdMap[th]) {
                                tr.push(tdMap[th](row));
                            } else {
                                tr.push('<td>' + row[th] + '</td>');
                            }
                        });
                        tbody.push('<tr>'+tr.join('')+'</tr>')
                    });
                    $('#lastIssues tbody')
                        .empty()
                        .append(tbody.join(''))
                    $('#lastIssues .panel-body').hide();
                    $('#lastIssues table').show();
                }
            };
        }
    };

    Monitoring.Dashboard = Dashboard
    return Monitoring
})(Page.Monitoring);

// Monitoring/Triggers page
(function(Monitoring) {
    var Triggers = {}; // Object for public methods
    var data = {};// work data
    //var hash = {}; // Each page has own arguments
    var hostSelector = Page.nav.hostSelector; // Shorthands
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
        hostSelector.init(function(hosts, hostGroups) {
            data.hosts = hosts;
            data.hostGroups = hostGroups;
            hostSelector.set(hashArgs);
            setTriggersReqParams(hashArgs)
        });
        hostSelector.done(function(selected) {
            Util.setHash(selected);
        });

        filter.init(function(filterArgs) {
            Util.setHash(filterArgs);
        });
        filter.set(hashArgs);
    };
    Triggers.hashChange = function(hashArgs) {
        filter.set(hashArgs);
        hostSelector.set(hashArgs);
        setTriggersReqParams(hashArgs); 
    };
    
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
        var triggerGet = Zapi('trigger.get', reqParams)
        $('#triggers th').each(function() {
            thead.push(this.abbr)
        })
        $('#triggers')
            .fadeTo('fast', 0.2)
        triggerGet.done(function(zapiResponse) {
            $.each(zapiResponse.result, function(i, trigger) {
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
            $('#triggers')
                .fadeTo('fast', 1)
        });
    }
    
    Monitoring.Triggers = Triggers;
    return Monitoring
})(Page.Monitoring);

// Monitoring/Events page
(function(Monitoring) {
    var Events = {}; // Object for public methods
    var data = {};
    var hostSelector = Page.nav.hostSelector; // Shorthands
    var filter = {
        init: function(changeHashArgs) {
            filter.callback = changeHashArgs;
            $('#filterEventType')
                .on('change', function() {
                    var v = $(this).val().split('.');
                    changeHashArgs({
                        source: +v[0] || null,
                        object: +v[1] || null
                    });
                });
        },
        set: function(hashArgs) {
            var filterArgs = {};
            var map = {
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
            });
        }
    };

    Events.init = function(hashArgs) {
        hostSelector.init(function(hosts, hostGroups) {
            data.hosts = hosts;
            data.hostGroups = hostGroups;
            hostSelector.set(hashArgs);
            setEventsReqParams(hashArgs)
        });
        hostSelector.done(function(selected) {
            Util.setHash(selected);
        });

        filter.init(function(filterArgs) {
            Util.setHash(filterArgs);
        });
        filter.set(hashArgs);
    }
    Events.hashChange = function(hashArgs) {
        filter.set(hashArgs);
        hostSelector.set(hashArgs);
        setEventsReqParams(hashArgs); 
    }
    
    function setEventsReqParams(args) {
        var reqParams = {
            //filter: {
            //    'value': 1
            //},
            //only_true: true,
            //skipDependent: true,
            //active: true,
            //monitored: true
            //search: {description: 'ping'}
            limit: 10,
            selectRelatedObject: 'extend',
            expandExpression: true
        };
        var map = {
            eventid: function(v) {
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
            },
            objectid: function(v) {
            },
            //object: function(v) {
            //},
            acknowledged: function(v) {
            },
            eventid_from: function(v) {
            },
            eventid_till: function(v) {
            },
            //source: function(v) {
            //    reqParams.source = +v
            //},
            time_from: function(v) {
            },
            time_till: function(v) {
            },
            value: function(v) {
            }
        }
        $.each(args, function(k, v) {
            map[k] ? map[k](v) : reqParams[k] = v[0];
        });
        createStatusTable(reqParams);
    }
    function createStatusTable(reqParams) {
        var thead = [];
        var dataMap = {
            clock: function(unixtime) {
                var d = moment(unixtime * 1000);
                return {
                    clock: d.format('lll'),
                    age: d.fromNow()
                }
            },
            hosts: function(hosts, row) {
                var hostNames = [];
                $.each(hosts, function(i, host) {
                    hostNames.push(host.host)
                });
                return {
                    host: hostNames.join(', ')
                }
            },
            source: function(src) {
                return {
                    type: apiMap.event.source[src]
                }
            },
            priority: function(v) {
            },
            value: function(v, e) {
                return {
                    value: apiMap.event.value[e.source][v]
                }
            },
            relatedObject: function(ro, e) {
                return {
                    description: ro.description,
                    severity: apiMap.trigger.priority[ro.priority]
                }
            },
            acknowledged: function(ack) {
                return {
                    acknowledged: apiMap.event.acknowledged[ack]
                }
            }
        };
        var htmlMap = {
            value: function(th, row) {
                var color = {
                    'OK': '<td class="success">OK</td>',
                    'Problem': '<td class="danger">Problem</td>'
                }
                return color[row[th]]
            },
            severity: function(th, row) {
                var cl = {
                    'Not classified': '<td>Not classified</td>',
                    'Information': '<td class="info">Information</td>',
                    'Warning': '<td class="warning">Warning</td>',
                    'Average': '<td class="warning text-danger">Average</td>',
                    'High': '<td class="danger">High</td>',
                    'Disaster': '<td class="danger text-danger">Disaster</td>'
                };
                return cl[row[th]]
            }
        };
        var eventGet = Zapi('event.get', reqParams)

        $('#events th').each(function() {
            thead.push(this.abbr)
        })
        eventGet.done(function(zapiResponse) {
            console.log('event.get', reqParams, zapiResponse.result)
            var data = [];
            $.each(zapiResponse.result, function(i, event) {
                var row = {};
                $.each(event, function(e, v) {
                    dataMap[e] ? $.extend(row, dataMap[e](v, event)) : row[e] = v;
                })
                data.push(row);
            });
            createTable(data);
        });
        function createTable(data) {
            var tbody = [];
            $.each(data, function(i, row) {
                var tr = [];
                $.each(thead, function(i, th) {
                    if (htmlMap[th]) {
                        tr.push(htmlMap[th](th, row));
                    } else {
                        tr.push('<td>' + row[th] + '</td>');
                    }
                });
                tbody.push('<tr>'+tr.join('')+'</tr>')
            });
            $('#events tbody')
                .empty()
                .append(tbody.join(''))
        };
    }
    
    Monitoring.Events = Events;
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

