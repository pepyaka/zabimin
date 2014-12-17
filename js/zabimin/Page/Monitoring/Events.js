// Monitoring/Events
define(['Zapi', 'Util', 'Page/nav', 'moment', 'bootstrap-bootbox', 'bootstrap-table'], function(Zapi, Util, nav, moment, bootbox) {
    "use strict";

    var data = {};
    var hostSelector = nav.hostSelector; // Shorthands
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

    var init = function(hashArgs) {
        hostSelector.init(function(hosts, hostGroups) {
            data.hosts = hosts;
            data.hostGroups = hostGroups;
            hostSelector.set(hashArgs);
            setEventsReqParams(hashArgs)
        });
        hostSelector.done(function(selected) {
            Util.hash(selected);
        });

        filter.init(function(filterArgs) {
            Util.hash(filterArgs);
        });
        filter.set(hashArgs);
    }
    var update = function(hashArgs) {
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
            limit: 100,
            selectRelatedObject: 'extend',
            selectHosts: ['host'],
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
            //objectid: function(v) {
            //    reqParams.groupids = [];
            //},
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
        var duration = [];
        var map = {
            html: { //This map to set <td> classes or css
                status: function(value) {
                    return {
                        classes: {
                            'OK': 'text-success',
                            'Problem': 'text-danger'
                        }[value]
                    }
                },
                severity: function(value) {
                    return {
                        classes: {
                            'Not classified': '',
                            'Information': 'info',
                            'Warning': 'warning',
                            'Average': 'warning text-danger',
                            'High': 'danger',
                            'Disaster': 'danger text-danger'
                        }[value]
                    }
                }
                    
            },
            data: { //This is cell map (also html inside)
                clock: function(unixtime) {
                    var d = moment(unixtime, 'X');
                    return d.format('lll')
                },
                host: function(hosts) {
                    var hostNames = [];
                    $.each(hosts, function(i, host) {
                        hostNames.push(host.host)
                    });
                    return hostNames.join(', ')
                },
                description: function(relateObject) {
                    return relateObject.description
                },
                status: function(value) {
                    return Zapi.map.trigger.value[value]
                },
                severity: function(relatedObject) {
                    return Zapi.map.trigger.priority[relatedObject.priority]
                },
                ack: function(value) {
                    var ack;
                    if (+value) {
                        ack = [
                            '<button type="button" class="btn btn-xs btn-success">',
                            'Yes ',
                            '<span class="badge">',
                            4,
                            '</span>',
                            '</button>'
                        ].join('');
                    } else {
                        ack = '<button type="button" class="btn btn-xs btn-warning" data-toggle="popover" title="Popover">No</button>'
                    }
                    return ack
                },
                duration: function(v, row) {
                    var d;
                    if (duration[row.objectid]) {
                        d = moment.duration(duration[row.objectid] - v, 's').humanize();
                        duration[row.objectid] = v;
                    } else {
                        d = moment(v, 'X').fromNow();
                        duration[row.objectid] = v;
                    }
                    return d
                }
            }
        };
        var columns = [{
                field: 'clock',
                title: 'Time',
                sortable: true,
                formatter: map.data.clock
            }, {
                field: 'hosts',
                title: 'Host',
                sortable: true,
                formatter: map.data.host
            }, {
                field: 'relatedObject',
                title: 'Description',
                formatter: map.data.description
            }, {
                field: 'value',
                title: 'Status',
                sortable: true,
                formatter: map.data.status,
                cellStyle: map.html.status
            }, {
                field: 'relatedObject',
                title: 'Severity',
                sortable: true,
                formatter: map.data.severity,
                cellStyle: map.html.severity
            }, {
                field: 'clock',
                title: 'Duration',
                sortable: true,
                formatter: map.data.duration
            }, {
                field: 'acknowledged',
                title: 'Ack',
                align: 'center',
                //valign: 'middle',
                formatter: map.data.ack,
                events: {
                    'click button': function (e, value, row, index) {
                        console.log($(this), value, row, index);
bootbox.dialog({
  /**
   * @required String|Element
   */
  message: "I am a custom dialog",
  
  /**
   * @optional String|Element
   * adds a header to the dialog and places this text in an h4
   */
  title: "Custom title",
  
  /**
   * @optional Function
   * allows the user to dismisss the dialog by hitting ESC, which
   * will invoke this function
   */
  onEscape: function() {},
  
  /**
   * @optional Boolean
   * @default: true
   * whether the dialog should be shown immediately
   */
  show: true,
  
  /**
   * @optional Boolean
   * @default: true
   * whether the dialog should be have a backdrop or not
   */
  backdrop: true,
  
  /**
   * @optional Boolean
   * @default: true
   * show a close button
   */
  closeButton: true,
  
  /**
   * @optional Boolean
   * @default: true
   * animate the dialog in and out (not supported in < IE 10)
   */
  animate: true,
  
  /**
   * @optional String
   * @default: null
   * an additional class to apply to the dialog wrapper
   */
  className: "my-modal",
  
  /**
   * @optional Object
   * @default: {}
   * any buttons shown in the dialog's footer
   */
  buttons: {
    
    // For each key inside the buttons object...
    
    /**
     * @required Object|Function
     * 
     * this first usage will ignore the `success` key
     * provided and take all button options from the given object
     */
    success: {   
      /**
       * @required String
       * this button's label
       */
      label: "Success!",
      
      /**
       * @optional String
       * an additional class to apply to the button
       */
      className: "btn-success",
      
      /**
       * @optional Function
       * the callback to invoke when this button is clicked
       */
      callback: function() {}
    },
    
    /**
     * this usage demonstrates that if no label property is
     * supplied in the object, the key is used instead
     */
    "Danger!": {
      className: "btn-danger",
      callback: function() {}
    },
    
    /**
     * lastly, if the value supplied is a function, the options
     * are assumed to be the short form of label -> callback
     * this is the most condensed way of providing useful buttons
     * but doesn't allow for any configuration
     */
    "Another label": function() {}
  }
});
                        
                    }
                }
            }, {
                field: 'objectid',
                title: 'Actions'
        }];
        var eventGet = Zapi('event.get', reqParams)

        eventGet.done(function(zapiResponse) {
            console.log('event.get', reqParams, zapiResponse.result)
            $('#triggerEvent')
                .bootstrapTable({
                    data: zapiResponse.result,
                    search: true,
                    pagination: true,
                    //showRefresh: true,
                    showToggle: true,
                    showColumns: true,
                    columns: columns
            //})
            //.on('click', function (e, name, args) {
            //    console.log(e, name, args);
            });
        });
    }
    
    return {
        init: init,
        update: update
    }
});
