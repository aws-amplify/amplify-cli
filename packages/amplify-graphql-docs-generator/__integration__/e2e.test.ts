import { resolve } from 'path'
import * as fs from 'fs'
import generate from '../src'

describe('end 2 end tests', () => {
  const outputpath = resolve(__dirname, './output.graphql')

  describe('JSON introspection schema', () => {
    const schemaPath = resolve(__dirname, '../fixtures/schema.json')
    afterEach(() => {
      // delete the generated file
      try {
        fs.unlinkSync(outputpath)
      } catch (e) {
        // CircleCI throws exception, no harm done if the file is not deleted
      }
    })

    it('should generate statements', () => {
      generate(schemaPath, outputpath, {
        separateFiles: false,
        maxDepth: 3,
        language: 'graphql',
        renderMultiAuthDirectives: true,
      })
      const generatedOutput = fs.readFileSync(outputpath, 'utf8')
      expect(generatedOutput).toMatchSnapshot()
    })

    it('should generate statements in JS', () => {
      generate(schemaPath, outputpath, {
        separateFiles: false,
        maxDepth: 3,
        language: 'javascript',
        renderMultiAuthDirectives: true,
      })
      const generatedOutput = fs.readFileSync(outputpath, 'utf8')
      expect(generatedOutput).toMatchSnapshot()
    })

    it('should generate statements in Typescript', () => {
      generate(schemaPath, outputpath, {
        separateFiles: false,
        maxDepth: 3,
        language: 'typescript',
        renderMultiAuthDirectives: true,
      })
      const generatedOutput = fs.readFileSync(outputpath, 'utf8')
      expect(generatedOutput).toMatchSnapshot()
    })

    it('should generate statements in flow', () => {
      generate(schemaPath, outputpath, {
        separateFiles: false,
        maxDepth: 3,
        language: 'flow',
        renderMultiAuthDirectives: true,
      })
      const generatedOutput = fs.readFileSync(outputpath, 'utf8')
      expect(generatedOutput).toMatchSnapshot()
    })
  })

  describe('SDL schema', () => {
    const schemaPath = resolve(__dirname, '../fixtures/schema.graphql')
    afterEach(() => {
      // delete the generated file
      try {
        fs.unlinkSync(outputpath)
      } catch (e) {
        // CircleCI throws exception, no harm done if the file is not deleted
      }
    })

    it('should generate statements', () => {
      generate(schemaPath, outputpath, {
        separateFiles: false,
        maxDepth: 3,
        language: 'graphql',
        renderMultiAuthDirectives: true,
      })
      const generatedOutput = fs.readFileSync(outputpath, 'utf8')
      expect(generatedOutput).toMatchSnapshot()
    })

    it('should generate statements in JS', () => {
      generate(schemaPath, outputpath, {
        separateFiles: false,
        maxDepth: 3,
        language: 'javascript',
        renderMultiAuthDirectives: true,
      })
      const generatedOutput = fs.readFileSync(outputpath, 'utf8')
      expect(generatedOutput).toMatchSnapshot()
    })

    it('should generate statements in Typescript', () => {
      generate(schemaPath, outputpath, {
        separateFiles: false,
        maxDepth: 3,
        language: 'typescript',
        renderMultiAuthDirectives: true,
      })
      const generatedOutput = fs.readFileSync(outputpath, 'utf8')
      expect(generatedOutput).toMatchSnapshot()
    })

    it('should generate statements in flow', () => {
      generate(schemaPath, outputpath, {
        separateFiles: false,
        maxDepth: 3,
        language: 'flow',
        renderMultiAuthDirectives: true,
      })
      const generatedOutput = fs.readFileSync(outputpath, 'utf8')
      expect(generatedOutput).toMatchSnapshot()
    })
  })
})
