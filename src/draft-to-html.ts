import {DraftBlockType, DraftInlineStyleType, RawDraftContentBlock, RawDraftContentState, RawDraftInlineStyleRange} from "draft-js";

export interface IElementStyle {
    element: string;
    properties?: {[key: string]: string};
}

interface IElement {
    start: string;
    end: string;
}

type InlineStyleCallback = (type: DraftInlineStyleType) => IElementStyle | void;
type BlockStyleCallback = (type: DraftBlockType) => IElementStyle | void;
type MultiBlockStyleCallback = (type: DraftBlockType) => IElementStyle | void;

export function convertDraftToHtml(rawContent: RawDraftContentState, customInlineStyleFn?: InlineStyleCallback, customBlockStyleFn?: BlockStyleCallback, customMultiBlockStyleFn?: MultiBlockStyleCallback): string {

    let contentApplyBlockStyle = rawContent.blocks.map((rawBlock: RawDraftContentBlock) => {

        let inlineStyledBlock;
        try {
            inlineStyledBlock = getHtmlInlineStyleFromDraftText(rawBlock, customInlineStyleFn);
            const parser = new DOMParser();
            inlineStyledBlock.text = parser.parseFromString(inlineStyledBlock.text, 'text/html').body.innerHTML;
        } catch(e) {
            inlineStyledBlock = rawBlock;
        }

        return getHtmlBlockFromDraftText(inlineStyledBlock, customBlockStyleFn);
    });

    const _calculatedBlockGroups = calculateBlockGroups(rawContent.blocks, 0).sort((a, b) => (a.index > b.index) ? 1 : -1);


    _calculatedBlockGroups.forEach((blockResult: IResult) => {
        contentApplyBlockStyle = getHtmlGroupBlockFromDraftText(blockResult, contentApplyBlockStyle, customMultiBlockStyleFn);
    });

    return contentApplyBlockStyle.join("\n");
}

function getStyleElement(style: DraftInlineStyleType, customInlineStyleFn?: InlineStyleCallback) {
    let styleElement: IElementStyle | void;
    if(customInlineStyleFn)
        styleElement = customInlineStyleFn(style);
    if(!styleElement)
        styleElement = getDefaultInlineStyle(style);

    return styleElement;
}

function getElementWithProperties(el: IElementStyle | void) {
    if(!el) return;

    let styleStart = "<";
    styleStart += el.element;
    const props = el.properties ?
        Object.keys(el.properties).map((key) => {
            return key + "=\"" + el.properties![key] + "\""
        }).join(" ") : "";

    if(props.length > 0)
        styleStart += " " + props;
    styleStart += ">";
    let styleEnd = `</${el.element}>`;

    const finalStyle: IElement = {start: styleStart, end: styleEnd};
    return finalStyle;
}

function getHtmlInlineStyleFromDraftText(textBlock: RawDraftContentBlock, customInlineStyleFn?: InlineStyleCallback): RawDraftContentBlock {
    if(!textBlock.inlineStyleRanges || textBlock.inlineStyleRanges.length == 0) return textBlock;

    const currentStyle = textBlock.inlineStyleRanges.shift();
    if(!currentStyle) return textBlock;
    const styleEl = getElementWithProperties(getStyleElement(currentStyle.style, customInlineStyleFn));
    if(!styleEl) return getHtmlInlineStyleFromDraftText(textBlock);

    let nextText = [
        textBlock.text.slice(0, currentStyle.offset),
        styleEl.start + textBlock.text.slice(currentStyle.offset, currentStyle.offset + currentStyle.length) + styleEl.end,
        textBlock.text.slice(currentStyle.offset + currentStyle.length)
    ].join('');

    textBlock.inlineStyleRanges = textBlock.inlineStyleRanges.map((style) => {
        const newStyle: RawDraftInlineStyleRange = JSON.parse(JSON.stringify(style));
        if(currentStyle.offset <= style.offset)
            newStyle.offset += styleEl.start.length;
        else if(currentStyle.offset <= style.offset + style.length)
            newStyle.length += styleEl.start.length;

        if(currentStyle.offset + currentStyle.length <= style.offset)
            newStyle.offset += styleEl.end.length;
        else if(currentStyle.offset + currentStyle.length <= style.offset + style.length)
            newStyle.length += styleEl.end.length;

        return newStyle;
    });

    textBlock.text = nextText;

    return getHtmlInlineStyleFromDraftText(textBlock);
}

