export interface Result<T> {
  ok?: T;
  error?: any;
}

export interface Renderer {
  render(): Promise<Result<void>>;
}
export class RenderPipeline implements Renderer {
  constructor(private renderers: Renderer[]) {}

  private async *rendererIterator() {
    for (const renderer of this.renderers) {
      yield renderer.render();
    }
  }
  render = async (): Promise<Result<void>> => {
    const iterator = this.rendererIterator();
    try {
      for await (const { error } of iterator) {
        if (error) {
          return { error };
        }
      }
    } catch (e) {
      return { error: e };
    }
    return {};
  };
}
