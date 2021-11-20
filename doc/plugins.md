# [Installing Syntax Plug-ins](#installing-syntax-plug-ins)

[doc-conceptual-layers]: ./conceptual-layers.md

[CommonMark]: https://www.commonmark.org

[glossarify-md]: https://github.com/about-code/glossarify-md

[remark]: https://github.com/remarkjs/remark

[remark-frontmatter]: https://npmjs.com/package/remark-frontmatter

[remark-plugin]: https://github.com/remarkjs/awesome-remark

[unified]: https://unifiedjs.com

[unified-config]: https://github.com/unifiedjs/unified-engine/blob/main/doc/configure.md

The following example demonstrates how to install a [remark plug-in][remark-plugin]. The plug-in will extend glossarify-md's markdown parser [remark]  with support for *Frontmatter* syntax.

> **☛ Note:** glossarify-md does not guarantee compatibility with plug-ins and likely won't help with issues arising due to installing and using additional third-party plug-ins.

We'll assume the following file structure:

    ${root}
       +- docs/                        (baseDir)
       +- docs-glossarified/           (outDir)
       +- node_modules/
       |- glossarify-md.conf.json
       |- remark.conf.json
       |- package.json
       '- .gitignore

**1:** Next to your `outDir` create a file `remark.conf.json`. Then add to your `glossarify-md.conf.json`:

```json
{
  "unified": {
    "rcPath": "../remark.conf.json"
  }
}
```

`rcPath` is interpreted relative to `outDir`, so you need to "step out" of it.

**2:** Then install a [remark plug-in][remark-plugin]

    npm install remark-frontmatter

**3:** Make [remark🟉][1] load the plug-in by adding to your `remark.conf.json`:

*[remark🟉][1].conf.js*

```json
{
  "plugins": {
    "remark-frontmatter": {
      "type": "yaml",
      "marker": "-"
    }
  }
}
```

1.  `remark-frontmatter` must be the name of the npm package you installed before
2.  any properties of the `remark-frontmatter` object are options specific to the plug-in.

`remark.conf.json` follows the [unified configuration][unified-config] schema. You could also embed the configuration into a `glossarify-md.conf.json` by replacing `rcPath` above with `plugins`. But keep in mind that anything under the `unified` key is a different config schema and *not* subject to [glossarify-md]'s config schema.

> **ⓘ [remark], [unified], uhh... ?**
>
> Read more on how these projects relate to glossarify-md in [Conceptual Layers][doc-conceptual-layers].

[1]: ./glossary.md#remark "remark is a parser and compiler project under the unified umbrella for Markdown text files in particular."