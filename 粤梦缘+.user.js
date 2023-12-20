// ==UserScript==
// @name         粤梦缘+
// @namespace    dranime
// @version      1.1.3
// @description  水水沒煩惱
// @include      /^https://(bbs|www)\.(deainx|dotmu|dranime)\.(me|net)//
// @icon         https://www.dranime.net/favicon.ico
// @grant        GM.xmlHttpRequest
// @run-at       document-idle
// ==/UserScript==

(function() {
    'use strict';

    var tid = getTid();

    var checkInterval = setInterval(() => {
        if (location.hash) {
            clearInterval(checkInterval);
            clearTimeout(checkTimeout);

            if ('scrollRestoration' in history) {
                history.scrollRestoration = 'manual';
            }

            let hashId = location.hash.substring(1);
            let elemById = document.getElementById(hashId);
            let elemByName = document.getElementsByName(hashId)[0];

            if (!elemByName && hashId == "lastpost") {
                elemByName = document.getElementsByName("newpost")[0];
                if (!elemByName) return;
            }

            let refSearch = document.referrer.split('?')[1];
            if (refSearch && refSearch.startsWith("mod=post&action=edit") && !elemById) {
                location.href = `?mod=redirect&goto=findpost&ptid=${tid}&pid=${hashId.substring(3)}`;
            } else if (location.search.startsWith("?mod=viewthread") && !(elemById || elemByName)) {
                let page = getPage(location);
                location.search = `?prevpage=1&mod=viewthread&tid=${tid}&page=${page-1}`;
            }

            elemById = document.getElementById(hashId);
            if (elemById) {
                elemById.scrollIntoView();
            } else if (elemByName) {
                elemByName.scrollIntoView();
            }
        }
    }, 500);

    var checkTimeout = setTimeout(() => { clearInterval(checkInterval); }, 5000);

    if (location.search.startsWith("?mod=space&do=notice")) {
        let parent = document.getElementsByClassName("bm bw0")[0];
        let target = document.getElementsByClassName("pgs cl")[0];
        if (target) {
            let clone = target.cloneNode(true);
            parent.insertBefore(clone, parent.firstChild);
        }
    }

    var fastre = Array.from(document.querySelectorAll(".fastre"));
    var acpost = Array.from(document.querySelectorAll("[id^='post_reply']"));
    var pt = Array.from(document.querySelectorAll(".pt"));
    var repbtns = fastre.concat(acpost).concat(pt);
    if (repbtns) {
        for(let i = 0; i < repbtns.length; i++) {
            repbtns[i].addEventListener('click', function() {
                GM.xmlHttpRequest({
                    method: "GET",
                    url: `/forum.php?mod=redirect&goto=lastpost&tid=${tid}`,
                    responseType: "document",
                    onload: function(response) {
                        count = 0;
                        let linked = countPost(response);
                        if (linked) {
                            let finalurl = new URL(response.finalUrl);
                            let page = getPage(finalurl);
                            GM.xmlHttpRequest({
                                method: "GET",
                                url: `/forum.php?mod=viewthread&tid=${tid}&page=${page-1}`,
                                responseType: "document",
                                onload: function(response) {
                                    countPost(response);
                                }
                            });
                        }
                    }
                });
            });
        }
    }

    var count;
    function countPost(response) {
        let postauth = response.response.querySelectorAll("a.xw1");
        for(let i = postauth.length-1; count < 6 && i >= 0; i--) {
            let pattern = /\d+/;
            if (pattern.test(postauth[i].href)) {
                let postuid = postauth[i].href.match(pattern);
                if (postuid == discuz_uid) {
                    count++;
                } else return false;
            }
        }
        if (count == 6) {
            let locale = navigator.language;
            if (locale.startsWith("en")) {
                alert("Caution! 6 consecutive posts detected.");
            } else if (locale == "zh-HK" || locale == "zh-TW") {
                alert("偵測到你已6連帖，請謹慎發表回覆！");
            } else {
                alert("侦测到你已6连帖，请谨慎发表回复！");
            }
            return false;
        }
        return true;
    }

    function getTid() {
        let pattern = /(?:thread-|&tid=)(\d+)/;
        if (pattern.test(location.href)) return location.href.match(pattern)[1];
    }

    function getPage(url) {
        let pattern = /(?:thread-\d+-|&page=)(\d+)/;
        if (pattern.test(url.href)) return url.href.match(pattern)[1];
    }
})();
