/**
 * @matadoor/engine – điểm vào duy nhất (SRS mục 8: app chỉ import qua index.ts).
 */

export * from './types';
export { compile, evaluate, ExprError } from './expr';
export type { CompiledExpr, ExprNode, Scope, ExprErrorCode } from './expr';
export { roundHalfAway, roundMm, roundMoney, ceilEps, ceilTo, CEIL_EPS } from './round';
export * from './format';
export { computeDoor, validateInput, interpolate, glassKey, GLASS_KG_PER_M2_MM, RESERVED_VARS } from './compute';
export { validateTemplate } from './validate';
export type { TemplateIssue } from './validate';
export * from './cut';
export * from './project';
export * from './quote';
