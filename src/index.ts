import {RawDraftContentState, RawDraftContentBlock} from "draft-js";

export function convertDraftToHtml(rawContent: RawDraftContentState): any {
    const contentApplyBlockStyle = rawContent.blocks.map((rawBlock: RawDraftContentBlock) => {
        return getHtmlBlockFromDraftText(rawBlock);
    });

    const _calculatedBlockGroups = calculateBlockGroups(rawContent.blocks, 0);
    const contentApplyBlockGroupStyle = _calculatedBlockGroups.map((blockResult: IResult) => {
        contentApplyBlockStyle[blockResult.index] = "<ul>" + contentApplyBlockStyle[blockResult.index];
        contentApplyBlockStyle[blockResult.index + blockResult.size] = contentApplyBlockStyle[blockResult.index + blockResult.size] + "</ul>";
    });

    return contentApplyBlockGroupStyle;
}

function getHtmlBlockFromDraftText(textBlock: RawDraftContentBlock): string {
    switch(textBlock.type){
        case 'unstyled':
        // return `<p>${rawBlock.text}</p>`;
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
    type: string;
}

function calculateBlockGroups(data: RawDraftContentBlock[], start: number, recursiveResult: IResult[] = []): IResult[] {
    const startBlock = data[start];
    let size = 1;

    for(let i = start + 1; i < data.length; i++){
        if(startBlock.type === data[i].type && startBlock.depth <= data[i].depth) {
            if(startBlock.depth < data[i].depth){
                recursiveResult = calculateBlockGroups(data, i, recursiveResult);
                size += recursiveResult[recursiveResult.length - 1].size;
                i += recursiveResult[recursiveResult.length - 1].size - 1;
            }
            else
                size++;
        }
        else if(startBlock.type !== data[i].type && startBlock.depth <= data[i].depth){
            recursiveResult = calculateBlockGroups(data, i, recursiveResult);
            break;
        }
    }

    recursiveResult.push({index: start, size: size, type: startBlock.type});
    return recursiveResult;
}
