define(['Zapi', 'Util', 'moment', 'bootstrap-table'], function(zapi, util, moment) {
    "use strict";

    // Page global variables
    var page = '#!Monitoring/Discovery';
    var discoveryRules;

    // Page components
    var filter = {
        init: function(dRule) {
            var dRuleList = dRule.map(function(r) {
                return [
                    '<a href="'+page+'&druleid='+r.druleid+'" class="list-group-item" data-druleid="'+r.druleid+'">',
                        r.name,
                    '</a>'
                ].join('')
            });
            $('#drule-list')
                .append(dRuleList.join(''));
        },
        update: function(hash) {
            var druleid = hash.druleid || 0;
            $('#drule-list a')
                .removeClass('active');
            $('[data-druleid=' + druleid + ']')
                .addClass('active');
        }
    };
    var dTable = {
        prepare: function(dRules) {
            this.dRules = dRules.slice(0);
        },
        init: function(hashArgs) {
            var dRule = this.dRules.filter(function(rule) {
                return hashArgs.druleid && rule.druleid == hashArgs.druleid[0]
            })[0];
            var chkCols = dRule && dRule.dchecks.map(function(chk) {
                return {
                    field: chk.dcheckid,
                    title: function() {
                        var sub = ''
                        var text = zapi.map('Discovery check', 'type', chk.type).value
                        if (chk.type == 8) {
                            sub = ' <sub>(' + chk.ports + ')</sub>';
                        }
                        if (chk.key_) {
                            text = [
                                ' <span class="label label-info hint--left hint--rounded hint--info" data-hint="'+ chk.key_ + '">',
                                    zapi.map('Discovery check', 'type', chk.type).value,
                                '</span>'
                            ].join('')
                        }
                        return text + sub
                    }(),
                    formatter: function(dcheck) {
                        var up;
                        var down;
                        var cell = '';
                        var type = '';
                        if (dcheck) {
                            up = moment(dcheck.lastup, 'X');
                            down = moment(dcheck.lastdown, 'X');
                            if (dcheck.value) {
                                type = [
                                    '<span class="pull-right hint--left hint--rounded hint--info" data-hint="'+dcheck.value+'">',
                                        '<span class="glyphicon glyphicon-info-sign text-info">',
                                        '</span>',
                                    '</span>'
                                ].join('')
                            }
                            if (dcheck.status == 0) {
                                cell = [
                                    '<span data-hint="Service up: '+up.format('lll')+'" class="label label-success hint--left hint--rounded hint--success text-nowrap">',
                                        up.fromNow(true),
                                    '</span>',
                                    type
                                ].join('')
                            }
                            if (dcheck.status == 1) {
                                cell = [
                                    '<span data-hint="Service down: '+down.format('lll')+'" class="label label-danger hint--left hint--rounded hint--error text-nowrap">',
                                        down.fromNow(true),
                                    '</span>',
                                    type
                                ].join('')
                            }
                        }
                        return cell
                    }
                }
            });
            var columns = [{
                    field: 'ip',
                    title: 'ip',
                    sortable: true,
                    class: 'text-nowrap',
                    sorter: util.sort.ip
                }, {
                    field: 'name',
                    title: 'Monitored host',
                    sortable: true,
                    class: 'text-nowrap'
                }, {
                    field: 'dns',
                    title: 'DNS name',
                    class: 'text-nowrap',
                }, {
                    field: 'status',
                    title: 'Host status',
                    //sortable: true,
                    formatter: function(s, h) {
                        var hStatus;
                        var up = moment(h.lastup, 'X');
                        var down = moment(h.lastdown, 'X');
                        if (s == 0) {
                            hStatus = [
                                '<span data-hint="Host up: '+up.format('lll')+'" class="label label-success hint--left hint--rounded hint--success">',
                                    up.fromNow(true),
                                '</span>'
                            ]
                        } else {
                            hStatus = [
                                '<span data-hint="Host down: '+down.format('lll')+'" class="label label-danger hint--left hint--rounded hint--error">',
                                    down.fromNow(true),
                                '</span>'
                            ]
                        }
                        return hStatus.join('')
                    }
            }];
            $('#discovery')
                .bootstrapTable('destroy')
                .bootstrapTable({
                    search: true,
                    clickToSelect: true,
                    showToggle: true,
                    showColumns: true,
                    showPaginationSwitch: true,
                    pagination: true,
                    pageSize: 20,
                    pageList: [10, 20, 50, 100],
                    columns: columns.concat(chkCols),
                })
        },
        load: function(dData) {
            $('#discovery')
                .bootstrapTable('load', dData);
        }
    };

    // Main page functions
    var init = function(hashArgs) {
        getDiscoveryRules(function(dRules) {
            filter.init(dRules);
            dTable.prepare(dRules);
            update(hashArgs);
        });
    };
    var update = function(hashArgs) {
        filter.update(hashArgs);
        dTable.init(hashArgs)
        getDiscoveredServices(hashArgs, function(dServices) {
            var dData = processData(dServices);
            dTable.load(dData);
        });
    };

    // Common functions
    function getDiscoveryRules(getRulesDone) {
        var druleGet = zapi.req('drule.get', {
            output: 'extend',
            sortfield: 'name',
            selectDChecks: 'extend'
        });
        druleGet.done(function(zapiResponse) {
            getRulesDone(zapiResponse.result)
        });
    };
    function getDiscoveredServices(hash, getDiscoveredServicesDone) {
        var dserviceGet = zapi.req('dservice.get', {
            druleids: hash.druleid || null,
            output: 'extend',
            selectDHosts: 'extend',
            selectHosts: ['name']
        });
        dserviceGet.done(function(zapiResponse) {
            getDiscoveredServicesDone(zapiResponse.result)
        });
    };
    function processData(dServices) {
        var dData = [];
        var dDataObj = {};
        dServices.forEach(function(dService) {
            if (dDataObj[dService.ip]) {
                dDataObj[dService.ip].push(dService);
            } else {
                dDataObj[dService.ip] = [dService];
            }
        });
        $.each(dDataObj, function(ip, chks) {
            var d = {
                ip: chks[0].ip,
                name: chks[0].hosts[0] && chks[0].hosts[0].name,
                dns: chks[0].dns,
                status: chks[0].dhosts[0].status,
                lastup: chks[0].dhosts[0].lastup,
                lastdown: chks[0].dhosts[0].lastdown,
                dchecks: {}
            };
            chks.forEach(function(chk) {
                d[chk.dcheckid] = {
                    value: chk.value,
                    lastup: chk.lastup,
                    lastdown: chk.lastdown,
                    status: chk.status,
                    type: chk.type
                };
            });
            dData.push(d);

        });
        dData.sort(function(a, b) {
            return util.sort.ip(a.ip, b.ip)
        });
        return dData
    };
    function filterChecks(hashArgs) {
        var dRule = discoveryRules.filter(function(dRule) {
            return hashArgs.druleid && dRule.druleid == hashArgs.druleid[0]
        });
        return dRule[0] ? dRule[0].dchecks : []
    };
    
    return {
        init: init,
        update: update
    }
});
