// ==UserScript==
// @name         BeatSaverEnhanced
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  enhance beatsaver-site
// @author       jundoll
// @match        https://beatsaver.com/*
// @icon         https://beatsaver.com/static/favicon/favicon-32x32.png
// @updateURL    https://github.com/jundoll/BeatSaverEnhanced/raw/main/beatsaver.user.js
// @downloadURL  https://github.com/jundoll/BeatSaverEnhanced/raw/main/beatsaver.user.js
// @run-at       document-start
// for Tampermonkey
// @grant        GM_xmlhttpRequest
// @grant        GM_addStyle
// @grant        GM_info
// ==/UserScript==


(function() {
    'use strict';

    class Global {
    }
    Global.baseurls = ["https://beatsaver.com"]

    function create(tag, attrs, ...children) {
        if (tag === undefined) {
            throw new Error("'tag' not defined");
        }
        const ele = document.createElement(tag);
        if (attrs) {
            for (const [attrName, attrValue] of Object.entries(attrs)) {
                if (attrName === "style") {
                    for (const [styleName, styleValue] of Object.entries(attrs.style)) {
                        ele.style[styleName] = styleValue;
                    }
                }
                else if (attrName === "class") {
                    if (typeof attrs.class === "string") {
                        const classes = attrs.class.split(/ /g).filter(c => c.trim().length > 0);
                        ele.classList.add(...classes);
                    }
                    else {
                        ele.classList.add(...attrs.class);
                    }
                }
                else if (attrName === "for") {
                    ele.htmlFor = attrValue;
                }
                else if (attrName === "selected") {
                    ele.selected = (attrValue ? "selected" : undefined);
                }
                else if (attrName === "disabled") {
                    if (attrValue){
                        ele.setAttribute("disabled", undefined);
                    }
                }
                else if (attrName === "data") {
                    const data_dict = attrs[attrName];
                    for (const [data_key, data_value] of Object.entries(data_dict)) {
                        ele.dataset[data_key] = data_value;
                    }
                }
                else {
                    ele[attrName] = attrs[attrName];
                }
            }
        }
        into(ele, ...children);
        return ele;
    }
    function clear_children(elem) {
        while (elem.lastChild) {
            elem.removeChild(elem.lastChild);
        }
    }
    function intor(parent, ...children) {
        clear_children(parent);
        return into(parent, ...children);
    }
    function into(parent, ...children) {
        for (const child of children) {
            if (typeof child === "string") {
                if (children.length > 1) {
                    parent.appendChild(to_node(child));
                }
                else {
                    parent.textContent = child;
                }
            }
            else if ("then" in child) {
                const dummy = document.createElement("DIV");
                parent.appendChild(dummy);
                (async () => {
                    const node = await child;
                    parent.replaceChild(to_node(node), dummy);
                })();
            }
            else {
                parent.appendChild(child);
            }
        }
        return parent;
    }
    function to_node(elem) {
        if (typeof elem === "string") {
            const text_div = document.createElement("DIV");
            text_div.textContent = elem;
            return text_div;
        }
        return elem;
    }
    function check(elem) {
        if (elem === undefined || elem === null) {
            throw new Error("Expected value to not be null");
        }
        return elem;
    }
    function is_target_page() {
        var comparator = false
        for (const url of Global.baseurls) {
            comparator = comparator || window.location.href.toLowerCase().startsWith(url + "/maps")
        }
        return comparator
    }
    function get_id() {
        var url_split = window.location.href.split('/');
        var id = url_split[url_split.length-1]
        return id;
    }
    function addProperty(val, addPoint){
        if (addPoint.querySelector("span.text-truncate.ml-4") !== null) {
            addPoint.removeChild(addPoint.lastChild);
        }
        into(addPoint, create("span", { class: "text-truncate ml-4" }, String(val.stats.downloads)));
    }
    function addProperty_DLcount(map_id, callback, addPoint) {
        var url = "https://beatsaver.com/api/maps/id/" + map_id
        var request = new XMLHttpRequest();
        request.open('GET', url);
        request.onreadystatechange = function () {
            if (request.readyState != 4) {
                // リクエスト中
            } else if (request.status != 200) {
                // 失敗
            } else {
                // 取得成功
                var result = JSON.parse(request.responseText);
                if(callback) callback(result, addPoint)
            }
        };
        request.send(null);

    }
    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    async function modify_page() {
        if (!is_target_page()) {
            return;
        }

        // 追加処理1
        var MetaDataList = document.querySelector("div.list-group");
        while(MetaDataList == null){
            await sleep(1*1000)
            MetaDataList = document.querySelector("div.list-group");
        }
        into(MetaDataList, create("div", { class: "list-group-item d-flex justify-content-between"}, "Download"));
        var MetaDataListDL = document.querySelectorAll("div.list-group-item.d-flex.justify-content-between");
        into(MetaDataListDL[MetaDataListDL.length-1], create("span", { class: "text-truncate ml-4" }, "loading"));

        // 追加内容取得
        var id = get_id()
        addProperty_DLcount(id, addProperty, MetaDataListDL[MetaDataListDL.length-1])

    }

    let has_loaded_head = false;
    function on_load_head() {
        if (!document.head) {
            return;
        }
        if (has_loaded_head) {
            return;
        }
        //has_loaded_head = true;
    }
    let has_loaded_body = false;
    function on_load_body() {
        if (document.readyState !== "complete" && document.readyState !== "interactive") {
            return;
        }
        if (has_loaded_body) {
            return;
        }
        //has_loaded_body = true;
        modify_page();
    }
    function onload() {
        on_load_head();
        on_load_body();
    }

    var href = location.href;
    const observer = new MutationObserver(function () {
        // 処理
        //if (is_target_page() && document.querySelector("div.list-group")) {
        //}
        if(href !== location.href) {
            href = location.href;
            onload()
        }
    })
    observer.observe(document, { childList: true })

    // 初期読み込み時
    window.addEventListener("load", onload);


})();
