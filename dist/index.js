"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function convertDraftToHtml(rawContent) {
    var contentApplyBlockStyle = rawContent.blocks.map(function (rawBlock) {
        return getHtmlBlockFromDraftText(rawBlock);
    });
    var _calculatedBlockGroups = calculateBlockGroups(rawContent.blocks, 0);
    _calculatedBlockGroups.forEach(function (blockResult) {
        contentApplyBlockStyle[blockResult.index] = "<ul>" + contentApplyBlockStyle[blockResult.index];
        contentApplyBlockStyle[blockResult.index + blockResult.size - 1] = contentApplyBlockStyle[blockResult.index + blockResult.size - 1] + "</ul>";
    });
    return contentApplyBlockStyle;
}
exports.convertDraftToHtml = convertDraftToHtml;
function getHtmlBlockFromDraftText(textBlock) {
    switch (textBlock.type) {
        case 'unstyled':
        // return `<p>${rawBlock.text}</p>`;
        case 'paragraph':
            return "<p>" + textBlock.text + "</p>";
        case 'header-one':
            return "<h1>" + textBlock.text + "</h1>";
        case 'header-two':
            return "<h2>" + textBlock.text + "</h2>";
        case 'header-three':
            return "<h3>" + textBlock.text + "</h3>";
        case 'header-four':
            return "<h4>" + textBlock.text + "</h4>";
        case 'header-five':
            return "<h5>" + textBlock.text + "</h5>";
        case 'header-six':
            return "<h6>" + textBlock.text + "</h6>";
        case 'ordered-list-item':
        case 'unordered-list-item':
            return "<li>" + textBlock.text + "</li>";
        case 'blockquote':
            return "<blockquote>" + textBlock.text + "</blockquote>";
        case 'code-block':
            return "<pre>" + textBlock.text + "</pre>";
        default:
            return "" + textBlock.text;
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
