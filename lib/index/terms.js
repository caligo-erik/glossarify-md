import { heading, html, link, paragraph, root, strong, text } from "mdast-builder";
import { getNodeId, getNodeText } from "../ast/tools.js";
import { TermDefinitionNode } from "../ast/with/term-definition.js";
import { TermOccurrenceNode } from "../ast/with/term-occurrence.js";
import { byGroupHeading, getIndex, group } from "../indexer.js";
import { getFileLinkUrl, relativeFromTo } from "../path/tools.js";
import { collator } from "../text/collator.js";
import { pad } from "../text/tools.js";

/**
 * @typedef { import("./model/context") } Context
 * @typedef { import("./ast/tools").Node } Node
 * @typedef {{
 *      definitions: Term[],
 *      occurrences: {[path: string]: Node}
 * }} IndexOldEntry
 * @typedef {{ [term: string]: IndexOldEntry }} IndexOld
 */

const brk = text("\n");

export const IDX_TERMS = Symbol("termsAsList");
export const IDX_TERMS_BY_ID = Symbol("termsById");
export const IDX_TERMS_BY_PHRASE = Symbol("termsByPhrase_Hash8");
export const IDX_OCCURRENCES_BY_PHRASE = Symbol("termOccurencesByPhrase_Hash8");

export const indexes = [{
    id: IDX_OCCURRENCES_BY_PHRASE
    ,title: "Book Index"
    ,filterFn: (node) => node.type === TermOccurrenceNode.type
    ,keyFn:    (node) => node.value
    ,conf:     (context) => {
        const {generateFiles} = context.conf;
        const {indexFile} = generateFiles;
        return indexFile;
    }
}
,{
    id: IDX_TERMS_BY_ID
    ,title: "Glossary Terms"
    ,filterFn: (node) => node.type === TermDefinitionNode.type
    ,keyFn: (node) => node.headingId
    ,conf: () => null
}
,{
    id: IDX_TERMS_BY_PHRASE
    ,title: "Glossary Terms"
    ,filterFn: (node) => node.type === TermDefinitionNode.type
    ,keyFn: (node) => node.valueHash8 /* use the constant-length hash of the term */
    ,conf: () => null
}
,{
    id: IDX_TERMS
    ,title: "Terms"
    ,filterFn: (node) => node.type === TermDefinitionNode.type
    ,keyFn: () => 0
    ,conf: () => null
}];


/**
 * Returns the markdown abstract syntax tree that is to be written to the file
 * configured via 'generateFiles.indexFile' config.
 *
 * @param {Context} context
 * @returns {Node} mdast tree
 */
export function getAST(context, indexFileConf) {
    let indexEntries;
    const { title, glossary } = indexFileConf = Object.assign(
        {
            title: "Book Index"
            ,hideDeepLinks: false
        }
        ,indexFileConf || {}
    );
    if (indexFileConf.glossary) {
        indexEntries = {};
        const baseDir = context.conf.baseDir;
        const glossaryFile = relativeFromTo(baseDir, glossary, baseDir);
        const termsEntries = getIndex(IDX_TERMS);
        const termOccEntries = getIndex(IDX_OCCURRENCES_BY_PHRASE);
        (termsEntries[0] || [])
            .filter(e => e.file === glossaryFile)
            .forEach(e => {
                const term = e.node.value;
                const termOcc = termOccEntries[term];
                if (termOcc) {
                    indexEntries[term] = termOcc;
                }
            });
    } else {
        indexEntries = getIndex(IDX_OCCURRENCES_BY_PHRASE);
    }

    // Create AST from index
    let tree = [
        heading(1, text(title))
        // Concatenate AST for each index entry
        ,...Object
            .keys(indexEntries)
            .sort((key1, key2) => collator.compare(key1, key2))
            .map((key) => getIndexEntryAst(context, indexEntries[key], indexFileConf))
    ];
    return root(tree);
}

/**
 *
 * @param {Context} context
 * @param {IndexEntry} entriesForKey
 * @param {Object} indexFileConf
 * @returns {Node} mdast tree
 */
function getIndexEntryAst(context, entriesForKey, indexFileConf) {
    const key = getNodeText(entriesForKey[0].node);
    return paragraph([
        heading(2, text(key))
        ,brk
        ,brk
        ,...getEntryLinksAst(context, entriesForKey, indexFileConf)
    ]);
}

/**
 *
 * @param {Context} context
 * @param {IndexEntry} indexEntry
 * @param {Object} indexFileConf
 */
