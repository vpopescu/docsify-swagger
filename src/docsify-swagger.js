import {
    h1,
    h2,
    h3,
    h4,
    paragraph,
    bullet,
    link,
    table,
    monospace,
    paragraphTip,
    strikethrough,
    swaggerVersionPill,
    swaggerVerbPill,
    swaggerPar1,
    swaggerPar2,
    swaggerBugBug,
    swaggerUrl,
    swaggerResponseCode
} from "./markdown";
import { parse } from "./parser";
import extend from "extend";
//import { debug } from "util";


const SWAGGER_CONTENT_KEY = "docsify.swagger.content";
let options = {
    cache: true,
    showExample: true,
    tableWidth: "auto",
    i18n: {
        "en": {
            request: "Request parameters",
            response: "Response",
            name: "Name",
            type: "Type",
            required: "Required",
            description: "Description",
            code: "HTTP response code",
            none: "None"
        },
        "zh-cn": {
            request: "请求参数",
            response: "响应参数",
            name: "名称",
            type: "类型",
            required: "是否必传",
            description: "描述",
            code: "(translate)HTTP response code",
            none: "无"
        },
        fallback: "en"
    }
};

export function install(hook, vm) {

    hook.mounted(function() {
        let tableWidth = options.tableWidth;
        if (!tableWidth || tableWidth == "auto") {
            return;
        }

        /* insert stylesheet if the width was specified */
        var head = document.head || document.getElementsByTagName("head")[0];
        var style = document.createElement("style");
        style.type = "text/css";
        head.appendChild(style);
        style.sheet.insertRule(`
      .markdown-section table {
        display: table;
        width: ${options.tableWidth};
      }
    `)
    });

    hook.beforeEach(function(content, next) {
        let reg = new RegExp("\\[swagger\\]\\(([http|https].+)\\)");
        let group = content.match(reg);
        if (group && group[1]) {
            let swaggerJsonUrl = group[1];
            swaggerToMarkdown(swaggerJsonUrl)
                .then((data) => {
                    cacheMarkdown(swaggerJsonUrl, data)
                    next(content.replace(reg, data))
                })
                .catch((err) => {
                    console.log(err);
                    next(content.replace(reg, loadCachedMarkdown(swaggerJsonUrl)));
                });
        } else {
            next(content);
        }
    });

    function cacheMarkdown(url, markdown) {
        if (!options.cache) {
            return;
        }

        let cachedContent = localStorage.getItem(SWAGGER_CONTENT_KEY);
        let content = {};
        if (cachedContent) {
            content = JSON.parse(cachedContent);
        }

        content[url] = markdown;
        localStorage.setItem(SWAGGER_CONTENT_KEY, JSON.stringify(content))
    }

    function loadCachedMarkdown(url) {
        let invalidMarkdown = paragraphTip(`Failed to load swagger from ${url}.`);
        if (!options.cache) {
            return invalidMarkdown;
        }

        let cachedContent = localStorage.getItem(SWAGGER_CONTENT_KEY);
        if (!cachedContent) {
            return invalidMarkdown;
        }

        let content = JSON.parse(cachedContent);
        if (!content || !content[url]) {
            return invalidMarkdown;
        }

        return paragraphTip(`Failed to load swagger from ${url}, load cached document.\n${content[url]}`);
    }

    function markdownEscape(str) {
        return str ? str.replaceAll("\r", "").replaceAll("\n", "<br\>") : "";
    }


    /**
     * Load swagger json from remote url and parse to markdown.
     * 
     * @param jsonUrl swagger json url
     * @return markdown of swagger 
     */
    async function swaggerToMarkdown(jsonUrl) {
        let i18n = loadI18n();
        let response = await Docsify.get(jsonUrl, true);
        let swaggerJson = parse(response);
        let info = swaggerJson.info;
        let swaggerMarkdown = "";

        if (info.title) {
            swaggerMarkdown += h1(info.title);
        }

        if (info.version) {
            swaggerMarkdown += swaggerVersionPill(`${info.version}`);
            swaggerMarkdown += '\n'
        }

        if (info.description) {
            swaggerMarkdown += swaggerPar1(`${info.description}`);
            swaggerMarkdown += '\n'
        }

        if (info.license) {
            let license = info.license;
            swaggerMarkdown += bullet(`License: ${link(license.name, license.url)}\n`);
            swaggerMarkdown += '\n'
        }

        let markdownMap = new Map();

        // sections        

        swaggerJson.tags.forEach(tag => {
            var tagName = tag.name;
            // https://redoc.ly/docs/api-reference-docs/specification-extensions/x-display-name/#x-displayname
            if (tag["x-displayName"])
                tagName = tag["x-displayName"];
            let desc = (tag.description) ?
                swaggerPar2(tag.description) :
                swaggerBugBug("FIXME: missing group description.")
            markdownMap.set(tag.name, `${h2(tagName)}\n\n${desc}\n\n`);
        });


        let apis = swaggerJson.apis;
        for (let index = 0; index < apis.length; index++) {
            let api = apis[index]; // section
            let tag = api.tag;
            let deprecated = api.deprecated;
            let markdown = markdownMap.get(tag);

            let summary = api.summary;
            if (deprecated) {
                summary = strikethrough(summary);
            }

            let line = "\n" + h3(summary) + "\n" +
                swaggerVerbPill(api.method) + swaggerUrl(api.path) + '\n\n';

            if (line)
                markdown += line;

            /* add request parameters */
            let request = api.request;

            markdown += h4(i18n.request);
            if (request.length == 0) {
                markdown += `${i18n.none}\n`;
            } else {
                let nestedParams = [];
                let tableData = [];
                for (let index = 0; index < request.length; index++) {
                    let param = request[index];
                    tableData.push([
                        param.name,
                        param.type,
                        param.required,
                        markdownEscape(param.description)
                    ]);

                    let refParam = param.refParam;
                    if (refParam && refParam.length != 0) {
                        nestedParams.push({
                            name: param.refType,
                            ref: refParam
                        });
                    }
                }
                markdown += table([i18n.name, i18n.type, i18n.required, i18n.description], tableData) +
                    handleNestedParams(nestedParams);
            }



            /* add response */
            let response = api.response;
            markdown += h4(i18n.response);
            if (response.length == 0) {
                markdown += `${i18n.none}\n`;
            } else {
                let nestedParams = [];
                let tableData = [];
                for (let index = 0; index < response.length; index++) {
                    let param = response[index];
                    tableData.push([
                        swaggerResponseCode(param.code),
                        markdownEscape(param.description)
                    ]);

                    let refParam = param.refParam;
                    if (refParam && refParam.length != 0) {
                        nestedParams.push({
                            name: param.refType,
                            ref: refParam
                        });
                    }
                }
                markdown += table([i18n.code, i18n.description], tableData) +
                    handleNestedParams(nestedParams);
            }


            markdownMap.set(tag, markdown);
        }

        for (let value of markdownMap.values()) {
            swaggerMarkdown += value;
        }
        return swaggerMarkdown;
    }

    function handleNestedParams(nestedParams) {
        if (!nestedParams || nestedParams.length == 0) {
            return "";
        }

        let i18n = loadI18n();
        let childNestedParams = [];
        let markdown = "";
        nestedParams.forEach(param => {
            let tableData = [];
            let ref = param.ref;
            ref.forEach(refParam => {
                tableData.push([
                    refParam.name,
                    refParam.type,
                    refParam.required,
                    refParam.description
                ]);

                let childRefParam = refParam.refParam;
                if (childRefParam && childRefParam.length != 0) {
                    childNestedParams.push({
                        name: refParam.refType,
                        ref: childRefParam
                    });
                }
            });

            markdown += bullet(param.name) + "\n" +
                table([i18n.name, i18n.type, i18n.required, i18n.description], tableData);
        });

        return markdown + handleNestedParams(childNestedParams);
    }

    function loadI18n() {
        let href = location.href;
        let key = Object.keys(options.i18n).find(key => {
            return href.indexOf(key) > -1;
        });

        return options.i18n[key ? key : options.i18n["fallback"]];
    }
}

window.$docsify["swagger"] = extend(true, options, window.$docsify["swagger"]);