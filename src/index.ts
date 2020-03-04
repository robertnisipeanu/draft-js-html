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
type BlockStyleCallback = (rawBlock: RawDraftContentBlock) => string | void;
type MultiBlockStyleCallback = (type: DraftBlockType) => string | void;

export function convertDraftToHtml(rawContent: RawDraftContentState, customInlineStyleFn?: InlineStyleCallback, customBlockStyleFn?: BlockStyleCallback, customMultiBlockStyleFn?: MultiBlockStyleCallback): string {

    const contentApplyBlockStyle = rawContent.blocks.map((rawBlock: RawDraftContentBlock) => {

        let inlineStyledBlock;
        try {
            inlineStyledBlock = getHtmlInlineStyleFromDraftText(rawBlock, customInlineStyleFn);
            const parser = new DOMParser();
            inlineStyledBlock.text = parser.parseFromString(inlineStyledBlock.text, 'text/html').body.innerHTML;
        } catch(e) {
            inlineStyledBlock = rawBlock;
        }

        let result;
        if (customBlockStyleFn)
            result = customBlockStyleFn(inlineStyledBlock);

        if (!result)
            result = getHtmlBlockFromDraftText(inlineStyledBlock);
        return result;
    });

    const _calculatedBlockGroups = calculateBlockGroups(rawContent.blocks, 0).sort((a, b) => (a.index > b.index) ? 1 : -1);


    _calculatedBlockGroups.forEach((blockResult: IResult) => {
        let blockGroupElement;
        if(customMultiBlockStyleFn)
            blockGroupElement = customMultiBlockStyleFn(blockResult.type);
        if(!blockGroupElement)
            blockGroupElement = getHtmlGroupBlockFromDraftText(blockResult.type);

        if (blockGroupElement) {
            contentApplyBlockStyle[blockResult.index] = `<${blockGroupElement}>\n${contentApplyBlockStyle[blockResult.index]}`;
            contentApplyBlockStyle[blockResult.index + blockResult.size - 1] = `${contentApplyBlockStyle[blockResult.index + blockResult.size - 1]}\n</${blockGroupElement}>`;
        }
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
            // return {start: "<strong>", end: "</strong>"};
            return {element: "strong", properties: {class: "hello there"}};
        case "ITALIC":
            // return {start: "<i>", end: "</i>"};
            return {element: "i"};
        case "UNDERLINE":
            // return {start: "<u>", end: "</u>"};
            return {element: "u"};
        case "CODE":
            // return {start: "<code>", end: "</code>"};
            return {element: "code"};
        default:
            return;
    }
}

function getHtmlGroupBlockFromDraftText(type: DraftBlockType): string | void {
    switch (type) {
        case 'ordered-list-item':
            return 'ol';
        case 'unordered-list-item':
            return 'ul';
        default:
            return;
    }
}

function getHtmlBlockFromDraftText(textBlock: RawDraftContentBlock): string {
    switch (textBlock.type) {
        case 'unstyled':
        case 'paragraph':
            return `<p>${textBlock.text}</p>`;
        case 'header-one':
            return `<h1>${textBlock.text}</h1>`;
        case 'header-two':
            return `<h2>${textBlock.text}</h2>`;
        case 'header-three':
            return `<h3>${textBlock.text}</h3>`;
        case 'header-four':
            return `<h4>${textBlock.text}</h4>`;
        case 'header-five':
            return `<h5>${textBlock.text}</h5>`;
        case 'header-six':
            return `<h6>${textBlock.text}</h6>`;
        case 'ordered-list-item':
        case 'unordered-list-item':
            return `<li>${textBlock.text}</li>`;
        case 'blockquote':
            return `<blockquote>${textBlock.text}</blockquote>`;
        case 'code-block':
            return `<pre>${textBlock.text}</pre>`;
        default:
            return `${textBlock.text}`;
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
