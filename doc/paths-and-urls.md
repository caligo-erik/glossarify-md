# [Paths and URLs](#paths-and-urls)

When using [glossarify-md][1] with a static website renderer it may be necessary to tweak links and link paths generated by glossarify-md. There are quite a few `linking` option which affect how links will be generated. They'll be explained in a bit more detail here:

## [`paths` and `baseUrl`](#paths-and-baseurl)

**Rules of thumb**:

*   Relative paths don't need a `baseUrl` absolute paths *most likely* do.
*   Use absolute paths and `baseUrl` if the links should use URLs.

> Nevertheless, don't be surprised seeing `baseUrl` *and* `paths: relative`. This could be *for other reasons* than linking (e.g. Exporting/Importing).

## [`pathComponents` and `pathRewrites`](#pathcomponents-and-pathrewrites)

**Rules of thumb**:

*   Use `pathComponents` first, because it might be easier
*   Use `pathRewrites` otherwise

### [Changing the File Extension](#changing-the-file-extension)

One thing which the previous options do not care for are file extensions. For example [glossarify-md][1] will keep the `.md` file extension in output files assuming that any post processor should expect markdown files to link each other using that file extension.

However, some static website renderers or translators like [pandoc][2] are able to translate Markdown to HTML but forget about changing file extensions present in links:

*   Use `pathComponents: ["path", "file"]` and omit `"ext"` to drop the file extension
*   Use `pathRewrites: { ".html": ".md" }` to change the file extension

### [Path Rewriting](#path-rewriting)

If your post processor moves files around but is not able to properly adjust link paths, then you may whish [glossarify-md][1] to produce paths which resemble the final structure rather than the output structure created by glossarify-md.

**Rules of thumb**:

*   `pathRewrites` won't change the output directory structure of [glossarify-md][1]'s `outDir` *but links only*.
*   Consider `paths: absolute` when rewriting *paths* (optionally with a `baseUrl`), it might be easier.
*   You can only rewrite *URLs* which are based on `baseUrl`.

*Example: when markdown files from a deep structure get moved all into the same directory*

    {
      "linking": {
        "pathRewrites": {
            "/images/$2.$3": ["(.*)/(.*).(png|jpg|svg|gif)"],
            "/files/$1.md": ["/(.*)/(.*).md"]
        }
      }
    }

You can use anything acceptable to JavaScript's `String.replace()` method. Just note that in the rewrite map *keys are the replacer* and *values are one or more search expressions* (including regular expressions).

[1]: https://github.com/about-code/glossarify-md "This project."

[2]: https://pandoc.org "See pandoc."