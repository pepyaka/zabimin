define(['Zapi', 'bootstrap-select'], function(Zapi) {
    var nav = {};
    var hostSelector = {};//Object for public methods
    var hosts;
    var hostGroups;
    var hostSelDone;
    
    hostSelector.init = function(initDone) {
        var hostGet = Zapi('host.get');
        // set selectors to disabled before ajax request
        $('#hostGroupSelect')
            .selectpicker();
        $('#hostSelect')
            .selectpicker();
        
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

    return {
        hostSelector: hostSelector
    }
});
