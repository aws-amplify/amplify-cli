/**
 * Runs a series of jobs through the templating system.
 *
 * @param {any}   context        - The Amplify CLI context
 * @param {any[]} jobs           - A list of jobs to run.
 * @param {any}   props          - The props to use for variable replacement.
 * @param {any}   opts           - Additional options
 */
async function copyBatch(context, jobs, props, opts = {}) {

    // grab some features
    const {
        template,
        prompt,
        filesystem,
        print
    } = context
    const {
        confirm
    } = prompt

    // If the file exists
    const shouldGenerate = async target => {
        if (!filesystem.exists(target)) return true
        return await confirm(`overwrite ${target}`)
    }
    let defaultPluginDir = __dirname + "/../../plugin-templates"
    for (let index = 0; index < jobs.length; index++) {
        // grab the current job
        const job = jobs[index]
        // safety check
        if (!job) continue
        // generate the React component
        if (await shouldGenerate(job.target)) {
            await template.generate({
                directory: job.dir,
                template: job.template,
                target: job.target,
                props
            })
        }
    }
}

module.exports = {
    copyBatch
}