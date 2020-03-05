# draft-js-html

This repository is used to convert draft-js RawDraftContentState's into html content

It supports custom inline styling, custom block styling and custom multi block style (multiple elements of the same type, for example custom 'ul', 'ol', codeblock of multiple blocks)

Function:
```
// Element interface:
export interface IElementStyle {
    element: string;
    properties?: {[key: string]: string};
}

// It will append 'properties' to the element
// Eg. '{element: "span", properties: {class: "color-red"}}'

// Types used as module parameters:
type InlineStyleCallback = (type: DraftInlineStyleType) => IElementStyle | void;
type BlockStyleCallback = (type: DraftBlockType) => IElementStyle | void;
type MultiBlockStyleCallback = (type: DraftBlockType) => IElementStyle | void;

// Exported function from this module:
convertDraftToHtml(rawContent: RawDraftContentState, customInlineStyleFn?: InlineStyleCallback, customBlockStyleFn?: BlockStyleCallback, customMultiBlockStyleFn?: MultiBlockStyleCallback)
```

Example usage:

```js
convertDraftToHtml(rawContent); // Convert with default styles

convertDraftToHtml(rawContent, type => {
            if(type == "BOLD") return {element: "strong", properties: {class: "example", placeholder: "example", customProp: "this is a custom prop"}};
        }, type => {
            if(type == "unstyled") return {element: "span", properties: {class: "custom-unstyled"}};
        }, type => {
            if(type == "unordered-list-item") return {element: "ul"};
            if(type == "code-block") return {element: "code"};
        });
```

### Defaults
- default applied styles without having to provide them yourself with custom styles, if you do not like them you can override them by returning something with customStyles
    - InlineStyles:
        - `BOLD` => `{element: 'strong'}`,
        - `ITALIC` => `{element: 'i'}`,
        - `UNDERLINE` => `{element: 'u'}`
    - BlockStyles:
        - `unstyled` / `paragraph` => `{element: 'p'}`,
        - `header-one` => `{element: 'h1'}`,
        - `header-two` => `{element: 'h2'}`,
        - `header-three` => `{element: 'h3'}`,
        - `header-four` => `{element: 'h4'}`,
        - `header-five` => `{element: 'h5'}`,
        - `header-six` => `{element: 'h6'}`,
        - `ordered-list-item` / `unordered-list-item` => `{element: 'li'}`,
        - `blockquote` => `{element: 'blockquote'}`,
        - `code-block` => `{element: 'pre'}`
     - MultiBlockStyles:
        - `ordered-list-item` => `{element: 'ol'}`,
        - `unordered-list-item` => `{element: 'ul'}`

Coming soon: Conversion from HTML to RawDraftContentState