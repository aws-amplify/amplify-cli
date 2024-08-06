import { RenderPipeline, Renderer } from './render_pipeline';
import assert from 'node:assert';

describe('render pipeline', () => {
  describe('render errors', () => {
    it('returns an error if any renderer in the pipeline returns an error', async () => {
      const message = 'my custom error';
      const error = new Error(message);
      const errorRenderer: Renderer = {
        render: async () => Promise.reject(error),
      };
      const renderers = [errorRenderer];
      const pipeline = new RenderPipeline(renderers);
      await assert.rejects(pipeline.render, { message });
    });
    it('the entire pipeline fails as soon as a renderer fails', async () => {
      const message = 'render error';
      const error = new Error(message);
      const mock = jest.fn();
      const successfulRenderer: Renderer = {
        render: mock,
      };
      const errorRenderer: Renderer = {
        render: async () => Promise.reject(error),
      };
      const renderers = [errorRenderer, successfulRenderer];
      const pipeline = new RenderPipeline(renderers);
      await assert.rejects(pipeline.render, { message });
      assert.equal(mock.mock.calls.length, 0);
    });
    it('the render pipeline handles errors uncaught by constituent renderers', async () => {
      const message = 'render error';
      const error = new Error(message);
      const errorRenderer: Renderer = {
        render: async () => Promise.reject(error),
      };
      const renderers = [errorRenderer];
      const pipeline = new RenderPipeline(renderers);
      await assert.rejects(pipeline.render, { message });
    });
  });
  describe('successful render', () => {
    it('calls each renderer exactly once in the pipeline', async () => {
      const createSuccessfulRenderer = () => ({
        render: async () => Promise.resolve({}),
      });

      const renderers = new Array(10).fill(null).map(createSuccessfulRenderer);
      const spies = renderers.map((renderer) => {
        return jest.spyOn(renderer, 'render');
      });

      const pipeline = new RenderPipeline(renderers);
      await assert.doesNotReject(pipeline.render);
      for (const spy of spies) {
        assert.equal(spy.mock.calls.length, 1);
      }
    });
  });
});
