// ==UserScript==
// @name         粤梦缘+
// @namespace    dranime
// @version      0.2
// @description  水水沒煩惱
// @include      /^https://(bbs|www)\.(deainx|dotmu|dranime)\.(me|net)//
// @icon         https://www.dranime.net/favicon.ico
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function() {
    'use strict';

    var checkInterval = setInterval(() => {
        if (location.hash) {
            clearInterval(checkInterval);
            clearTimeout(checkTimeout);

            let hashId = location.hash.substring(1);
            let elemById = document.getElementById(hashId);
            let elemByName = document.getElementsByName(hashId)[0];;

            let pattern = /^(?:lastpost|newpost)$/
            if ((pattern.test(hashId)) && !elemByName) return;

            let params = new URLSearchParams(location.search);
            let refSearch = document.referrer.split('?')[1];
            if (refSearch && refSearch.startsWith("mod=post&action=edit") && !elemById) {
                location.href = `?mod=redirect&goto=findpost&ptid=${params.get("tid")}&pid=${hashId.substring(3)}`;
            } else if (location.search.startsWith("?mod=viewthread") && !(elemById || elemByName)) {
                location.search = `?prevpage=1&mod=viewthread&tid=${params.get("tid")}&page=${params.get("page")-1}`;
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

})();