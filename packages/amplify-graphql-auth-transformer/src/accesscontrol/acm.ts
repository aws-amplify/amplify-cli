import assert from 'assert';
import { InvalidDirectiveError, TransformerContractError } from '@aws-amplify/graphql-transformer-core';
import { ModelOperation } from '../utils/definitions';

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
    this.matrix = [];
    this.roles = [];
  }

  /**
   * set role to acm
   */
  public setRole(input: SetRoleInput): void {
    const {
      role, resource, operations, allowRoleOverwrite = false,
    } = input;
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

  /**
   * check if acm has role
   */
  public hasRole(role: string): boolean {
    return this.roles.includes(role);
  }

  /**
   * returns acm name
   */
  public getName(): string {
    return this.name;
  }

  /**
   * returns acm roles
   */
  public getRoles(): Array<string> {
    return this.roles;
  }

  /**
   * returns acm resources
   */
  public getResources(): Readonly<Array<string>> {
    return this.resources;
  }

  /**
   * check if acm has resource
   */
  public hasResource(resource: string): boolean {
    return this.resources.includes(resource);
  }

  /**
   * checks if role is allowed on resource for operation
   */
  public isAllowed(role: string, resource: string, operation: ModelOperation): boolean {
    this.validate({ role, resource, operations: [operation] });
    const roleIndex = this.roles.indexOf(role);
    const resourceIndex = this.resources.indexOf(resource);
    const operationIndex = this.operations.indexOf(operation);
    return this.matrix[roleIndex][resourceIndex][operationIndex];
  }

  /**
   * resets access for resource
   */
  public resetAccessForResource(resource: string): void {
    this.validate({ resource });
    const resourceIndex = this.resources.indexOf(resource);
    this.roles.forEach((_, i) => {
      this.matrix[i][resourceIndex] = new Array(this.operations.length).fill(false);
    });
  }

  /**
   * Given an operation returns the roles which have access to at least one resource
   * If fullAccess is true then it returns roles which have operation access on all resources
   * @param operation string
   * @param fullAccess boolean
   * @returns array of roles
   */
  public getRolesPerOperation(operation: ModelOperation, fullAccess = false): Array<string> {
    this.validate({ operations: [operation] });
    const operationIndex = this.operations.indexOf(operation);
    const roles = new Array<string>();
    this.roles.forEach((_, x) => {
      let hasOperation = false;
      if (fullAccess) {
        // eslint-disable-next-line @typescript-eslint/no-shadow
        hasOperation = this.resources.every((_, idx) => this.matrix[x][idx][operationIndex]);
      } else {
        // eslint-disable-next-line @typescript-eslint/no-shadow
        hasOperation = this.resources.some((_, idx) => this.matrix[x][idx][operationIndex]);
      }
      if (hasOperation) roles.push(this.roles[x]);
    });
    return roles;
  }

  /**
   * returns a map of role and their access
   * this object can then be used in console.table()
   */
  public getAcmPerRole(): Map<string, unknown> {
    const acmPerRole: Map<string, unknown> = new Map();
    this.matrix.forEach((_, i) => {
      const tableObj: any = {};
      this.matrix[i].forEach((_, y) => {
        tableObj[this.resources[y]] = this.matrix[i][y].reduce((prev: any, resource: boolean, index: number) => {
          // eslint-disable-next-line no-param-reassign
          prev[this.operations[index]] = resource;
          return prev;
        }, {});
      });
      acmPerRole.set(this.roles[i], tableObj);
    });
    return acmPerRole;
  }

  /**
   * helpers
   */
  private validate(input: ValidateInput): void {
    if (input.resource && !this.resources.includes(input.resource)) {
      throw new TransformerContractError(`Resource: ${input.resource} is not configured in the ACM`);
    }
    if (input.role && !this.roles.includes(input.role)) {
      throw new TransformerContractError(`Role: ${input.role} does not exist in ACM.`);
    }
    if (input.operations) {
      input.operations.forEach(operation => {
        if (this.operations.indexOf(operation) === -1) { throw new TransformerContractError(`Operation: ${operation} does not exist in the ACM.`); }
      });
    }
  }

  /**
   * if singular resource is specified the operations are only applied on the resource
   * a denied array for every other resource is returned in the matrix
   * @param input resource operation input
   * @returns a 2d matrix containing the access for each resource
   */
  private getResourceOperationMatrix(input: ResourceOperationInput): Array<Array<boolean>> {
    const { operations, resource, role } = input;
    let fieldAllowVector: boolean[][] = [];
    const operationList: boolean[] = this.getOperationList(operations);
    if (role && resource) {
      const roleIndex = this.roles.indexOf(role);
      const resourceIndex = this.resources.indexOf(resource);
      fieldAllowVector = this.matrix[roleIndex];
      fieldAllowVector[resourceIndex] = operationList;
      return fieldAllowVector;
    }

    this.resources.forEach((_, i) => {
      if (resource) {
        if (this.resources.indexOf(resource) === i) {
          fieldAllowVector.push(operationList);
        } else {
          fieldAllowVector.push(new Array(this.operations.length).fill(false));
        }
      } else {
        fieldAllowVector.push(operationList);
      }
    });
    return fieldAllowVector;
  }

  private getOperationList(operations: Array<string>): Array<boolean> {
    const operationList: Array<boolean> = [];
    this.operations.forEach(operation => {
      operationList.push(operations.includes(operation));
    });
    return operationList;
  }
}
