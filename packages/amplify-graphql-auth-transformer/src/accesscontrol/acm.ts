import assert from 'assert';
import { InvalidDirectiveError, TransformerContractError } from '@aws-amplify/graphql-transformer-core';
import { ModelOperation } from '../utils';

type ACMConfig = {
  resources: string[];
  operations: ModelOperation[];
  name: string;
};

type SetRoleInput = {
  role: string;
  operations: Array<ModelOperation>;
  resource?: string;
  allowRoleOverwrite?: boolean;
};

type ValidateInput = {
  role?: string;
  resource?: string;
  operations?: Array<ModelOperation>;
};

type ResourceOperationInput = {
  operations: Array<ModelOperation>;
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
  private name: string;
  private roles: Array<string>;
  private operations: Array<ModelOperation>;
  private resources: Array<string>;
  private matrix: Array<Array<Array<boolean>>>;

  constructor(config: ACMConfig) {
    this.name = config.name;
    this.operations = config.operations;
    this.resources = config.resources;
    this.matrix = new Array();
    this.roles = new Array();
  }

  public setRole(input: SetRoleInput): void {
    const { role, resource, operations, allowRoleOverwrite = false } = input;
    this.validate({ resource, operations });
    let allowedVector: Array<Array<boolean>>;
    if (!this.roles.includes(role)) {
      allowedVector = this.getResourceOperationMatrix({ operations, resource });
      this.roles.push(input.role);
      this.matrix.push(allowedVector);
      assert(this.roles.length === this.matrix.length, 'Roles are not aligned with Roles added in Matrix');
    } else if (this.roles.includes(role) && (resource || allowRoleOverwrite)) {
      allowedVector = this.getResourceOperationMatrix({ operations, resource, role });
      const roleIndex = this.roles.indexOf(role);
      this.matrix[roleIndex] = allowedVector;
    } else {
      throw new InvalidDirectiveError(`@auth ${role} already exists for ${this.name}`);
    }
  }

  public hasRole(role: string): boolean {
    return this.roles.includes(role);
  }

  public getName(): string {
    return this.name;
  }

  public getRoles(): Array<string> {
    return this.roles;
  }

  public getResources(): Readonly<Array<string>> {
    return this.resources;
  }

  public hasResource(resource: string): boolean {
    return this.resources.includes(resource);
  }

  public isAllowed(role: string, resource: string, operation: ModelOperation): boolean {
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
   * Given an operation returns the roles which have access to at least one resource
   * If fullAccess is true then it returns roles which have operation access on all resources
   * @param operation string
   * @param fullAccess boolean
   * @returns array of roles
   */
  public getRolesPerOperation(operation: ModelOperation, fullAccess: boolean = false): Array<string> {
    this.validate({ operations: [operation] });
    const operationIndex = this.operations.indexOf(operation);
    const roles = new Array<string>();
    for (let x = 0; x < this.roles.length; x++) {
      let hasOperation: boolean = false;
      if (fullAccess) {
        hasOperation = this.resources.every((resource, idx) => {
          return this.matrix[x][idx][operationIndex];
        });
      } else {
        hasOperation = this.resources.some((resource, idx) => {
          return this.matrix[x][idx][operationIndex];
        });
      }
      if (hasOperation) roles.push(this.roles[x]);
    }
    return roles;
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
      throw new TransformerContractError(`Resource: ${input.resource} is not configured in the ACM`);
    }
    if (input.role && !this.roles.includes(input.role)) {
      throw new TransformerContractError(`Role: ${input.role} does not exist in ACM.`);
    }
    if (input.operations) {
      input.operations.forEach(operation => {
        if (this.operations.indexOf(operation) === -1)
          throw new TransformerContractError(`Operation: ${operation} does not exist in the ACM.`);
      });
    }
  }

  /**
   *
   * if singular resource is specified the operations are only applied on the resource
   * a denied array for every other resource is returned in the matrix
   * @param operations
   * @param resource
   * @returns a 2d matrix containing the access for each resource
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
          fieldAllowVector.push(new Array(this.operations.length).fill(false));
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
