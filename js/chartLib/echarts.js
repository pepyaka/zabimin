define(['echarts'], function (ec) {


    var init = function (chart) {
        var eChart = ec.init(document.getElementById(chart.idSel)); 
        
        var option = {
            tooltip: {
                show: true
            },
            legend: {
                data:['Sales']
            },
            xAxis : [
                {
                    type : 'category',
                    data : ["Shirts", "Sweaters", "Chiffon Shirts", "Pants", "High Heels", "Socks"]
                }
            ],
            yAxis : [
                {
                    type : 'value'
                }
            ],
            series : [
                {
                    "name":"Sales",
                    "type":"bar",
                    "data":[5, 20, 40, 10, 10, 20]
                }
            ]
        };
        
        // Load data into the ECharts instance 
        eChart.setOption(option); 
    };
    var load = function (data, chart) {
    };
    var destroy = function (idSel) {
    };

    return {
        init: init,
        load: load,
        destroy: destroy
    }
});
