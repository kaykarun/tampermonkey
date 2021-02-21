// ==UserScript==
// @name         discord_script
// @namespace    familysicle
// @version      0.72
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


var timemap_default = {
    "date" : 0
};


var servers = [
    {
        "id" : "809905984209551390",
        "hide" : ["none"]
    },
    {
        "id" : "809908088185684049",
        "hide" : ["lightsout", "classes", "breaks", "test"]
    },
    {
        "id" : "749773878162620616",
        "hide" : ["lightsout", "classes"],
    },
    {
        "id": "812413283738058802",
        "hide": ["lightsout", "classes"],
    },
    {
        "id": "453053002975150081",
        "hide": ["lightsout", "classes"],
    },
    {
        "id": "790453250137522178",
        "hide": ["lightsout", "classes", "breaks"],
    },
    {
        "id": "312367941578653696",
        "hide": ["lightsout", "classes", "breaks"],
    },
    {
        "id": "493173110799859713",
        "hide": ["lightsout", "classes", "breaks", "test"],
    },
    {
        "id": "749758355089784923",
        "hide": ["lightsout", "classes"],
    },
    {
       "id": "796385692820439060",
       "hide": ["lightsout", "classes", "breaks"],
   },
   {
       "id": "332526643182567425",
       "hide": ["lightsout", "classes", "breaks"],
   },
   {
       "id": "326202765309247488",
       "hide": ["lightsout", "classes", "breaks"],
   },
   {
       "id": "178281233233608705",
       "hide": ["lightsout", "classes", "breaks"],
   }
];

var timeslots = {
  "test": [
      [1100, 1115]
   ],
  "lightsout" : [
    [0, 730], [2200, 2400],
    [10000, 10730], [12200, 12400],
    [20000, 20730], [22200, 22400],
    [30000, 30730], [32200, 32400],
    [40000, 40730], [42200, 42400],
    [50000, 50730], [52200, 52400],
    [60000, 60730], [62200, 62400]
  ],
  "classes" : [
    [900, 1100],
    [10800, 10930], [10945, 11115], [11215, 11345],
    [20900, 21030], [21045, 21215], [21400, 21530],
    [30900, 31000], [31500, 31600], [31630, 31830],
    [40800, 40930], [40945, 41115], [41215, 41345], [41800, 42000],
    [50900, 51030], [51045, 51215], [51400, 51530]
  ],
  "breaks" : [
    [10930, 10945], [11115, 11215],
    [21030, 21045], [21215, 21400],
    [40930, 40945], [41115, 41215],
    [51030, 51045], [51215, 51400],
  ]
}


var familysicleURL = "https://discord.com/channels/809905984209551390/809905984209551393";

function matchTimeSlot(key) {
  var timeslot = timeslots[key];
  var i, d = new Date();
  var dy = d.getDay();
  var hr = d.getHours();
  var mn = d.getMinutes();
  var tm = dy*10000+hr*100+mn;
  for (i = 0; i < timeslot.length; i++) {
    if (tm >= timeslot[i][0] && tm <= timeslot[i][1]) {
      return true;
    }
  }
  return false;
}

function listServers() {
    var i, srvlist = [], href;
    $( "div[href*='channels']" ).each(function(i, obj) {
        href = obj.attributes.href.nodeValue;
        if (href.indexOf("@me") == -1) {
            var newurl = true;
            for (i=0; i < servers.length; i++) {
                if (href.indexOf(servers[i].id) != -1) {
                    newurl = false;
                }
            }
            if (newurl) {
                srvlist.push({"id": href.split("/")[2], "hide": ["lightsout", "classes", "breaks"]});
            }
        }
    });
    GM_setValue("servers", srvlist);

    $( ".listItem-2P_4kh" ).each(function(i, obj) {
        var j;
        for (j=0; j < servers.length; j++) {
            var s = servers[j];
            if(obj.innerHTML.indexOf(s.id) != -1) {
                obj.id = s.id;
            }
        }
    });

}

function justWait() {
    var guilds = document.getElementsByClassName("listItem-2P_4kh");
    if (guilds.length>6) {
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
            if (matchTimeSlot(key)) {
                hide = true;
            }
        } else {
            key = key.substring(1);
            if (matchTimeSlot(key)) {
                hide = false;
            }
        }
    }
    return hide;
}

function hideServers() {
    listServers();
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
        if (shouldHide(s.hide) && newurl.indexOf(s.id) != -1) {
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
    var srvid = -1;
    var timemap = GM_getValue("timemap", timemap_default);
    if (timemap.date == undefined || timemap.date != dt) {
        timemap = timemap_default;
        timemap.date = dt;
    }
    var i;
    for (i=0; i < servers.length; i++) {
        var s = servers[i];
        if (window.location.href.indexOf(s.id) != -1) {
            timemap[s.id] = (timemap[s.id] || 0) + 1
            srvid = s.id;
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
        if (srvid != -1) {
            obj.innerHTML = timemap[srvid]/4 + ":" + nm;
        }
    });
}

if (window.onurlchange === null) {
    window.addEventListener('urlchange', (event) => switchToFamily(event.url));
}


switchToFamily(window.location.href);
justWait();

setInterval(hideServers, 60000);
setInterval(trackTime, 15000);
