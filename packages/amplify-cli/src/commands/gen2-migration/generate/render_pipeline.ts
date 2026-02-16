export interface Renderer {
  render(): Promise<void>;
}
export class RenderPipeline implements Renderer {
  constructor(private renderers: Renderer[]) {}

  render = async (): Promise<void> => {
    for (const renderer of this.renderers) {
      await renderer.render();
    }
  };
}
