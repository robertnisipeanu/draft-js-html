import { DraftBlockType, DraftInlineStyleType, RawDraftContentBlock, RawDraftContentState } from "draft-js";
export interface IElementStyle {
    element: string;
    properties?: {
        [key: string]: string;
    };
}
declare type InlineStyleCallback = (type: DraftInlineStyleType) => IElementStyle | void;
declare type BlockStyleCallback = (rawBlock: RawDraftContentBlock) => string | void;
declare type MultiBlockStyleCallback = (type: DraftBlockType) => IElementStyle | void;
export declare function convertDraftToHtml(rawContent: RawDraftContentState, customInlineStyleFn?: InlineStyleCallback, customBlockStyleFn?: BlockStyleCallback, customMultiBlockStyleFn?: MultiBlockStyleCallback): string;
export {};
