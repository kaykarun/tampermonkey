// ==UserScript==
// @name         Time Tracking Helper
// @namespace    familysicle
// @version      0.80
// @description  try to take over the world!
// @author       You
// @match        https://*/*
// @match        http://*/*
// @match        http://192.168.55.1/*
// @grant        window.onurlchange
// @grant        GM_setClipboard
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_registerMenuCommand
// @grant        GM_openInTab
// @grant        unsafeWindow
// @noframes
// @updateURL    https://github.com/kaykarun/tampermonkey/raw/main/timetracker.user.js
// @downloadURL  https://github.com/kaykarun/tampermonkey/raw/main/timetracker.user.js
// @require      http://code.jquery.com/jquery-3.4.1.min.js
// ==/UserScript==

const monthNames = ["January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const fixedColorMap = {
    "discord.com": "#7289da",
    "Orange Family": "#FFA500",
    "MVRT 115": "#662D91",
    "mvrt.com": "#662D91",
    "drive.google.com": "#009900",
    "randommath.instructure.com": "#00BFFF"
}

const defaultColorSet = "#6D78AD #51CDA0 #DF7970 #4C9CA0 #AE7D99 #C9D45C #5592AD #DF874D #52BCA8 #8E7AA3 #E3CB64 #C77B85 #C39762 #8DD17E #B57952 #FCC26C".split(" ");

var reportURL = "http://192.168.55.1/report";
var topN = 8;
var curDate = -1;
var curChart = "pie";

var piechart = {
	animationEnabled: true,
	theme: "light2", // "light1", "light2", "dark1", "dark2"
    colorSet: "colorSet1",
    title:{
        fontSize: 36,
		text: "Top Sites Visited"
	},
	subtitles:[{
        fontSize: 20,
        text: getDateStr()
	}, {
        fontSize: 20,
		text: "Total time: "
    }],
	axisY: {
        titleFontSize: 20,
        labelFontSize: 16,
		title: "Time (mins)"
	},
	axisX: {
        titleFontSize: 20,
        labelFontSize: 16
	},
    data: [{
        type: "pie",
		showInLegend: false,
        startAngle: -180,
        toolTipContent: "{label}: {y} mins, #percent%",
        indexLabelFontSize: 18,
        dataPoints: []
	}]
};

var areachart = {
	animationEnabled: true,
	theme: "light2", // "light1", "light2", "dark1", "dark2"
    colorSet: "colorSet1",
    title:{
        fontSize: 36,
		text: "Trend of Sites Visited"
	},
	axisY: {
        titleFontSize: 20,
        labelFontSize: 16,
		title: "Time (mins)"
	},
	axisX: {
        titleFontSize: 20,
        labelFontSize: 16
	},
    legend: {
		verticalAlign: "top",
		horizontalAlign: "right",
		dockInsidePlotArea: true,
        fontSize: 16
	},
    data: [{
       name: "1",
       type: "stackedArea",
       showInLegend: true,
       legendMarkerType: "square",
       toolTipContent: "{y} mins",
       dataPoints: []
	},{
       name: "2",
       type: "stackedArea",
       showInLegend: true,
       legendMarkerType: "square",
       toolTipContent: "{y} mins",
       dataPoints: []
	},{
       name: "3",
       type: "stackedArea",
       showInLegend: true,
       legendMarkerType: "square",
       toolTipContent: "{y} mins",
       dataPoints: []
	},{
       name: "4",
       type: "stackedArea",
       showInLegend: true,
       legendMarkerType: "square",
       toolTipContent: "{y} mins",
       dataPoints: []
	},{
       name: "5",
       type: "stackedArea",
       showInLegend: true,
       legendMarkerType: "square",
       toolTipContent: "{y} mins",
       dataPoints: []
	}]
};


function getDateStr() {
    var d = new Date();
    var m = d.getMonth();
    var dt = d.getDate();
    if (curDate < 0) {
        return monthNames[m] + ", "+ dt;
    } else if (dt < curDate) {
        return monthNames[(m-1)% 12] + ", "+ curDate;
    } else {
        return monthNames[m] + ", "+ curDate;
    }
}

