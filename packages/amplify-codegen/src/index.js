const path = require('path')
const glob = require('glob-all')
const appSyncCodeGen = require('aws-appsync-codegen')
const jetpack = require('fs-jetpack')
const Ora = require('ora')
const generateOps = require('amplify-graphql-ops-generator').default

const loadConfig = require('./codegen-config')
const addWalkThrough = require('./walkthrough/add')
const configureProjectWalkThrough = require('./walkthrough/configure')
const constants = require('./constants')
const { downloadIntrospectionSchema, getFrontEndHandler, getAppSyncAPIDetails } = require('./utils')

async function generate(context, forceDownloadSchema) {
  const config = loadConfig(context)
  const availableAppSyncApis = getAppSyncAPIDetails(context)
  const availableApiIds = availableAppSyncApis.map(api => api.id)
  const configuredProjects = config.getProjects()
  const projects = configuredProjects.filter(proj =>
    availableApiIds.includes(proj.amplifyExtension.graphQLApiId))

  if (!projects.length) {
    context.print.info(constants.ERROR_CODEGEN_NO_API_CONFIGURED)
  }
  const frontend = getFrontEndHandler(context)
  projects.forEach(async (cfg) => {
    const excludes = cfg.excludes.map(pattern => `!${pattern}`)
    const includeFiles = cfg.includes
    const queries = glob.sync([...includeFiles, ...excludes])
    const schema = path.resolve(cfg.schema)
    const output = cfg.amplifyExtension.generatedFileName
    const target = cfg.amplifyExtension.codeGenTarget
    if (forceDownloadSchema || jetpack.exists(schema) !== 'file') {
      const downloadSpinner = new Ora(constants.INFO_MESSAGE_DOWNLOADING_SCHEMA)
      downloadSpinner.start()
      await downloadIntrospectionSchema(context, cfg.amplifyExtension.graphQLApiId, cfg.schema)
      downloadSpinner.succeed(constants.INFO_MESSAGE_DOWNLOAD_SUCCESS)
    }
    if (frontend !== 'android') {
      const codeGenSpinner = new Ora(constants.INFO_MESSAGE_CODEGEN_GENERATE_STARTED)
      codeGenSpinner.start()
      const outputFolder = path.dirname(output)
      jetpack.dir(outputFolder)
      appSyncCodeGen.generate(queries, schema, output, '', target, 'gql', '', { addTypename: true })
      codeGenSpinner.succeed(`${constants.INFO_MESSAGE_CODEGEN_GENERATE_SUCCESS} ${output}`)
    }
  })
}

async function add(context) {
  const config = loadConfig(context)
  const answer = await addWalkThrough(context, config.getProjects())

  const { api } = answer
  const spinner = new Ora(constants.INFO_MESSAGE_DOWNLOADING_SCHEMA)
  spinner.start()
  const schema = await downloadIntrospectionSchema(context, api.id, answer.schemaLocation)
  spinner.succeed(constants.INFO_MESSAGE_DOWNLOAD_SUCCESS)
  const newProject = {
    projectName: answer.api.name,
    includes: answer.includePattern,
    excludes: answer.excludePattern,
    schema,
    amplifyExtension: {
      graphQLApiId: answer.api.id,
      codeGenTarget: answer.target,
      generatedFileName: answer.generatedFileName,
    },
    endPoint: answer.api.endPoint,
  }
  config.addProject(newProject)
  if (answer.shouldGenerateOps) {
    const opsGenSpinner = new Ora(constants.INFO_MESSAGE_OPS_GEN)
    opsGenSpinner.start()
    const opsGenDirectory = path.resolve(answer.opsFilePath)
    jetpack.dir(opsGenDirectory);
    generateOps(schema, opsGenDirectory, { separateFiles: true })
    opsGenSpinner.succeed(constants.INFO_MESSAGE_OPS_GEN_SUCCESS + path.relative(path.resolve('.'), opsGenDirectory))
  }
  if (answer.shouldGenerateCode) {
    generate(context)
  }
  config.save()
}

async function configure(context) {
  const config = loadConfig(context)
  if (!config.getProjects().length) {
    await add(context)
    return
  }
  const project = await configureProjectWalkThrough(context, config.getProjects())
  config.addProject(project)
  config.save()
}

module.exports = {
  configure,
  generate,
  add,
}
