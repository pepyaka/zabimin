define(['config', 'moment'], function(zabimin, moment) {
    "use strict";

    var id = 0;
    var methodObjs = {
        event: {
            object: {
                type: 'integer',
                name: 'Event object',
                description: 'Type of object that is related to the event',
                values: [
                    ['Trigger'],
                    [, 'Discovered Host', 'Discovered service'],
                    [,,, 'Auto-registred host'],
                    ['Trigger',,,, 'Item', 'LLD rule']
                ]
            },
            source: {
                type: '',
                name: '',
                description: '',
                value: [
                    'Trigger',
                    'Discovery rule',
                    'Auto registration',
                    'Internal event'
                ]
            },
            value: {
                type: '',
                name: '',
                description: '',
                value: [
                    ['OK', 'Problem'],
                    ['Up', 'Down', 'Discovered', 'Lost'],
                    [],
                    ['Normal', 'Unknown']
                ]
            },
            acknowledged: {
                type: '',
                name: '',
                description: '',
                value: [
                    'No',
                    'Yes'
                ]
            }
        },
        'Trigger': {
            priority: {
                type: 'integer',
                name: 'Severity',
                description: 'Severity of the trigger',
                values: [
                    'Not classified',
                    'Information',
                    'Warning',
                    'Average',
                    'High',
                    'Disaster'
                ]
            },
            value: {
                type: 'integer',
                name: 'Value',
                description: 'Whether the trigger is in OK or problem state',
                values: [
                    'OK',
                    'Problem'
                ]
            }
        },
        hostinterface: {
            type: [
                'Agent',
                'SNMP',
                'IPMI',
                'JMX'
            ]
        },
        'Host interface': {
            interfaceid: {
                type: 'string',
                description: 'ID of the interface'
            },
            //dns 
            //(required)  string  DNS name used by the interface. 
            //
            //Can be empty if the connection is made via IP.
            //hostid 
            //(required)  string  ID of the host the interface belongs to.
            //ip 
            //(required)  string  IP address used by the interface. 
            //
            //Can be empty if the connection is made via DNS.
            main: {
                type: 'integer',
                description: 'Whether the interface is used as default on the host. Only one interface of some type can be set as default on a host',
                values: [
                    'No',
                    'Yes'
                ]
            }, 
            //port 
            //(required)  string  Port number used by the interface. Can contain user macros.
            type: {
                type: 'integer',
                description: 'Interface type',
                values: [
                    '',
                    'Agent',
                    'SNMP',
                    'IPMI',
                    'JMX'
                ]
            }, 
            useip: {
                type: 'integer',
                description: 'Whether the connection should be made via IP',
                values: [
                    'DNS',
                    'IP'
                ]
            }, 
            //bulk    integer Whether to use bulk SNMP requests. 
            //
            //Possible values are: 
            //0 - don't use bulk requests; 
            //1 - (default) use bulk requests.
        },
        'Host': {
            hostid: {
                type: 'string',
                description: 'ID of the host'
            },
            host: {
                type: 'string',
                name: 'Host name',
                description: 'Technical name of the host'
            },
            available: {
                type: 'integer',
                name: 'Zabbix agent',
                description: 'Availability of Zabbix agent',
                values: [
                    'Unknown',
                    'Available',
                    'Unavailable'
                ]
            },
            description: {
                type: 'text',
                name: 'Description',
                description: 'Description of the host'
            },
            disable_until: {
                type: 'timestamp',
                name: 'Disabled until',
                description: 'The next polling time of an unavailable Zabbix agent'
            },
            //error   string  (readonly) Error text if Zabbix agent is unavailable.
            //errors_from timestamp   (readonly) Time when Zabbix agent became unavailable.
            //flags   integer (readonly) Origin of the host. 
            //
            //Possible values: 
            //0 - a plain host; 
            //4 - a discovered host.
            //ipmi_authtype   integer IPMI authentication algorithm. 
            //
            //Possible values are:
            //-1 - (default) default; 
            //0 - none; 
            //1 - MD2; 
            //2 - MD5 
            //4 - straight; 
            //5 - OEM; 
            //6 - RMCP+.
            ipmi_available: {
                type: 'integer',
                name: 'IPMI Availability',
                description: 'Availability of IPMI agent',
                values: [
                    'Unknown',
                    'Available',
                    'Unavailable'
                ]
            },
            //ipmi_disable_until  timestamp   (readonly) The next polling time of an unavailable IPMI agent.
            //ipmi_error  string  (readonly) Error text if IPMI agent is unavailable.
            //ipmi_errors_from    timestamp   (readonly) Time when IPMI agent became unavailable.
            //ipmi_password   string  IPMI password.
            //ipmi_privilege  integer IPMI privilege level. 
            //
            //Possible values are:
            //1 - callback;
            //2 - (default) user;
            //3 - operator;
            //4 - admin;
            //5 - OEM.
            //ipmi_username   string  IPMI username.
            //jmx_available   integer (readonly) Availability of JMX agent. 
            //
            //Possible values are:
            //0 - (default) unknown;
            //1 - available;
            //2 - unavailable.
            //jmx_disable_until   timestamp   (readonly) The next polling time of an unavailable JMX agent.
            //jmx_error   string  (readonly) Error text if JMX agent is unavailable.
            //jmx_errors_from timestamp   (readonly) Time when JMX agent became unavailable.
            //maintenance_from    timestamp   (readonly) Starting time of the effective maintenance.
            //maintenance_status  integer (readonly) Effective maintenance status. 
            //
            //Possible values are:
            //0 - (default) no maintenance;
            //1 - maintenance in effect.
            //maintenance_type    integer (readonly) Effective maintenance type. 
            //
            //Possible values are:
            //0 - (default) maintenance with data collection;
            //1 - maintenance without data collection.
            //maintenanceid   string  (readonly) ID of the maintenance that is currently in effect on the host.
            name: {
                type: 'string',
                name: 'Visible name',
                description: 'Visible name of the host'
            },
            //Default: host property value.
            //proxy_hostid    string  ID of the proxy that is used to monitor the host.
            //snmp_available  integer (readonly) Availability of SNMP agent. 
            //
            //Possible values are:
            //0 - (default) unknown;
            //1 - available;
            //2 - unavailable.
            //snmp_disable_until  timestamp   (readonly) The next polling time of an unavailable SNMP agent.
            //snmp_error  string  (readonly) Error text if SNMP agent is unavailable.
            //snmp_errors_from    timestamp   (readonly) Time when SNMP agent became unavailable.
            status: {
                type: 'integer',
                name: 'Status',
                description: 'integer Status and function of the host',
                values: [
                    'Monitored host',
                    'Unmonitored host'
                ]
            },
            inventory: {
                type: 'object',
                values: {
                    alias: {id: 4, description: 'Alias'},
                    asset_tag: {id: 11, description: 'Asset tag'},
                    chassis: {id: 28, description: 'Chassis'},
                    contact: {id: 23, description: 'Contact person'},
                    contract_number: {id: 32, description: 'Contract number'},
                    date_hw_decomm: {id: 47, description: 'HW decommissioning date'},
                    date_hw_expiry: {id: 46, description: 'HW maintenance expiry date'},
                    date_hw_install: {id: 45, description: 'HW installation date'},
                    date_hw_purchase: {id: 44, description: 'HW purchase date'},
                    deployment_status: {id: 34, description: 'Deployment status'},
                    hardware: {id: 14, description: 'Hardware'},
                    hardware_full: {id: 15, description: 'Detailed hardware'},
                    host_netmask: {id: 39, description: 'Host subnet mask'},
                    host_networks: {id: 38, description: 'Host networks'},
                    host_router: {id: 40, description: 'Host router'},
                    hw_arch: {id: 30, description: 'HW architecture'},
                    installer_description: {id: 33, name: 'Installer name'},
                    location: {id: 24, description: 'Location'},
                    location_lat: {id: 25, description: 'Location latitude'},
                    location_lon: {id: 26, description: 'Location longitude'},
                    macaddress_a: {id: 12, description: 'MAC address A'},
                    macaddress_b: {id: 13, description: 'MAC address B'},
                    model: {id: 29, description: 'Model'},
                    description: {id: 3, name: 'Name'},
                    notes: {id: 27, description: 'Notes'},
                    oob_ip: {id: 41, description: 'OOB IP address'},
                    oob_netmask: {id: 42, description: 'OOB host subnet mask'},
                    oob_router: {id: 43, description: 'OOB router'},
                    os: {id: 5, description: 'OS name'},
                    os_full: {id: 6, description: 'Detailed OS name'},
                    os_short: {id: 7, description: 'Short OS name'},
                    poc_1_cell: {id: 61, description: 'Primary POC mobile number'},
                    poc_1_email: {id: 58, description: 'Primary email'},
                    poc_1_description: {id: 57, name: 'Primary POC name'},
                    poc_1_notes: {id: 63, description: 'Primary POC notes'},
                    poc_1_phone_a: {id: 59, description: 'Primary POC phone A'},
                    poc_1_phone_b: {id: 60, description: 'Primary POC phone B'},
                    poc_1_screen: {id: 62, description: 'Primary POC screen name'},
                    poc_2_cell: {id: 68, description: 'Secondary POC mobile number'},
                    poc_2_email: {id: 65, description: 'Secondary POC email'},
                    poc_2_description: {id: 64, name: 'Secondary POC name'},
                    poc_2_notes: {id: 70, description: 'Secondary POC notes'},
                    poc_2_phone_a: {id: 66, description: 'Secondary POC phone A'},
                    poc_2_phone_b: {id: 67, description: 'Secondary POC phone B'},
                    poc_2_screen: {id: 69, description: 'Secondary POC screen name'},
                    serialno_a: {id: 8, description: 'Serial number A'},
                    serialno_b: {id: 9, description: 'Serial number B'},
                    site_address_a: {id: 48, description: 'Site address A'},
                    site_address_b: {id: 49, description: 'Site address B'},
                    site_address_c: {id: 50, description: 'Site address C'},
                    site_city: {id: 51, description: 'Site city'},
                    site_country: {id: 53, description: 'Site country'},
                    site_notes: {id: 56, description: 'Site notes'},
                    site_rack: {id: 55, description: 'Site rack location'},
                    site_state: {id: 52, description: 'Site state'},
                    site_zip: {id: 54, description: 'Site ZIP/postal code'},
                    software: {id: 16, description: 'Software'},
                    software_app_a: {id: 18, description: 'Software application A'},
                    software_app_b: {id: 19, description: 'Software application B'},
                    software_app_c: {id: 20, description: 'Software application C'},
                    software_app_d: {id: 21, description: 'Software application D'},
                    software_app_e: {id: 22, description: 'Software application E'},
                    software_full: {id: 17, description: 'Software details'},
                    tag: {id: 10, description: 'Tag'},
                    type: {id: 1, description: 'Type'},
                    type_full: {id: 2, description: 'Type details'},
                    url_a: {id: 35, description: 'URL A'},
                    url_b: {id: 36, description: 'URL B'},
                    url_c: {id: 37, description: 'URL C'},
                    vendor: {id: 31, description: 'Vendor'},
                    //inventory_mode: {
                    //    description: 'Host inventory population mode',
                    //    '-1': 'disabled',
                    //    '0': 'manual',
                    //    '1': 'automatic'
                    //}
                }
            }
        }
    };
    var propTypes = {
        bool: function(val) {//A boolean value, accepts either true or false
            return val
        },
        flag: function(val) {//   The value is considered to be true if it is passed and not equal to null and false otherwise.
            return val
        },
        integer: function(val, methodObj, param) {//A whole number
            return methodObjs[methodObj][param].values[val] || val
        },
        float: function(val) {//  A floating point number.
            return val
        },
        string: function(val) {// A text string.
            return val
        },
        text: function(val) {//A longer text string
            return val
        },
        timestamp: function(val) {//A Unix timestamp
            var d = moment(val, 'X');
            return {
                moment: d.format('lll'),
                fromNow: d.fromNow()
            }
        },
        array: function(val) {//  An ordered sequence of values, that is, a plain array.
            return val
        },
        object: function(val) {// An associative array.
            return val
        },
        query: function(val) {//  A value which defines, what data should be returned. 
                              //  Can be defined as an array of property names to return only specific properties, or as one of the predefined values: 
                              //  extend - returns all object properties; 
                              //  count - returns the number of retrieved records, supported only by certain subselects.
            return val
        }
    };


    var defaults = {
        user: {
            login: {
                user: 'Guest',
                password: '',
                userData: true
            }
        },
        host: {
            get: {
                output: ['host'],
                selectGroups: ['name'],
                sortfield: 'name'
            }
        },
        hostgroup: {
            get: {
                output: ['name'],
                sortfield: 'name'
            }
        },
        trigger: {
            get: {
                output: ['description'],
                //selectHosts: 'extend',
                sortfield: 'lastchange',
                sortorder: 'DESC',
                expandComment: true,
                expandDescription: true,
                expandExpression: true
            }
        },
        event: {
            get: {
                output: 'extend',
                selectHosts: 'extend',
                //selectRelatedObject: 'extend',
                //select_alerts: 'extend',
                //select_acknowledges: 'extend'
                sortfield: 'clock',
                sortorder: 'DESC'
            }
        }
    };
    function map(methodObj, param, val) {
        var name;
        var v;
        var descr;
        var t;
        if (methodObjs[methodObj] && methodObjs[methodObj][param]) {
            name = methodObjs[methodObj][param].name || '';
            v = propTypes[methodObjs[methodObj][param].type](val, methodObj, param);
            descr = methodObjs[methodObj][param].description || '';
            t = methodObjs[methodObj][param].type;
        } else {
            name = '';
            v = val;
            descr = '';
        }
        return {
            name: name,
            value: v,
            description: descr,
            type: t
        }
    };
    function zapi(method, params, extSettings) {
        var req = {
            jsonrpc: "2.0",
            method: method
        };
        var settings = {
            url: zabimin.api.url,
            type: "POST",
            contentType: 'application/json-rpc',
            dataType: 'json',
            cache: false,
            processData: false,
        };
        var loginSettings = {
            async: false,
            success: function(loginData) {
                $.extend(localStorage, loginData.result);
            },
    xhrFields: {
      onprogress: function (e) {
        if (e.lengthComputable) {
          deferred.notify(parseInt(e.loaded / e.total * 100), 10);  // notify as a factor of the event object
        }
      }
    }
        };
        // Apply defaults to all methods
        var m = method.split('.', 2)
        var defaultParams = defaults[m[0]] && defaults[m[0]][m[1]] || {}
        req.params = $.extend({}, defaultParams, params)

        $.extend(settings, extSettings)

        if (req.method === 'user.login') {
            id = 0;
            delete req.auth
        } else {
            if (!localStorage.sessionid) {
                zapi('user.login', null, loginSettings)
            }
            id++;
            req.auth = localStorage.sessionid;
        }
        req.id = id;
        settings.data = JSON.stringify(req);
        return $.ajax(settings).progress(function (event) {
                console.log(event);
            })
    };
    
    return {
        req: zapi,
        obj: methodObjs,
        map: map
    }
});
