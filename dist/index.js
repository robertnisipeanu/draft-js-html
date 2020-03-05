"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function convertDraftToHtml(rawContent, customInlineStyleFn, customBlockStyleFn, customMultiBlockStyleFn) {
    var contentApplyBlockStyle = rawContent.blocks.map(function (rawBlock) {
        var inlineStyledBlock;
        try {
            inlineStyledBlock = getHtmlInlineStyleFromDraftText(rawBlock, customInlineStyleFn);
            var parser = new DOMParser();
            inlineStyledBlock.text = parser.parseFromString(inlineStyledBlock.text, 'text/html').body.innerHTML;
        }
        catch (e) {
            inlineStyledBlock = rawBlock;
        }
        return getHtmlBlockFromDraftText(inlineStyledBlock, customBlockStyleFn);
    });
    var _calculatedBlockGroups = calculateBlockGroups(rawContent.blocks, 0).sort(function (a, b) { return (a.index > b.index) ? 1 : -1; });
    _calculatedBlockGroups.forEach(function (blockResult) {
        // getHtmlGroupBlockFromDraftText()
        contentApplyBlockStyle = getHtmlGroupBlockFromDraftText(blockResult, contentApplyBlockStyle, customMultiBlockStyleFn);
    });
    return contentApplyBlockStyle.join("\n");
}
exports.convertDraftToHtml = convertDraftToHtml;
function getStyleElement(style, customInlineStyleFn) {
    var styleElement;
    if (customInlineStyleFn)
        styleElement = customInlineStyleFn(style);
    if (!styleElement)
        styleElement = getDefaultInlineStyle(style);
    return styleElement;
}
function getElementWithProperties(el) {
    if (!el)
        return;
    var styleStart = "<";
    styleStart += el.element;
    var props = el.properties ?
        Object.keys(el.properties).map(function (key) {
            return key + "=\"" + el.properties[key] + "\"";
        }).join(" ") : "";
    if (props.length > 0)
        styleStart += " " + props;
    styleStart += ">";
    var styleEnd = "</" + el.element + ">";
    var finalStyle = { start: styleStart, end: styleEnd };
    return finalStyle;
}
function getHtmlInlineStyleFromDraftText(textBlock, customInlineStyleFn) {
    if (!textBlock.inlineStyleRanges || textBlock.inlineStyleRanges.length == 0)
        return textBlock;
    var currentStyle = textBlock.inlineStyleRanges.shift();
    if (!currentStyle)
        return textBlock;
    var styleEl = getElementWithProperties(getStyleElement(currentStyle.style, customInlineStyleFn));
    if (!styleEl)
        return getHtmlInlineStyleFromDraftText(textBlock);
    var nextText = [
        textBlock.text.slice(0, currentStyle.offset),
        styleEl.start + textBlock.text.slice(currentStyle.offset, currentStyle.offset + currentStyle.length) + styleEl.end,
        textBlock.text.slice(currentStyle.offset + currentStyle.length)
    ].join('');
    textBlock.inlineStyleRanges = textBlock.inlineStyleRanges.map(function (style) {
        var newStyle = JSON.parse(JSON.stringify(style));
        if (currentStyle.offset <= style.offset)
            newStyle.offset += styleEl.start.length;
        else if (currentStyle.offset <= style.offset + style.length)
            newStyle.length += styleEl.start.length;
        if (currentStyle.offset + currentStyle.length <= style.offset)
            newStyle.offset += styleEl.end.length;
        else if (currentStyle.offset + currentStyle.length <= style.offset + style.length)
            newStyle.length += styleEl.end.length;
        return newStyle;
    });
    textBlock.text = nextText;
    return getHtmlInlineStyleFromDraftText(textBlock);
}
function getDefaultInlineStyle(type) {
    switch (type) {
        case "BOLD":
            // return {start: "<strong>", end: "</strong>"};
            return { element: "strong", properties: { class: "hello there" } };
        case "ITALIC":
            // return {start: "<i>", end: "</i>"};
            return { element: "i" };
        case "UNDERLINE":
            // return {start: "<u>", end: "</u>"};
            return { element: "u" };
        case "CODE":
            // return {start: "<code>", end: "</code>"};
            return { element: "code" };
        default:
            return;
    }
}
function getDefaultGroupBlock(type) {
    switch (type) {
        case 'ordered-list-item':
            return { element: 'ol' };
        case 'unordered-list-item':
            return { element: 'ul' };
        default:
            return;
    }
}
function getHtmlGroupBlockFromDraftText(blockResult, contentApplyBlockStyle, customMultiBlockStyleFn) {
    var blockGroupElement;
    if (customMultiBlockStyleFn)
        blockGroupElement = customMultiBlockStyleFn(blockResult.type);
    if (!blockGroupElement)
        blockGroupElement = getDefaultGroupBlock(blockResult.type);
    var blockGroupElStyle = getElementWithProperties(blockGroupElement);
    if (blockGroupElStyle) {
        contentApplyBlockStyle[blockResult.index] = blockGroupElStyle.start + "\n" + contentApplyBlockStyle[blockResult.index];
        contentApplyBlockStyle[blockResult.index + blockResult.size - 1] = contentApplyBlockStyle[blockResult.index + blockResult.size - 1] + "\n" + blockGroupElStyle.end;
    }
    return contentApplyBlockStyle;
}
function getHtmlBlockFromDraftText(rawBlock, customBlockStyleFn) {
    // if (customBlockStyleFn)
    //     result = customBlockStyleFn(inlineStyledBlock);
    //
    // if (!result)
    //     result = getHtmlBlockFromDraftText(inlineStyledBlock);
    var elem;
    if (customBlockStyleFn)
        elem = customBlockStyleFn(rawBlock.type);
    if (!elem)
        elem = getDefaultBlockFromDraftText(rawBlock.type);
    var result = getElementWithProperties(elem);
    if (!result)
        return rawBlock.text;
    return result.start + rawBlock.text + result.end;
}
function getDefaultBlockFromDraftText(type) {
    switch (type) {
        case 'unstyled':
        case 'paragraph':
            return { element: 'p' };
        case 'header-one':
            return { element: 'h1' };
        case 'header-two':
            return { element: 'h2' };
        case 'header-three':
            return { element: 'h3' };
        case 'header-four':
            return { element: 'h4' };
        case 'header-five':
            return { element: 'h5' };
        case 'header-six':
            return { element: 'h6' };
        case 'ordered-list-item':
        case 'unordered-list-item':
            return { element: 'li' };
        case 'blockquote':
            return { element: 'blockquote' };
        case 'code-block':
            return { element: 'pre' };
        default:
            return;
    }
}
function calculateBlockGroups(data, start, recursiveResult) {
    if (recursiveResult === void 0) { recursiveResult = []; }
    var startBlock = data[start];
    var size = 1;
    for (var i = start + 1; i < data.length; i++) {
        if (startBlock.type === data[i].type && startBlock.depth <= data[i].depth) {
            if (startBlock.depth < data[i].depth) {
                recursiveResult = calculateBlockGroups(data, i, recursiveResult);
                size += recursiveResult[recursiveResult.length - 1].size;
                i += recursiveResult[recursiveResult.length - 1].size - 1;
            }
            else
                size++;
        }
        else if (startBlock.type !== data[i].type && startBlock.depth <= data[i].depth) {
            recursiveResult = calculateBlockGroups(data, i, recursiveResult);
            break;
        }
    }
    recursiveResult.push({ index: start, size: size, type: startBlock.type });
    return recursiveResult;
}
