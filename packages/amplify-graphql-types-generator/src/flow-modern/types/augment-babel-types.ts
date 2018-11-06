/**
 * Augment incomplete definitions in `@types/babel-types`
 */
import 'babel-types';

declare module 'babel-types' {
  interface StringLiteralTypeAnnotation {
    value: string
  }

  interface ObjectTypeAnnotation {
    exact: boolean
  }
}
