import { DraftBlockType, RawDraftContentBlock, RawDraftContentState } from "draft-js";
declare type blockStyleCallback = (rawBlock: RawDraftContentBlock) => string | void;
declare type multiBlockStyleCallback = (type: DraftBlockType) => string | void;
export declare function convertDraftToHtml(rawContent: RawDraftContentState, customBlockStyleFn?: blockStyleCallback, customMultiBlockStyleFn?: multiBlockStyleCallback): string;
export {};
