import path from 'node:path';
import assert from 'node:assert';
import { createGen2Renderer } from '@aws-amplify/amplify-gen2-codegen';

void describe('Codegen e2e tests', () => {
  void describe('render pipeline', () => {
    void it('renders a project with no parameters', async () => {
      const pipeline = createGen2Renderer({
        outputDir: path.join(process.env.INIT_CWD ?? './', 'output'),
        auth: {
          loginOptions: {
            email: true,
          },
        },
      });
      await assert.doesNotReject(pipeline.render);
    });
  });
});