function getDefaultInlineStyle(type: DraftInlineStyleType): IElementStyle | undefined {
    switch(type){
        case "BOLD":
            return {element: "strong"};
        case "ITALIC":
            return {element: "i"};
        case "UNDERLINE":
            return {element: "u"};
        case "CODE":
            return {element: "code"};
        default:
            return;
    }
}

function getDefaultGroupBlock(type: DraftBlockType): IElementStyle | undefined {
    switch (type) {
        case 'ordered-list-item':
            return {element: 'ol'};
        case 'unordered-list-item':
            return {element: 'ul'};
        default:
            return;
    }
}

function getHtmlGroupBlockFromDraftText(blockResult: IResult, contentApplyBlockStyle: string[], customMultiBlockStyleFn?: MultiBlockStyleCallback): string[] {
    let blockGroupElement;
    if(customMultiBlockStyleFn)
        blockGroupElement = customMultiBlockStyleFn(blockResult.type);
    if(!blockGroupElement)
        blockGroupElement = getDefaultGroupBlock(blockResult.type);
    const blockGroupElStyle = getElementWithProperties(blockGroupElement);

    if (blockGroupElStyle) {
        contentApplyBlockStyle[blockResult.index] = `${blockGroupElStyle.start}\n${contentApplyBlockStyle[blockResult.index]}`;
        contentApplyBlockStyle[blockResult.index + blockResult.size - 1] = `${contentApplyBlockStyle[blockResult.index + blockResult.size - 1]}\n${blockGroupElStyle.end}`;
    }

    return contentApplyBlockStyle;
}

function getHtmlBlockFromDraftText(rawBlock: RawDraftContentBlock, customBlockStyleFn?: BlockStyleCallback) {
    let elem;
    if(customBlockStyleFn)
        elem = customBlockStyleFn(rawBlock.type);
    if(!elem)
        elem = getDefaultBlockFromDraftText(rawBlock.type);

    const result = getElementWithProperties(elem);
    if(!result) return rawBlock.text;

    return result.start + rawBlock.text + result.end;
}

function getDefaultBlockFromDraftText(type: DraftBlockType): IElementStyle | void {
    switch (type) {
        case 'unstyled':
        case 'paragraph':
            return {element: 'p'};
        case 'header-one':
            return {element: 'h1'};
        case 'header-two':
            return {element: 'h2'};
        case 'header-three':
            return {element: 'h3'};
        case 'header-four':
            return {element: 'h4'};
        case 'header-five':
            return {element: 'h5'};
        case 'header-six':
            return {element: 'h6'};
        case 'ordered-list-item':
        case 'unordered-list-item':
            return {element: 'li'};
        case 'blockquote':
            return {element: 'blockquote'};
        case 'code-block':
            return {element: 'pre'};
        default:
            return;
    }
}

interface IResult {
    index: number;
    size: number;
    type: DraftBlockType;
}

function calculateBlockGroups(data: RawDraftContentBlock[], start: number, recursiveResult: IResult[] = []): IResult[] {
    const startBlock = data[start];
    let size = 1;

    for (let i = start + 1; i < data.length; i++) {
        if (startBlock.type === data[i].type && startBlock.depth <= data[i].depth) {
            if (startBlock.depth < data[i].depth) {
                recursiveResult = calculateBlockGroups(data, i, recursiveResult);
                size += recursiveResult[recursiveResult.length - 1].size;
                i += recursiveResult[recursiveResult.length - 1].size - 1;
            } else
                size++;
        } else if (startBlock.type !== data[i].type && startBlock.depth <= data[i].depth) {
            recursiveResult = calculateBlockGroups(data, i, recursiveResult);
            break;
        }
    }

    recursiveResult.push({index: start, size: size, type: startBlock.type});
    return recursiveResult;
}
