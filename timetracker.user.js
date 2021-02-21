// ==UserScript==
// @name         Time Tracking Helper
// @namespace    familysicle
// @version      0.74
// @description  try to take over the world!
// @author       You
// @match        https://*/*
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
    "mvrt.com": "#662D91"
}

const defaultColorSet = "#4F81BC #C0504E #9BBB58 #23BFAA #8064A1 #4AACC5 #F79647 #7F6084 #77A033 #33558B #E59566".split(" ");

var reportURL = "http://192.168.55.1/report";
var topN = 8;
var curDate = -1;

var chart = {
	animationEnabled: true,
	theme: "light2", // "light1", "light2", "dark1", "dark2"
    colorSet: "colorSet2",
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
		title: "Time (mins)"
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

function updateColorMap() {
    var i, j, k, tmap, fulltmap = {}, tuples = [], colorMap = fixedColorMap;
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
    i = 0;
    j = 0;
    while (j < 11 && i < 16) {
        if (colorMap[tuples[i][0]] == undefined) {
            colorMap[tuples[i][0]] = defaultColorSet[j];
            j = j + 1;
        }
        i = i + 1;
    }
    GM_setValue("colorMap", colorMap);
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
            dataPoints.push({"label": "other sites", "y": v, "color": "#D3D3D3"});
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
    var mychart = unsafeWindow.mychart;
    datapoints = mychart.data[0].dataPoints;
    if (mychart.options.title.text != chart.title.text) {
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
    var mychart = unsafeWindow.mychart;
    var domain = e.dataPoint.label;
    if (mychart.options.title.text != chart.title.text || domain == "other sites") {
        domain = "";
        mychart.options.title.text = chart.title.text;
    } else {
        mychart.options.title.text = domain;
    }
    var time = getTotalTime(domain);
    mychart.options.subtitles[0].text = getDateStr();
    mychart.options.subtitles[1].text = "Total time: "+toHours(time);
    getTimeData(mychart.data[0].dataPoints, domain);
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

    getTimeData(chart.data[0].dataPoints, "");
    var time = getTotalTime("");

    var script = document.createElement("script");
    script.type = 'text/javascript';
    script.innerText = "";
    script.innerText = script.innerText + "function showChart() { var chart =  new CanvasJS.Chart('chartContainer',";
    script.innerText = script.innerText + JSON.stringify(chart);
    script.innerText = script.innerText + "); \n";
    script.innerText = script.innerText + "window.mychart = chart; \n";
    script.innerText = script.innerText + "chart.options.subtitles[0].text = '"+getDateStr()+"'; \n";
    script.innerText = script.innerText + "chart.options.subtitles[1].text = 'Total time: "+toHours(time)+"'; \n";
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

    var div = document.createElement('div');
    div.id = 'chartContainer';
    div.style.cssText = 'height: 800px; width: 80%; margin: auto; z-index: 0;';
    topdiv.appendChild(div);


    document.body.appendChild(topdiv);

    setTimeout(updateChart, 1000);
    $("#prev").click (previousDate);
    $("#next").click (nextDate);
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