function getStorageName() {
    if (curDate == -1) {
        var d = new Date();
        var m = d.getMonth();
        curDate = d.getDate();
    }
    return "timemap_"+curDate;
}

function mapPathNames() {
    if (window.location.hostname.indexOf("discord.com") != -1) {
        return mapDiscordURLs();
    }
    if (window.location.hostname.indexOf("www.youtube.com") != -1 &&
        window.location.pathname.indexOf("/watch") != -1) {
        return mapYouTubeURLs();
    }
    return window.location.pathname;
}

function mapYouTubeURLs() {
    var title = document.querySelector('meta[name="title"]').content;
    if (title == undefined) {
        title = document.querySelector('title').innerText;
    }
    return title.substr(0, 60);
}

function mapDiscordURLs() {
    var nm;
    if (window.location.pathname.indexOf('@me') == -1) {
        nm = $( '.name-1jkAdW' );
        nm = nm[0].innerText;
        if (nm.indexOf(":") != -1) {
            nm = nm.substring(nm.indexOf(":")+1);
        }
        return nm;
    } else if (window.location.pathname.indexOf('/@me/') != -1){
        nm = $( '.selected-aXhQR6' );
        return "DM: "+nm[0].innerText;
    }
    return window.location.pathname;
}

function getTopSites() {
    var i, k, tmap, fulltmap = {}, tuples = [];
    for (i = 1; i <=31; i++) {
        tmap = GM_getValue("timemap_"+i, {});
        for (k in tmap) {
            if (k != "date") {
                fulltmap[k] = (fulltmap[k] || 0) + tmap[k].total;
            }
        }
    }
    for (k in fulltmap) {
        tuples.push([k, fulltmap[k]]);
    }
    tuples.sort(function(a, b) {
        a = a[1];
        b = b[1];

        return a < b ? 1 : (a > b ? -1 : 0);
    });
    return tuples;
}

function updateColorMap() {
    var i, j, tuples = [], colorMap = fixedColorMap;
    tuples = getTopSites();
    i = 0;
    j = 0;
    while (j < 16 && i < 16 && i < tuples.length) {
        if (colorMap[tuples[i][0]] == undefined) {
            colorMap[tuples[i][0]] = defaultColorSet[j];
            j = j + 1;
        }
        i = i + 1;
    }
    GM_setValue("colorMap", colorMap);
    GM_setValue("sites", tuples);
}

function trackTime() {
    if (window.location.href.indexOf(reportURL) != -1) {
        updateChart();
        return;
    }
    if (document.visibilityState != "visible") {
        return;
    }

    var d = new Date();
    var dt = d.getDate();
    var timemap = GM_getValue(getStorageName(), {});
    if (timemap.date == undefined || timemap.date != dt) {
        timemap = {};
        timemap.date = dt;
        updateColorMap();
    }
    var hostname = window.location.hostname;
    var pathname = mapPathNames();
    if (timemap[hostname] == undefined) {
        timemap[hostname] = { "total" : 0 };
    }
    var total = timemap[hostname].total;
    var pathtime = timemap[hostname][window.location.pathname] || timemap[hostname][pathname] || 0;
    timemap[hostname].total = total + 1;
    timemap[hostname][pathname] = pathtime + 1;
    if (window.location.pathname != pathname) {
        delete timemap[hostname][window.location.pathname];
    }
    GM_setValue(getStorageName(), timemap);
}

function toHours(mn) {
    if (mn < 60) {
        return mn + " mins";
    } else {
        var hr = Math.floor(mn/60);
        mn = mn % 60;
        return hr + "hrs, "+ mn + " mins";
    }
}

