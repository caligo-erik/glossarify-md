# Installing Plug-ins

[doc-conceptual-layers]: ./conceptual-layers.md
[mdast-util-visit]: https://npmjs.com/package/mdast-util-visit
[remark-discussion]: https://github.com/remarkjs/remark/discussions/869#discussioncomment-1602674
[remark-frontmatter]: https://npmjs.com/package/remark-frontmatter
[remark-plugin]: https://github.com/remarkjs/awesome-remark
[unified-config]: https://github.com/unifiedjs/unified-engine/blob/main/doc/configure.md
[verdaccio]: https://npmjs.com/package/verdaccio


The following example demonstrates how to install [remark-frontmatter], a [remark plug-in][remark-plugin] to make glossarify-md handle non-standard *Frontmatter* syntax, correctly.

> **ⓘ  Note:** glossarify-md does not guarantee compatibility with plug-ins and likely won't help with issues arising due to installing and using additional third-party plug-ins.

We'll assume the following project structure:

~~~
${root}
   +- docs/                        (baseDir)
   +- docs-glossarified/           (outDir)
   +- node_modules/
   |- glossarify-md.conf.json
   |- package.json
   '- .gitignore
~~~

**1:** Install [remark-frontmatter]:

~~~
npm install remark-frontmatter
~~~

**2:** In your `glossarify-md.conf.json` add:

```json
{
  "unified": {
    "plugins": {
      "remark-frontmatter": {
        "type": "yaml",
        "marker": "-"
      }
    }
  }
}
```

Keys of the `plugins` object tell what to load and may be:
- *names of npm packages*
- *paths of JavaScript modules.*

Their value in turn are options passed to the plug-in. Read [remark-frontmatter] docs, to find out about available options.

> ⓘ The `unified` key embeds a [unified configuration][unified-config] object. Its schema is *not* subject to glossarify-md's own config schema, anymore. Thus, if you would like to have the configs separated a bit more clearly, then you can split them:
>
> **3:** Create a file `unified.conf.json` next to `glossarify-md.conf.json`
>
> **4:** Copy the value of `unified` to `unified.conf.json`:
> ```json
> {
>   "plugins": {
>     "remark-frontmatter": {
>       "type": "yaml",
>       "marker": "-"
>     }
>   }
> }
> ```
>
> **5:** In `glossarify-md.conf.json` replace `plugins` with `rcPath` (rooted in `outDir`, so you need to step out):
> ```json
> {
>   "unified": {
>     "rcPath": "../unified.conf.json"
>   }
> }
> ```
>
> If you would like to learn more about how *unified* and *remark* relate to glossarify-md, read [Conceptual Layers][doc-conceptual-layers].
