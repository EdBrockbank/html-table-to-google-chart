// Google Chart Manager
GChart = new function(){

    this.chartLoaded = false;
    this.currentDest = '';
    this.load = function(cTableID, cDestID, cType, lBack) {
        if (!GChart.chartLoaded) {
            google.charts.load('current',{'packages':['corechart']});
            GChart.chartLoaded = true;
            if (cTableID !== null && cTableID !== undefined) {
                google.charts.setOnLoadCallback(setTimeout('GChart.create("' + cTableID + '", "' + cDestID + '", "' + cType + '",' + ((lBack)?'true':'false') + ')', 250));
            }
        }
    };
    this.create = function(cTableID, cDestID, cType, lBack) {
        if (lBack === null) lBack = false;
        if (!GChart.chartLoaded) {
            GChart.load(cTableID, cDestID, cType, lBack);
        } else {
            //checking the chart trying to be loaded is supported/valid.
            var chart_types = ["BarChart","ColumnChart","LineChart","AreaChart","SteppedAreaChart","PieChart","3DPieChart","DonutChart"];
            if(chart_types.includes(cType)){
                // is3D is for a 3D option from google, however it only works with pie charts at the moment.
                var is3D = false;
                //if 3DPieChart is selected this sets cType to a pie chart but adds the option for 3D and sets it to true.
                if (cType === "3DPieChart") {
                    is3D = true;
                    cType = "PieChart";
                }
                //setting the arrays and collecting the options from the table data.
                var chart_data = [];
                var row_colors = [];
                var header_colors = [];
                var skipCol = [];
                var pieHole = $(cTableID).data("chart-piehole");
                var title = $(cTableID).data("chart-title");
                var height = $(cTableID).data("chart-height");
                var width = $(cTableID).data("chart-width");
                var trendlines = $(cTableID).data("chart-trendlines");
                if (trendlines === "" || trendlines == null) {
                    trendlines = {};
                } else {
                    console.log(trendlines);
                    trendlines = JSON.parse(trendlines);
                }
                //setting a default value of 0.3 for the pie hole option used in donut charts.
                pieHole = (isNaN(pieHole)||pieHole === "")?0.3:parseFloat(pieHole);
                //setting the variables used to scan through the table.
                var tableRow = -1, tableCol = -1, data_columns = -1;
                //beginning the loop that scans through each table row.
                $(cTableID + " thead>tr, " + cTableID + " tbody>tr").each(function(){
                    var row_data = [];
                    var color;
                    var skipRow = false;
                    ++tableRow;
                    tableCol = -1;
                    //loops through each child element of the row collecting the data and storing it in an array.
                    $(this).children('th,td').each(function(){
                        ++tableCol;
                        //if the cell it is currently reading has the noChart class it will run this:
                        if($(this).hasClass("noChart")){
                            //if the cell is on the first row of the table it assumes the user wants to skip the column so it will skip that cell each time.
                            if (tableRow === 0) {
                                skipCol.push(tableCol);
                                //otherwise it assumes the user wants to skip the row and so will only display data from the other rows.
                            } else if (tableCol === 0) {
                                skipRow = true;
                            }
                        }
                        if (!$(this).hasClass("list-edit-element") && !skipCol.includes(tableCol) && !skipRow){
                            if(tableCol > data_columns){
                                data_columns = tableCol;
                            }
                            //some items in the table, (usually the name), might come out as a link as the system has a page for each item, if this is the case the code will look for children of a tags.
                            if ($(this).children("a").length > 0){
                                row_data.push($(this).children("a").html());
                            }else if (tableCol === 0 || tableRow === 0){
                                //if this is the first row or in the first column it will add it as a string as this should be a title.
                                row_data.push($(this).html());
                            }else{
                                //makes sure the data is a float not a string.
                                row_data.push(parseFloat($(this).html()));
                            }
                            //sets the color parameter, if this is undefined or just white then it will use the google default colors
                            color = $(this).data("chart-color");
                            if(color !== undefined && color !== "#ffffff"){
                                if(tableRow === 0){
                                    header_colors.push(color);
                                } else {
                                    row_colors.push(color);
                                }
                            }
                        }
                    });
                    //only pushes the data into the array if the row isn't flagged to be skipped.
                    if (!skipRow) {
                        chart_data.push(row_data);
                    }
                });
                // Store Previous Destination Content
                if (lBack) {
                    $(cDestID + '_GCS').remove();
                    var $chartDiv = $('<div id="' + cDestID.replace('#', '') + '_GCS" style="display:none;"></div>')
                    $("body").append($chartDiv);
                    $(cDestID).children().each(function(){$(this).appendTo(cDestID + '_GCS');});
                }
                //creates the 3 variables required by the google charts code.
                var chart;
                //assigns the chart_data array to the data variable.
                var data = google.visualization.arrayToDataTable(chart_data, false);
                //telling the options variable to expect parameters.
                var options = {};
                //this checks the type of chart the user is trying to make and tells the google chart code accordingly:
                //if it is a pie chart or donut chart then the google code needs to be told that it is a pie chart either with or without a pie hole.
                if (cType === 'PieChart' || cType === 'DonutChart'){
                    if (cType === 'PieChart'){
                        chart = new google.visualization.PieChart($(cDestID)[0]);
                        //if the user has asked for a 3D pie chart then is3D will be set to true, otherwise it will be false.
                        options.is3D = is3D;
                    } else if (cType === 'DonutChart'){
                        //the pie hole variable was set up at line 24, if it is not defined it will come out as 0.3 (the defualt value).
                        chart = new google.visualization.PieChart($(cDestID)[0]);
                        options.pieHole = pieHole;
                    }
                    //if there is a color defined for each item on the table then it will use those, otherwise it will use the default colors set by google.
                    if(tableRow === row_colors.length){
                        options.colors = row_colors;
                    }
                    //if it isn't a pie chart or a donut chart it will check what kind of chart it is and pass that into the google code.
                } else {
                    if (cType === 'BarChart'){
                        chart = new google.visualization.BarChart($(cDestID)[0]);
                    } else if (cType === 'LineChart'){
                        chart = new google.visualization.LineChart($(cDestID)[0]);
                    } else if(cType === 'ColumnChart'){
                        chart = new google.visualization.ColumnChart($(cDestID)[0]);
                    } else if (cType === 'AreaChart'){
                        chart = new google.visualization.AreaChart($(cDestID)[0]);
                    } else if (cType === 'SteppedAreaChart'){
                        chart = new google.visualization.SteppedAreaChart($(cDestID)[0]);
                    } else if (cType === 'ComboChart'){
                        chart = new google.visualization.ComboChart($(cDestID)[0]);
                    }
                    //if colors have been defined for the headings then it will use those for any 2 tone charts, otherwise it will use the default colors set by google.
                    if(data_columns === header_colors.length){
                        options.colors = header_colors;
                    }
                    /*
                                        if (!jQuery.isEmptyObject(oTrendLines)) {
                                            options.trendlines = oTrendLines;
                                        }
                    */
//					options.trendlines = {0:{}};
//					options.hAxis = {title: 'Name'};
//					options.vAxis = {title: 'Value'};
                }
                //setting the option parameters, they can be set or not set, or you can only set one and not the others ect, any that arent set will use the google default.
                options.title = title;
                options.height = height;
                options.width = width;
                options.trendlines = trendlines;
                //command that actually draws the chart.
                GChart.currentDest = cDestID;
                google.visualization.events.addListener(chart, 'ready', GChart.afterDraw);
                chart.draw(data, options);
                //if the chart type wasn't in the chart_types list it will show nothing on the page and post this in the console.
            } else {
                console.log("Invalid Chart Type");
            }
        }
    };
    this.afterDraw = function() {
        var cDestID = GChart.currentDest;
        if ($(cDestID + '_GCS').length > 0) {
            $(cDestID).prepend('<button type="button" class="btn btn-sm btn-light" style="position:absolute;top:5px;z-index:1000;" title="Back to table" onClick="GChart.revert(\'' + cDestID + '\')"><i class="fa fa-list-alt" aria-hidden="true"></i></button>');
        }

    };
    this.revert = function(cDestID) {
        $(cDestID).html('');
        $(cDestID + '_GCS').children().each(function(){$(this).appendTo(cDestID);});
        $(cDestID + '_GCS').remove();
    }
};