function getTimeData(dataPoints, domain) {
    var timemap = GM_getValue(getStorageName(), {});
    var colorMap = GM_getValue("colorMap", {});
    var tuples = [];
    if (domain == "") {
        for (var key in timemap) {
            if (key != "date") {
                tuples.push([key, timemap[key].total/4]);
            }
        }
    } else {
        var map = timemap[domain];
        for (key in map) {
            if (key != "total") {
                tuples.push([key, map[key]/4]);
            }
        }
    }
    tuples.sort(function(a, b) {
        a = a[1];
        b = b[1];

        return a < b ? 1 : (a > b ? -1 : 0);
    });
    while (dataPoints.length) { dataPoints.pop(); }
    var i, k, v = 0;

    for (i = 0; i < Math.min(tuples.length, topN); i++) {
        k = tuples[i][0];
        v = tuples[i][1];
        var c = colorMap[k] || "";
        dataPoints.push({"label": k, "y": v, "color": c});
    }
    if (tuples.length > topN) {
        for (i = topN; i < tuples.length; i++) {
            v += tuples[i][1];
        }
        if (v > 0) {
            dataPoints.push({"label": "others", "y": v, "color": "#D3D3D3"});
        }
    }
}

function getTotalTime(domain) {
    var timemap = GM_getValue(getStorageName(), {});
    var time = 0;
    if (domain == "") {
        for (var key in timemap) {
            if (key != "date") {
                time += timemap[key].total/4;
            }
        }
    } else {
        var map = timemap[domain];
        for (key in map) {
            if (key != "total") {
                time += map[key]/4;
            }
        }
    }
    return time;
}

function updateChart() {
    var domain = "";
    var datapoints;
    var mychart = unsafeWindow.piechart;
    datapoints = mychart.data[0].dataPoints;
    if (mychart.options.title.text != piechart.title.text) {
        domain = mychart.options.title.text;
    }
    var time = getTotalTime(domain);
    mychart.options.subtitles[0].text = getDateStr();
    mychart.options.subtitles[1].text = "Total time: "+toHours(time);
    getTimeData(mychart.data[0].dataPoints, domain);
    mychart.options.data[0].click = chartDrilldownHandler;
    mychart.render();
}

function chartDrilldownHandler(e) {
    var mychart = unsafeWindow.piechart;
    var domain = e.dataPoint.label;
    if (mychart.options.title.text != piechart.title.text || domain == "others") {
        domain = "";
        mychart.options.title.text = piechart.title.text;
    } else {
        mychart.options.title.text = domain;
    }
    var time = getTotalTime(domain);
    mychart.options.subtitles[0].text = getDateStr();
    mychart.options.subtitles[1].text = "Total time: "+toHours(time);
    getTimeData(mychart.data[0].dataPoints, domain);
    mychart.render();
    if (domain != "") {
        $("#switch").hide();
    } else {
        $("#switch").show();
    }
}

function switchChart() {
    if (curChart == "pie") {
        $("#switch").text("Report");
        $("#prev").hide();
        $("#next").hide();
        $("#chartContainer").hide();
        $("#areaChartContainer").show();
        switchChartToArea();
        curChart = "area";
    } else {
        $("#switch").text("Trend");
        $("#prev").show();
        $("#next").show();
        $("#chartContainer").show();
        $("#areaChartContainer").hide();
        curChart = "pie";
    }
}

function switchChartToArea() {
    var i, j, d = new Date();
    var tuples = getTopSites();
    var mychart = unsafeWindow.areachart;
    for (j=0; j < 5; j++) {
        var domain = tuples[j][0];
        mychart.options.data[j].name = domain;
        while (mychart.options.data[j].dataPoints.length) { mychart.options.data[j].dataPoints.pop(); }
        for (i=0; i < 31; i++) {
            var di = new Date();
            var t = 0, tmap = {};
            di.setDate(d.getDate() - i);
            tmap = GM_getValue("timemap_"+di.getDate(), {});
            t = (tmap[domain]||{"total": 0}).total/4;
            mychart.options.data[j].dataPoints.push({x: di, y: t});
        }
    }
    mychart.render();
}


