define(['Util', 'moment', 'bootstrap-select', 'bootstrap-datetimepicker', 'bootstrap-slider'], function(util, moment) {
    "use strict";

    var current;
    var timeoutId;
    var intervalId;

    //  Function for load content from url and put in $('#ajaxPage') block
    var load = function () {
        var hash = util.hash();
        //Page statistics
        util.visit.update(hash);
        // Dashboard on empty page
        if (!hash.page) {
             location.hash = '#!Monitoring/Dashboard';
             return
        }
        //load html firstly for events binding
        require(['text!html/' + hash.page + '.html'],
            function(html) {
                require(['Page/' + hash.page], function(page) {
                    // Check if we have same page    
                    if (hash.page === current) {
                        page.update && page.update(hash.args);
                    } else {
                        current = hash.page;

                        $('#ajax-page')
                            .removeClass('spinner')
                            .html(html);
                        $('#nav-title')
                            .text(hash.page.split('/').join(' / '));

                        //Reset any timers of previous page
                        window.clearTimeout(timeoutId);
                        timeoutId = page.timeoutId;
                        window.clearInterval(intervalId);
                        intervalId = page.intervalId;

                        page.init && page.init(hash.args);
                    };
                });
            },
            function(err) {
                require(['text!html/404.html'], function(html) {
                    $('#ajax-page')
                        .removeClass('spinner')
                        .html(html);
                });
            }
        );
    };

    //Common methods for pages
    var dateTimeRangePicker = {
        step: 10,
        minDate: moment(0),
        maxDate: moment(),
        init: function (dateTimeRangePicked) {
            var step = this.step; //Minutes stepping
            var minDate = this.minDate;
            var maxDate = this.maxDate;
            var dateTimePickerOpts = {
                format: 'lll',
                useCurrent: false,
                //minDate: minDate,
                //maxDate: maxDate,
                //showClear: true,
                stepping: step,
                showClose: true,
                icons: {
                    close: 'glyphicon glyphicon-ok'
                }
            };
            $('#datetimerange-slider')
                .slider({
                    min: minDate.valueOf(),
                    max: maxDate.valueOf(),
                    step: step * 60000,
                    tooltip: 'hide',
                    enabled: true
                })
                .on("slideStart", function (e) {
                    $('#datetimerange-since')
                        .val(null);
                    $('#datetimerange-till')
                        .val(null);
                })
                .on("slide", function(e) {
                    $("#datetimerange-since")
                        .attr('placeholder', moment(e.value[0]).format('lll'));
                    $("#datetimerange-till")
                        .attr('placeholder', moment(e.value[1]).format('lll'));
                })
                .on("slideStop", function () {
                    var value = $(this).slider('getValue');
                    $("#datetimerange-select")
                        .selectpicker('val', '')
                    dateTimeRangePicked(moment(value[0]), moment(value[1]))
                })
            $("#datetimerange-since")
                .datetimepicker(
                    $.extend({}, {
                            defaultDate: minDate
                        },
                        dateTimePickerOpts
                    )
                )
                .prop('placeholder', function () {
                    return $(this).val()
                })
                .on('dp.change', function (e) {
                    //$("#datetimerange-till")
                    //    .data("DateTimePicker")
                    //        .minDate(e.date)
                    $("#datetimerange-slider")
                        .slider('setValue', [
                            e.date.valueOf(),
                            $("#datetimerange-slider").slider('getValue')[1]
                        ])
                })
                .on('dp.hide', function (e) {
                    $('#datetimerange-slider')
                        .trigger('slideStop')
                })
            $("#datetimerange-till")
                .datetimepicker(
                    $.extend({}, {
                            defaultDate: maxDate
                        },
                        dateTimePickerOpts
                    )
                )
                .prop('placeholder', function () {
                    return $(this).val()
                })
                //.on('dp.show', function (e) {
                //    var minDate = $("#datetimerange-since")
                //        .data("DateTimePicker")
                //            .date();
                //    $(this)
                //        .data("DateTimePicker")
                //            .minDate(minDate)
                //})
                .on('dp.change', function (e) {
                    //$("#datetimerange-since")
                    //    .data("DateTimePicker")
                    //        .maxDate(e.date)
                    $("#datetimerange-slider")
                        .slider('setValue', [
                            $("#datetimerange-slider").slider('getValue')[0],
                            e.date.valueOf()
                        ])
                })
                .on('dp.hide', function (e) {
                    $('#datetimerange-slider')
                        .trigger('slideStop')
                })
            $("#datetimerange-select")
                .selectpicker('val', null)
                .on('change', function () {
                    var val = $(this).val();
                    var range = {
                        hour: [ moment().subtract(1, 'h'), null ],
                        day: [ moment().subtract(1, 'd'), null ],
                        today: [ moment(0, 'HH'), null ],
                        yesterday: [ moment(0, 'HH').subtract(1, 'd'), moment(0, 'HH') ],
                        week: [ moment().subtract(1, 'w'), null ],
                        this_week: [ moment(0, 'HH').weekday(0), null ],
                        last_week: [ moment(0, 'HH').weekday(0).subtract(1, 'w'), moment(0, 'HH').weekday(0) ],
                        month: [ moment().subtract(1, 'M'), null ],
                        this_month: [ moment(1, 'DD'), null ],
                        last_month: [ moment(1, 'DD').subtract(1, 'M'), moment(1, 'DD') ],
                        year: [ moment().subtract(1, 'y'), null ],
                        this_year: [ moment(1, 'MM'), null ],
                        last_year: [ moment(1, 'MM').subtract(1, 'y'), moment(1, 'MM') ],
                        all: [ null, null ]
                    }[val];
                    dateTimeRangePicked.apply(null, range); 
                });
        },
        min: function (min) {
            if (min) {
                this.minDate = moment(min.valueOf() - (min.valueOf() % (this.step * 60000)));
                $("#datetimerange-slider")
                    .slider('setAttribute', 'min', this.minDate.valueOf())
                    .slider('refresh')
                $("#datetimerange-since")
                    .data("DateTimePicker")
                        //.date(this.minDate)
                        .minDate(this.minDate)
            }
            return this.minDate
        },
        max: function (max) {
            if (max) {
                this.maxDate = max;
                $("#datetimerange-slider")
                    .slider('setAttribute', 'max', this.maxDate.valueOf())
                    .slider('refresh')
                $("#datetimerange-till")
                    .data("DateTimePicker")
                        //.date(this.maxDate)
                        .minDate(this.maxDate)
            }
            return this.maxDate
        },
        since: function (since) {
            var sliderVal = $("#datetimerange-slider").slider('getValue');
            if (since) {
                if (since.valueOf() < this.minDate.valueOf()) {
                    since = this.minDate;
                }
                $("#datetimerange-since")
                    .data("DateTimePicker")
                        .date(since)
                 $("#datetimerange-slider")
                    .slider('setValue', [
                        since.valueOf(),
                        sliderVal[1]
                    ])
            }
            return moment(sliderVal[0])
        },
        till: function (till) {
            var sliderVal = $("#datetimerange-slider").slider('getValue');
            if (till) {
                if (till.valueOf() > this.maxDate.valueOf()) {
                    till = this.maxDate;
                }
                $("#datetimerange-till")
                    .data("DateTimePicker")
                        .date(till)
                 $("#datetimerange-slider")
                    .slider('setValue', [
                        sliderVal[0],
                        till.valueOf()
                    ])
            }
            return moment(sliderVal[1])
        },
        disable: function () {
            $('#datetimerange-slider')
                .slider('disable');
            $("#datetimerange-since")
                .data("DateTimePicker")
                    .disable();
            $("#datetimerange-till")
                .data("DateTimePicker")
                    .disable();
            $("#datetimerange-select")
                .prop('disabled', true)
                .selectpicker('refresh');
        },
        enable: function () {
            $('#datetimerange-slider')
                .slider('enable');
            $("#datetimerange-since")
                .data("DateTimePicker")
                    .enable();
            $("#datetimerange-till")
                .data("DateTimePicker")
                    .enable();
            $("#datetimerange-select")
                .prop('disabled', false)
                .selectpicker('refresh');
        }
    }

    return {
        current: current,
        load: load,
        dateTimeRangePicker: dateTimeRangePicker
    }
});
