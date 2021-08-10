import assert from 'assert';

type ACMConfig = {
  resources: string[];
  operations: string[];
};

type SetRoleInput = {
  role: string;
  operations: Array<string>;
  resource?: string;
};

type ValidateInput = {
  role?: string;
  resource?: string;
  operations?: Array<string>;
};

type ResourceOperationInput = {
  operations: Array<string>;
  role?: string;
  resource?: string;
};

/**
 * Creates an access control matrix
 * The following vectors are used
 * - Roles
 * - Resources
 * - Operations
 */
export class AccessControlMatrix {
  private roles: Array<string>;
  private operations: Array<string>;
  private resources: Array<string>;
  private matrix: Array<Array<Array<boolean>>>;

  constructor(config: ACMConfig) {
    this.operations = config.operations;
    this.resources = config.resources;
    this.matrix = new Array();
    this.roles = new Array();
  }

  public setRole(input: SetRoleInput): void {
    const { role, resource, operations } = input;
    this.validate({ resource, operations });
    let allowedVector: Array<Array<boolean>>;
    if (!this.roles.includes(role)) {
      allowedVector = this.getResourceOperationMatrix({ operations, resource });
      this.roles.push(input.role);
      this.matrix.push(allowedVector);
      assert(this.roles.length === this.matrix.length, 'Roles are not aligned with Roles added in Matrix');
    } else {
      allowedVector = this.getResourceOperationMatrix({ operations, resource, role });
      const roleIndex = this.roles.indexOf(role);
      this.matrix[roleIndex] = allowedVector;
    }
  }

  public hasRole(role: string): boolean {
    return this.roles.includes(role);
  }

  public getResources(): Array<string> {
    return this.resources;
  }

  public isAllowed(role: string, resource: string, operation: string): boolean {
    this.validate({ role, resource, operations: [operation] });
    const roleIndex = this.roles.indexOf(role);
    const resourceIndex = this.resources.indexOf(resource);
    const operationIndex = this.operations.indexOf(operation);
    return this.matrix[roleIndex][resourceIndex][operationIndex];
  }

  public resetAccessForResource(resource: string): void {
    this.validate({ resource });
    const resourceIndex = this.resources.indexOf(resource);
    for (let i = 0; i < this.roles.length; i++) {
      this.matrix[i][resourceIndex] = new Array(this.operations.length).fill(false);
    }
  }

  /**
   * @returns a map of role and their access
   * this object can then be used in console.table()
   */
  public getAcmPerRole(): Map<string, Object> {
    const acmPerRole: Map<string, Object> = new Map();
    for (let i = 0; i < this.matrix.length; i++) {
      let tableObj: any = {};
      for (let y = 0; y < this.matrix[i].length; y++) {
        tableObj[this.resources[y]] = this.matrix[i][y].reduce((prev: any, resource: boolean, index: number) => {
          prev[this.operations[index]] = resource;
          return prev;
        }, {});
      }
      acmPerRole.set(this.roles[i], tableObj);
    }
    return acmPerRole;
  }

  /**
   * helpers
   */
  private validate(input: ValidateInput) {
    if (input.resource && !this.resources.includes(input.resource)) {
      throw Error(`Resource: ${input.resource} is not configued in the ACM`);
    }
    if (input.role && !this.roles.includes(input.role)) {
      throw Error(`Role: ${input.role} does not exist in ACM.`);
    }
    if (input.operations) {
      input.operations.forEach(operation => {
        if (this.operations.indexOf(operation) === -1) throw Error(`Operation: ${operation} does not exist in the ACM.`);
      });
    }
  }

  /**
   *
   * if singular resource is specified the operations are only applied on the resource
   * a denied array for every other resource is returned in the matrix
   * @param operations
   * @param resource
   * @returns a 2d matrix containg the access for each resource
   */
  private getResourceOperationMatrix(input: ResourceOperationInput): Array<Array<boolean>> {
    const { operations, resource, role } = input;
    let fieldAllowVector: boolean[][] = [];
    let operationList: boolean[] = this.getOperationList(operations);
    if (role && resource) {
      const roleIndex = this.roles.indexOf(role);
      const resourceIndex = this.resources.indexOf(resource);
      fieldAllowVector = this.matrix[roleIndex];
      fieldAllowVector[resourceIndex] = operationList;
      return fieldAllowVector;
    }
    for (let i = 0; i < this.resources.length; i++) {
      if (resource) {
        if (this.resources.indexOf(resource) === i) {
          fieldAllowVector.push(operationList);
        } else {
          fieldAllowVector.push(new Array(this.resources.length).fill(false));
        }
      } else {
        fieldAllowVector.push(operationList);
      }
    }
    return fieldAllowVector;
  }

  private getOperationList(operations: Array<string>): Array<boolean> {
    let operationList: Array<boolean> = new Array();
    for (let operation of this.operations) {
      operationList.push(operations.includes(operation));
    }
    return operationList;
  }
}