function renderChart() {
    if (window.location.href.indexOf(reportURL) == -1) {
        return;
    }

    updateColorMap();
    while (document.head.firstChild) {
        document.head.removeChild(document.head.firstChild);
    }
    while (document.body.firstChild) {
        document.body.removeChild(document.body.firstChild);
    }
    document.title = "Time tracker report";

    getTimeData(piechart.data[0].dataPoints, "");
    var time = getTotalTime("");

    var script = document.createElement("script");
    script.type = 'text/javascript';
    script.innerText = "";
    script.innerText = script.innerText + "function showChart() { var chart =  new CanvasJS.Chart('chartContainer',";
    script.innerText = script.innerText + JSON.stringify(piechart);
    script.innerText = script.innerText + "); \n";
    script.innerText = script.innerText + "window.piechart = chart; \n";
    script.innerText = script.innerText + "chart.options.subtitles[0].text = '"+getDateStr()+"'; \n";
    script.innerText = script.innerText + "chart.options.subtitles[1].text = 'Total time: "+toHours(time)+"'; \n";
    script.innerText = script.innerText + "chart.render(); \n";
    script.innerText = script.innerText + "chart =  new CanvasJS.Chart('areaChartContainer',";
    script.innerText = script.innerText + JSON.stringify(areachart);
    script.innerText = script.innerText + "); \n";
    script.innerText = script.innerText + "window.areachart = chart; \n";
    script.innerText = script.innerText + "chart.render();} \n";
    document.head.appendChild(script);

    script = document.createElement("script");
    script.type = 'text/javascript';
    script.setAttribute("src", "https://canvasjs.com/assets/script/canvasjs.min.js");
    script.setAttribute("onload", "showChart()");
    document.head.appendChild(script);

    var link = document.createElement("link");
    link.setAttribute("rel", "stylesheet");
    link.setAttribute("href", "https://www.w3schools.com/lib/w3schools23.css");
    document.head.appendChild(link);


    var topdiv = document.createElement('div');
    topdiv.setAttribute("class", "w3-clear nextprev");
    topdiv.style.cssText="overflow: hidden";

    var a = document.createElement('a');
    a.id="prev";
    a.setAttribute("class", "w3-left w3-btn");
    a.setAttribute("href", "#");
    a.style.cssText = 'width:150px; position: absolute; top: 758px; left: 10%; z-index: 1;';
    a.innerText = "< Previous";
    topdiv.appendChild(a);

    a = document.createElement('a');
    a.id="next";
    a.setAttribute("class", "w3-right w3-btn");
    a.setAttribute("href", "#");
    a.style.cssText = 'width:150px; position: absolute; top: 758px; right: 10%; z-index: 1;';
    a.innerText = "Next >";
    topdiv.appendChild(a);

    a = document.createElement('a');
    a.id="switch";
    a.setAttribute("class", "w3-right w3-btn");
    a.setAttribute("href", "#");
    a.style.cssText = 'width:150px; position: absolute; top: 0px; left: 10%; z-index: 1; display: none';
    a.innerText = "Trend";
    topdiv.appendChild(a);

    var div = document.createElement('div');
    div.id = 'chartContainer';
    div.style.cssText = 'height: 800px; width: 80%; margin: auto; z-index: 0;';
    topdiv.appendChild(div);

    div = document.createElement('div');
    div.id = 'areaChartContainer';
    div.style.cssText = 'height: 800px; width: 80%; margin: auto; z-index: 0; display: none';
    topdiv.appendChild(div);


    document.body.appendChild(topdiv);

    setTimeout(updateChart, 1000);
    $("#prev").click(previousDate);
    $("#next").click(nextDate);
    $("#switch").click(switchChart);
}

function previousDate() {
    curDate = curDate - 1;
    updateChart();
}

function nextDate() {
    var d = new Date();
    curDate = curDate + 1;
    if (curDate > d.getDate()) {
        curDate = d.getDate();
    }
    updateChart();
}

function openReport() {
    GM_openInTab(reportURL, {'active': true});
}

if (window.location.href != reportURL) {
    GM_registerMenuCommand("Show Report", openReport);
}

renderChart();
setInterval(trackTime, 15000);
