import { Plan } from '../../plan';

export class GeneratePlan extends Plan {
  private readonly _deleted: string[] = [];
  private readonly _updated: string[] = [];
  private readonly _created: string[] = [];

  public delete(file: string) {
    this._deleted.push(file);
  }

  public create(file: string) {
    this._created.push(file);
  }

  public update(file: string) {
    this._updated.push(file);
  }

  protected describe() {
    throw new Error('Method not implemented.');
  }
}
