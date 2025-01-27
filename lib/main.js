import GitHubSlugger from "github-slugger";
import proc from "node:process";
import { exportGlossaries } from "./exporter.js";
import { importGlossaries } from "./importer.js";
import { newContext } from "./model/context.js";
import {
    readDocumentFiles,
    readGlossaries
} from "./reader.js";
import {
    copyBaseDirToOutDir,
    writeDocumentFiles,
    writeIndexFiles,
    writeListFiles,
    writeReport,
    writeTestOutput
} from "./writer.js";

export async function run(glossarifyMdConf) {
    try {
        let context = await newContext(glossarifyMdConf);
        await copyBaseDirToOutDir(context);
        await importGlossaries(context);
        await readGlossaries(context);
        await readDocumentFiles(context);
        await exportGlossaries(context);
        await Promise.all([
            writeDocumentFiles(context)
            ,writeIndexFiles(context)
            ,writeListFiles(context)
        ]);
        await Promise.all([
            writeReport(context)
            ,writeTestOutput(context)
        ]);
        return context;
    } catch (err) {
        console.error(err);
        proc.exit(1);
    }
}

/**
 * Provide internally used slugifier to allow for better integration with vuepress
 * See also https://github.com/about-code/glossarify-md/issues/27.
 */
export function getSlugger() {
    return (url) => {
        const slugger = new GitHubSlugger();
        return slugger.slug(url);
    };
    // Implementation note:
    // GitHubSlugger is stateful to be able to create unique names if the same
    // anchor/headline/term occurs twice on a *single page*. But slugify function
    // provided to vuepress will be invoked for different pages of a project.
    // They would appear to GitHubSlugger as being a single page / namespace if
    // we didn't create a new GitHubSlugger with every call, here. Rather than
    // creating a new instance we could also close over a single instance and
    // call 'slugger.reset()'. But, we decided to create an instance in the
    // function body which can be garbage collected immediately after the call.
}
