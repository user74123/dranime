// ==UserScript==
// @name         飄粵社+
// @namespace    https://www.dranime.net/thread-98025-1-1.html
// @version      3.1.2
// @description  粵水粵掂
// @match        https://www.dranime.net/*
// @match        https://www.dotmu.net/*
// @exclude      *://*/*&catid=*
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

    const DOMAIN_ALIAS = `(?:dotmu\\.net|deainx\\.net|deainx\\.me|dranime\\.net)`;
    var locale;

    init();
    if (document.readyState == 'loading') {
        document.addEventListener('DOMContentLoaded', main);
    }else {
        main();
    }

    function main() {
        if (location.hash) {
            setTimeout(() => {
                history.scrollRestoration = 'manual';

                let hashId = location.hash.slice(1);
                let elemById = document.getElementById(hashId);
                let elemByName = document.getElementsByName(hashId)[0];

                if (!elemByName && hashId == 'lastpost') {
                    elemByName = document.getElementsByName('newpost')[0];
                    if (!elemByName) return;
                }

                let refSearch = document.referrer.split('?')[1];
                if (refSearch && refSearch.startsWith('mod=post&action=edit') && !elemById) {
                    location.href = `?mod=redirect&goto=findpost&ptid=${tid}&pid=${hashId.slice(3)}`;
                }else if (location.search.startsWith('?mod=viewthread') && !(elemById || elemByName)) {
                    let page = getPage(document);
                    location.search = `?prevpage=1&mod=viewthread&tid=${tid}&page=${page-1}`;
                }

                if (elemById) {
                    elemById.scrollIntoView();
                }else if (elemByName) {
                    elemByName.scrollIntoView();
                }
            }, 500);
        }

        setTimeout(() => {
            let aimgs = document.querySelectorAll('img[id^="aimg_"]');
            let pattern = `^(?:https?://.*?\\.${DOMAIN_ALIAS}/)?data/attachment/`;
            let regex = new RegExp(pattern);
            aimgs.forEach((img) => {
                let ori = img.getAttribute('original');
                let src = img.getAttribute('file');
                if (!src) src = ori ? ori : img.src;
                let old;
                if ((old = src.match(regex))) {
                    src = src.replace(regex, 'https://img.dranime.net/');
                }
                if (old || ori && ori != src) {
                    if (ori) img.setAttribute('original', src);
                    img.src = src;
                }
            });
        }, 1);

        document.addEventListener('click', (event) => {
            let link = event.target.closest('a');
            let pattern = /(www\.deainx\.net|www\.deainx\.me|bbs\.deainx\.me)/, old;
            if (link && (old=link.hostname.match(pattern))) {
                event.preventDefault();
                let newlink = link.href.replace(old[1], location.hostname);
                open(newlink);
            }
        });

        if (document.body.id == 'space') {
            let style = document.querySelector('style');
            let pattern = `url\\('(?:https?://.+?\\.${DOMAIN_ALIAS}/)?data/attachment/(.+?)'\\)`;
            let regex = new RegExp(pattern, "g");
            style.innerText = style.innerText.replace(regex, 'url(\'https://img.dranime.net/$1\')');
        }

        if (location.search.startsWith('?mod=space&do=notice')) {
            let parent = document.getElementsByClassName('bm bw0')[0];
            let target = document.getElementsByClassName('pgs cl')[0];
            if (target) {
                parent.insertBefore(target.cloneNode(true), parent.firstChild);
            }
        }

        if (typeof tid !== 'undefined' && typeof postaction === 'undefined') {
            let pgs = document.querySelectorAll('.pgt, [class^="pgs mtm mbm cl"]');
            for (let i = 0; i < pgs.length; i++) {
                let pg = pgs[i].getElementsByClassName('pg')[0];
                if (pg) {
                    let lastpg = document.createElement('a');
                    lastpg.href = 'javascript:void(0);';
                    lastpg.classList.add('nxt');
                    lastpg.innerHTML = '尾页';
                    lastpg = pg.appendChild(lastpg);
                    lastpg.addEventListener('click', async () => {
                        let response = await goThread(Number.MAX_SAFE_INTEGER);
                        let page = getPage(response);
                        location.href = `thread-${tid}-${page}-1.html#lastpost`;
                    });
                }
            }

            let repbtns = document.querySelectorAll('[id^="post_reply"], .pt');
            for (let i = 0; i < repbtns.length; i++) {
                repbtns[i].addEventListener('click', async () => {
                    let response = await goThread(Number.MAX_SAFE_INTEGER);
                    countPost(response, 'thread', 1, 6);
                });
            }

            let repqbtns = document.querySelectorAll('.fastre');
            for (let i = 0, currpage = getPage(document); i < repqbtns.length; i++) {
                repqbtns[i].addEventListener('click', async () => {
                    let response = await goThread(Number.MAX_SAFE_INTEGER);
                    if (i == 0 && currpage == 1) {
                        countPost(response, 'thread', 1, 6);
                    }else {
                        countPost(response, 'quote', 6);
                    }
                });
            }
        }

        async function countPost(doc, reptype, count, thresh) {
            let prev = countPostAux(doc, reptype, count, thresh);
            if (prev) {
                let page = getPage(doc);
                if (page > 1) {
                    doc = await goThread(page-1);;
                    switch (reptype) {
                        case 'thread':
                            thresh = prev;
                            break;
                        case 'quote':
                            count = prev;
                            break;
                    }
                    countPostAux(doc, reptype, count, thresh);
                }
            }
        }

        function countPostAux(doc, reptype, count, thresh) {
            if (!thresh) thresh = count;

            let posts = getPosts(doc);
            let first = getPage(doc) == 1 ? 1 : 0;
            let pattern = /&authorid=(\d+)/, postuid;

            for (let i = posts.length-1; count > 0 && i >= first; i--) {
                thresh--;
                let postauth = getPostAuth(posts[i], false);
                if ((postuid=postauth.search.match(pattern))) {
                    if (postuid[1] == discuz_uid) {
                        if (reptype == 'thread') {
                            if (thresh > 0) {
                                let quote = posts[i].querySelector('.quote');
                                if (quote && quote.textContent.match(/^[^ ]+? 发表于 \d+-\d+-\d+ \d+:\d+(\n.*)?$/)) {
                                    continue;
                                }
                            }else {
                                reptype = 'quote';
                            }
                        }
                        count--;
                    }else return;
                }
            }
            if (count == 0) {
                switch (reptype) {
                    case 'thread':
                        alert(locale.repalert);
                        break;
                    case 'quote':
                        alert(locale.repqalert);
                        break;
                }
                hideWindow('reply');
                return;
            }
            return thresh > count ? thresh : count;
        }

        function getPage(doc) {
            let postauth = getPostAuth(doc, false);
            let pattern = /&page=(\d+)/, page;
            if ((page=postauth.search.match(pattern))) return page[1];
        }

        function getPosts(doc, all=true) {
            if (all) return doc.querySelectorAll('table[id^="pid"]');
            else return doc.querySelector('table[id^="pid"]');
        }

        function getPostAuth(doc, all=true) {
            if (all) return doc.querySelectorAll('a[rel="nofollow"]');
            else return doc.querySelector('a[rel="nofollow"]');
        }

        async function goThread(page) {
            let ret;
            await GM.xmlHttpRequest({
                method: 'GET',
                url: `/forum.php?mod=viewthread&tid=${tid}&page=${page}`,
                responseType: 'document',
                onload: (response) => {
                    ret = response.response;
                }
            });
            return ret;
        }
    }

    async function init() {
        await redirect();

        const en = {
            noredirect: 'Disable Domain Redirect',
            repalert: 'CAUTION! Consecutive comments detected.',
            repqalert: 'CAUTION! 6 consecutive replies detected.'
        }
        const hant = {
            noredirect: '停用域名跳轉',
            repalert: '偵測到您連續發言，請謹慎發言！',
            repqalert: '偵測到您已6連帖，請謹慎發表回覆！'
        }
        const hans = {
            noredirect: '禁用域名跳转',
            repalert: '侦测到您连续发言，请谨慎发言！',
            repqalert: '侦测到您已6连帖，请谨慎发表回复！'
        }

        locale = navigator.language;
        if (locale.startsWith('en')) {
            locale = en;
        }else if (locale == 'zh-HK' || locale == 'zh-TW') {
            locale = hant;
        }else {
            locale = hans;
        }

        GM.registerMenuCommand('dranime.net', () => { GM.setValue('domain','www.dranime.net'); });
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
