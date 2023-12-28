// ==UserScript==
// @name         粤梦缘+
// @namespace    https://www.dranime.net/thread-98025-1-1.html
// @version      2.0.1
// @description  水水沒煩惱
// @match        https://www.dranime.net/*
// @match        https://bbs.deainx.me/*
// @match        https://www.dotmu.net/*
// @icon         https://www.dranime.net/favicon.ico
// @grant        GM.registerMenuCommand
// @grant        GM.getValue
// @grant        GM.setValue
// @grant        GM.deleteValue
// @grant        GM.xmlHttpRequest
// @connect      self
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';

    onload = () => {
        var checkInterval = setInterval(() => {
            if (location.hash) {
                clearInterval(checkInterval);
                clearTimeout(checkTimeout);

                if (history.scrollRestoration) {
                    history.scrollRestoration = 'manual';
                }

                let hashId = location.hash.substring(1);
                let elemById = document.getElementById(hashId);
                let elemByName = document.getElementsByName(hashId)[0];

                if (!elemByName && hashId == 'lastpost') {
                    elemByName = document.getElementsByName('newpost')[0];
                    if (!elemByName) return;
                }

                let refSearch = document.referrer.split('?')[1];
                if (refSearch && refSearch.startsWith('mod=post&action=edit') && !elemById) {
                    location.href = `?mod=redirect&goto=findpost&ptid=${tid}&pid=${hashId.substring(3)}`;
                } else if (location.search.startsWith('?mod=viewthread') && !(elemById || elemByName)) {
                    let page = getPage(location);
                    location.search = `?prevpage=1&mod=viewthread&tid=${tid}&page=${page-1}`;
                }

                if (elemById) {
                    elemById.scrollIntoView();
                } else if (elemByName) {
                    elemByName.scrollIntoView();
                }
            }
        }, 500);

        var checkTimeout = setTimeout(() => { clearInterval(checkInterval); }, 5000);

        if (location.search.startsWith('?mod=space&do=notice')) {
            let parent = document.getElementsByClassName('bm bw0')[0];
            let target = document.getElementsByClassName('pgs cl')[0];
            if (target) {
                parent.insertBefore(target.cloneNode(true), parent.firstChild);
            }
        }

        var repbtns = document.querySelectorAll('.fastre, [id^="post_reply"], .pt');
        if (repbtns) {
            for (let i = 0; i < repbtns.length; i++) {
                repbtns[i].addEventListener('click', () => {
                    GM.xmlHttpRequest({
                        method: 'GET',
                        url: `/forum.php?mod=redirect&goto=lastpost&tid=${tid}`,
                        responseType: 'document',
                        onload: (response) => {
                            count = 0;
                            let linked = countPost(response);
                            if (linked) {
                                let finalurl = new URL(response.finalUrl);
                                let page = getPage(finalurl);
                                GM.xmlHttpRequest({
                                    method: 'GET',
                                    url: `/forum.php?mod=viewthread&tid=${tid}&page=${page-1}`,
                                    responseType: 'document',
                                    onload: (response) => {
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
            let postauth = response.response.querySelectorAll('a[rel="nofollow"]');
            for (let i = postauth.length-1; count < 6 && i >= 0; i--) {
                let pattern = /&authorid=(\d+)/, postuid;
                if ((postuid=postauth[i].search.match(pattern)) != null) {
                    if (postuid[1] == discuz_uid) {
                        count++;
                    } else return false;
                }
            }
            if (count == 6) {
                alert(locale.repalert);
                return false;
            }
            return true;
        }

        function getPage(url) {
            let pattern = /(?:thread-\d+-|&page=)(\d+)/, page ;
            if ((page=url.href.match(pattern)) != null) return page[1];
        }
    }

    init();
    var locale;
    async function init() {
        await redirect();

        const en = {
            noredirect: 'Disable Domain Redirect',
            repalert: 'CAUTION! 6 consecutive posts detected.'
        }
        const hant = {
            noredirect: '停用域名跳轉',
            repalert: '偵測到你已6連帖，請謹慎發表回覆！'
        }
        const hans = {
            noredirect: '禁用域名跳转',
            repalert: '侦测到你已6连帖，请谨慎发表回复！'
        }

        locale = navigator.language;
        if (locale.startsWith('en')) {
            locale = en;
        } else if (locale == 'zh-HK' || locale == 'zh-TW') {
            locale = hant;
        } else {
            locale = hans;
        }

        GM.registerMenuCommand('dranime.net', () => { GM.setValue('domain','www.dranime.net'); });
        GM.registerMenuCommand('deainx.me', () => { GM.setValue('domain','bbs.deainx.me'); });
        GM.registerMenuCommand('dotmu.net', () => { GM.setValue('domain','www.dotmu.net'); });
        GM.registerMenuCommand(locale.noredirect, () => { GM.deleteValue('domain'); });
    }

    function redirect() {
        GM.getValue('domain').then(result => {
            if (result && result != location.hostname) {
                location.hostname = result;
            }
        });
    }
})();