function getEntryLinksAst(context, entriesForKey, indexFileConf) {
    const byHeadings = group(entriesForKey, byGroupHeading);
    const links = [
        ...getGlossaryLinksAst(context, entriesForKey, indexFileConf)
        ,...getDocumentLinksAst(context, byHeadings, indexFileConf)
    ];
    const linksSeparated = [];
    for (let i = 0, len = links.length; i < len; i++) {
        if (i > 0) {
            linksSeparated.push(text(" \u25cb "));
        }
        linksSeparated.push(links[i]);
    }
    return linksSeparated;
}

/**
 * @param {Context} context
 * @param {IndexEntry} entriesForKey
 * @param {string} fromIndexFilename
 * @returns {Node} mdast Node
 */
function getGlossaryLinksAst(context, entriesForKey, indexFileConf) {
    const fromIndexFilename = indexFileConf.file;
    return entriesForKey[0].node.termDefs
        .sort(TermDefinitionNode.compare)
        .map((termDefinitionNode) => {
            const toGlossaryFilename = context.resolvePath(termDefinitionNode.glossVFile.glossConf.file);
            const url = getFileLinkUrl(context, fromIndexFilename, toGlossaryFilename, termDefinitionNode.anchor);
            return link(url, termDefinitionNode.getShortDescription(), text(termDefinitionNode.glossVFile.glossConf.title));
        });
}

/**
 * @param {Context} context
 * @param {IndexEntry} indexEntry
 * @returns {Node} mdast tree
 */
function getDocumentLinksAst(context, byHeadings, indexFileConf) {
    return byHeadings
        .map((indexEntryOccurrences) => {
            const indexEntry = indexEntryOccurrences[0]; // [1]
            const toDocumentFilename = indexEntry.file;
            const fromIndexFilename = indexFileConf.file;
            const hideDeepLinks = indexFileConf.hideDeepLinks;
            const termNode = indexEntry.node.termDefs[0];
            const targetHeadingNode = indexEntry.groupHeadingNode;
            const targetHeadingId = getNodeId(targetHeadingNode);
            const targetUrl = getFileLinkUrl(context, fromIndexFilename, toDocumentFilename, targetHeadingId);
            const groupByHeadingDepth = context.conf.indexing.groupByHeadingDepth;
            let linkLabel;
            let linkLabelNode;

            if (targetHeadingNode) {
                linkLabel = getNodeText(targetHeadingNode);
            } else {
                linkLabel = targetUrl;
            }
            if (linkLabel === termNode.glossVFile.glossConf.title) {
                // prevent duplicate listing of glossary title (see also getGlossaryLinksAst())
                return null;
            } else {
                linkLabelNode = text(linkLabel);
            }

            if (targetHeadingNode
                && targetHeadingNode.depth === 1
                && groupByHeadingDepth > 1
            ) {
                // If a Book Index not only contains links to pages but also
                // links to page sections, then among all links highlight those
                // pointing to a page.
                linkLabelNode = strong([linkLabelNode]);
            }

            const deepOccurrencesAst = getLinksToOccurrenceAst(context, fromIndexFilename, indexEntryOccurrences);
            if (hideDeepLinks || deepOccurrencesAst.length === 0) {
                return link(targetUrl, null, linkLabelNode);
            } else {
                return paragraph([
                    link(targetUrl, null, linkLabelNode)
                    ,html("<sub>↳ ")
                    ,...deepOccurrencesAst
                    ,html("</sub>")
                ]);
            }
        })
        .filter(linkNode => linkNode !== null);
    // Implementation Notes:
    // [1]: We get the index entries for all occurrences of a particular term
    // below the given heading. Since we can only link to the heading but not
    // each particular term position we can derive the heading link from the
    // first term occurrence, solely.
}

function getLinksToOccurrenceAst(context, fromIndexFilename, indexEntries) {
    let {groupByHeadingDepth} = context.conf.indexing;
    let i = 1;
    return group(indexEntries, byHeading)
        .map((entriesByHeading) => {
            const { headingNode, file } = entriesByHeading[0];
            if (headingNode && headingNode.depth > groupByHeadingDepth) {
                const sectionId = getNodeId(headingNode);
                const ref = getFileLinkUrl(context, fromIndexFilename, file, sectionId);
                return paragraph([
                    text(`${i > 1 ? ", " : ""}`)
                    ,link(ref, getNodeText(headingNode), text(`${++i}`))
                ]);
            }
        })
        .filter(html => html !== undefined);
}

function byHeading(indexEntry) {
    const groupHeadingNode = indexEntry.headingNode;
    let pos = pad("0", "0", -6);
    if (groupHeadingNode) {
        // Left-Pad required because group() will sort lexicographically
        // by group key. Without padding 'file.md#11' would sort before
        // 'file.md#2';
        pos = pad(groupHeadingNode.position.start.line, "0", -6);
    }
    // return key
    return `${indexEntry.file}#${pos}`;
}
