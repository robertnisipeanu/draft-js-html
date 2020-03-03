import { DraftBlockType, RawDraftContentBlock, RawDraftContentState } from "draft-js";
declare type BlockStyleCallback = (rawBlock: RawDraftContentBlock) => string | void;
declare type MultiBlockStyleCallback = (type: DraftBlockType) => string | void;
export declare function convertDraftToHtml(rawContent: RawDraftContentState, customBlockStyleFn?: BlockStyleCallback, customMultiBlockStyleFn?: MultiBlockStyleCallback): string;
export {};
