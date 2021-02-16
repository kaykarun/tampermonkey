// ==UserScript==
// @name         Time Tracking Helper
// @namespace    familysicle
// @version      0.6
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
// @noframes
// @updateURL    https://github.com/kaykarun/tampermonkey/raw/main/timetracker.user.js
// @downloadURL  https://github.com/kaykarun/tampermonkey/raw/main/timetracker.user.js
// @require      http://code.jquery.com/jquery-3.4.1.min.js
// ==/UserScript==

var reportURL = "http://192.168.55.1/report";
var topN = 10;

function getStorageName() {
    var d = new Date();
    var m = d.getMonth();
    var dt = d.getDate();
    if (m > 1 || dt > 15) {
        return "timemap_"+dt;
    }
    return "timemap";
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
        //console.log("Channel "+nm[0].innerText);
        nm = nm[0].innerText;
        if (nm.indexOf(":") != -1) {
            nm = nm.substring(nm.indexOf(":")+1);
        }
        return nm;
    } else if (window.location.pathname.indexOf('/@me/') != -1){
        nm = $( '.selected-aXhQR6' );
        //console.log("DM "+nm[0].innerText);
        return "DM: "+nm[0].innerText;
    }
    return window.location.pathname;
}

function trackTime() {
    if (window.location.href.indexOf(reportURL) != -1) {
        return;
    }
    if (document.visibilityState != "visible") {
        return;
    }
    // Skip iframes
    if (window.top != window.self) {
        return;
    }

    var d = new Date();
    var dt = d.getDate();
    var timemap = GM_getValue(getStorageName(), {});
    if (timemap.date == undefined || timemap.date != dt) {
        timemap = {};
        timemap.date = dt;
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

var chart = {
	animationEnabled: true,
	theme: "light2", // "light1", "light2", "dark1", "dark2"
	title:{
		text: "Top Sites Visited"
	},
	axisY: {
		title: "Time (mins)"
	},
	data: [{
        //click: chartDrillDownHandler,
		type: "bar",
		showInLegend: true,
		legendMarkerColor: "grey",
		dataPoints: []
	}]
};

function getTimeData(dataPoints, domain) {
    var timemap = GM_getValue(getStorageName(), {});
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

        return a < b ? -1 : (a > b ? 1 : 0);
    });
    var i, k, v = 0, bottomN = 0;
    if (tuples.length > topN) {
        bottomN = tuples.length - topN;
    }
    for (i = 0; i < bottomN; i++) {
        v += tuples[i][1];
    }
    if (v > 0) {
        dataPoints.push({"label": "other sites", "y": v});
    }

    for (i = bottomN; i < tuples.length; i++) {
        k = tuples[i][0];
        v = tuples[i][1];
        dataPoints.push({"label": k, "y": v});
    }
}

function renderChart() {
    if (window.location.href.indexOf(reportURL) == -1) {
        return;
    }

    var domain = window.location.href.substring(reportURL.length+1);
    if (domain == "other%20sites") {
        domain = "";
    }

    while (document.head.firstChild) {
        document.head.removeChild(document.head.firstChild);
    }
    while (document.body.firstChild) {
        document.body.removeChild(document.body.firstChild);
    }
    document.title = "Time tracker report";

    //<meta http-equiv="refresh" content="30">
    var elem = document.createElement("meta");
    elem.setAttribute("http-equiv", "refresh");
    elem.setAttribute("content", "30");
    //document.head.appendChild(elem);

    getTimeData(chart.data[0].dataPoints, domain);

    var script = document.createElement("script");
    script.type = 'text/javascript';
    script.innerText = "";
    script.innerText = script.innerText + "function chartDrilldownHandler(e) { ";
    //script.innerText = script.innerText + "console.log(e.dataPoint.label);";
    script.innerText = script.innerText + "window.location.href = '";
    if (domain == "") {
        script.innerText = script.innerText + reportURL + "/'+e.dataPoint.label;";
    } else {
        script.innerText = script.innerText + reportURL + "';";
    }
    script.innerText = script.innerText + "} \n";
    script.innerText = script.innerText + "function showChart() { var chart =  new CanvasJS.Chart('chartContainer',";
    script.innerText = script.innerText + JSON.stringify(chart);
    script.innerText = script.innerText + "); \n";
    script.innerText = script.innerText + "chart.options.data[0].click = chartDrilldownHandler; \n";
    if (domain != "") {
        script.innerText = script.innerText + "chart.options.title.text = '"+ domain +"'; \n";
    }
    script.innerText = script.innerText + "chart.render();} \n";
    document.head.appendChild(script);

    script = document.createElement("script");
    script.type = 'text/javascript';
    script.setAttribute("src", "https://canvasjs.com/assets/script/canvasjs.min.js");
    script.setAttribute("onload", "showChart()");
    document.head.appendChild(script);

    var div = document.createElement('div');
    div.id = 'chartContainer';
    div.style.cssText = 'height: 600px; width: 80%; margin: auto;';
    document.body.appendChild(div);
}

function openReport() {
    GM_openInTab(reportURL, {'active': true});
}

if (window.location.href != reportURL) {
    GM_registerMenuCommand("Show Report", openReport);
}

renderChart();
setInterval(trackTime, 15000);
