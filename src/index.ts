import {RawDraftContentState, RawDraftContentBlock} from "draft-js";

export function convertDraftToHtml(rawContent: RawDraftContentState): any {
    const content = rawContent.blocks.map((rawBlock: RawDraftContentBlock) => {
        return getHtmlBlockFromDraftText(rawBlock);
    });

    return content;
}

function getHtmlBlockFromDraftText(textBlock: RawDraftContentBlock): string | void {
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
