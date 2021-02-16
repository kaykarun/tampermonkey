// ==UserScript==
// @name         discord_script
// @namespace    familysicle
// @version      0.5
// @description  try to take over the world!
// @author       You
// @match        https://discord.com/*
// @grant        window.onurlchange
// @grant        GM_setClipboard
// @grant        GM_setValue
// @grant        GM_getValue
// @noframes
// @updateURL    https://github.com/kaykarun/tampermonkey/raw/main/discord.user.js
// @downloadURL  https://github.com/kaykarun/tampermonkey/raw/main/discord.user.js
// @require      http://code.jquery.com/jquery-3.4.1.min.js
// ==/UserScript==

debugger;

var timemap_default = {
    "date" : 0,
    "familysicle" : 0,
    "testserver" : 0,
    "WRRF CADathon Discord": 0
};

var servers = [
    {
        "name" : "familysicle",
        "id" : "809905984209551390",
        "url" : "https://discord.com/channels/809905984209551390/809905984209551393",
        "hide" : ["none"]
    },
    {
        "name" : "testserver",
        "id" : "809908088185684049",
        "url" : "https://discord.com/channels/809908088185684049/809908088697913346",
        "hide" : ["lightsout", "school"]
    },
    {
        "name" : "WRRF CADathon Discord",
        "id" : "749773878162620616",
        "url" : "https://discord.com/channels/749773878162620616/749791320972722196",
        "hide" : ["lightsout", "school", "!breaks"]
    }
];

var timeblocks = {
    "lightsout" : [
        [0, 6], [0, 6], [0, 60],
        [0, 6], [22, 23], [0, 60]
    ],
    "school" : [
        [1, 1], [7, 7], [30, 60],
        [1, 1], [8, 13], [0, 60],
        [2, 2], [8, 8], [30, 60],
        [2, 2], [9, 14], [0, 60],
        [2, 2], [15, 15], [0, 60],
        [3, 3], [9, 10], [0, 60],
        [4, 4], [8, 13], [0, 60],
        [4, 4], [8, 13], [0, 60],
        [5, 5], [8, 8], [30, 60],
        [5, 5], [9, 14], [0, 60],
        [5, 5], [15, 15], [0, 60]
    ],
    "breaks" : [
        [1, 1], [9, 9], [30, 45],
        [1, 1], [11, 11], [15, 60],
        [1, 1], [12, 12], [0, 15],
        [2, 2], [10, 10], [30, 45],
        [2, 2], [12, 12], [15, 60],
        [2, 2], [13, 13], [0, 60],
        [4, 4], [9, 9], [30, 45],
        [4, 4], [11, 11], [15, 60],
        [4, 4], [12, 12], [0, 15],
        [5, 5], [10, 10], [30, 45],
        [5, 5], [12, 12], [15, 60],
        [5, 5], [13, 13], [0, 60]
    ]
}


var familysicleURL = "https://discord.com/channels/809905984209551390/809905984209551393";

function matchTimeBlock(key) {
    var timeblock = timeblocks[key];
    var i, d = new Date();
    var dy = d.getDay();
    var hr = d.getHours();
    var mn = d.getMinutes();
    var cnt = timeblock.length / 3;
    for (i = 0; i < cnt; i++) {
        if (dy >= timeblock[i*3][0] && dy <= timeblock[i*3][1]) {
            if (hr >= timeblock[i*3+1][0] && hr <= timeblock[i*3+1][1]) {
                if (mn >= timeblock[i*3+2][0] && mn <= timeblock[i*3+2][1]) {
                    return true;
                }
            }
        }
    }
    return false;
}

function listChannels() {
    var i, channels = "", href;
    $( "div[href*='channels']" ).each(function(i, obj) {
        href = obj.attributes.href.nodeValue;
        if (href.indexOf("@me") == -1) {
            var newurl = true;
            for (i=0; i < servers.length; i++) {
                if (servers[i].url.indexOf(href) != -1) {
                    newurl = false;
                }
            }
            if (newurl) {
                channels = channels + href + ":" + obj.attributes["aria-label"].nodeValue + "\n";
            }
        }
    });
    if (channels != "") {
        GM_setClipboard(channels);
        alert("New channels list copied to clipboard!");
    }

    $( ".listItem-2P_4kh" ).each(function(i, obj) {
        var j;
        for (j=0; j < servers.length; j++) {
            var s = servers[j];
            if(obj.innerHTML.indexOf(s.name) != -1) {
                obj.id = s.id;
            }
        }
    });

}

function justWait() {
    var guilds = document.getElementsByClassName("listItem-2P_4kh");
    if (guilds.length>6) {
        listChannels();
        hideServers();
    } else {
        setTimeout(function(){
            justWait()
        }, 2000);
    }
}

function shouldHide(blocks) {
    var i;
    var hide = false, key;
    for (i=0; i<blocks.length; i++) {
        if (blocks[i] == "none") {
            return false;
        }
        key = blocks[i];
        if (key.substring(0, 1) != "!") {
            if (matchTimeBlock(key)) {
                hide = true;
            }
        } else {
            key = key.substring(1);
            if (matchTimeBlock(key)) {
                hide = false;
            }
        }
    }
    return hide;
}

function hideServers() {
    var j;
    for (j=0; j < servers.length; j++) {
        var s = servers[j];
        if (shouldHide(s.hide)) {
            $( "#"+s.id ).hide();
        } else {
            $( "#"+s.id ).show();
        }
    }
}

function switchToFamily(newurl) {
    var j;
    for (j=0; j< servers.length; j++) {
        var s = servers[j];
        if (shouldHide(s.hide) && newurl.href.indexOf(s.id) != -1) {
            window.location = familysicleURL;
        }
    }
}

function trackTime() {
    if (document.visibilityState != "visible") {
        return;
    }
    var d = new Date();
    var dt = d.getDate();
    var timemap = GM_getValue("timemap", timemap_default);
    if (timemap.date == undefined || timemap.date != dt) {
        timemap = timemap_default;
        timemap.date = dt;
    }
    var i;
    for (i=0; i < servers.length; i++) {
        var s = servers[i];
        if (window.location.href == s.url) {
            timemap[s.name] = timemap[s.name] + 1
        }
    }
    GM_setValue("timemap", timemap);
    $( ".name-1jkAdW" ).each(function(i, obj) {
        var j, nm;
        var idx = obj.innerHTML.indexOf(":");
        if(idx != -1) {
            nm = obj.innerHTML.substring(idx+1);
        } else {
            nm = obj.innerHTML;
        }
        obj.innerHTML = Math.floor(timemap[nm]/6) + ":" + nm;
    });
}

if (window.onurlchange === null) {
    window.addEventListener('urlchange', (event) => switchToFamily(event.url));
}

switchToFamily(window.location);
justWait();

setInterval(hideServers, 60000);
setInterval(trackTime, 10000);
