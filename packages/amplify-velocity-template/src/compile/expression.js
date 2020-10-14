const _ = require('lodash');
module.exports = function(Velocity, utils) {
  /**
   * expression运算
   */
  utils.mixin(Velocity.prototype, {
    /**
     * 表达式求值，表达式主要是数学表达式，逻辑运算和比较运算，到最底层数据结构，
     * 基本数据类型，使用 getLiteral求值，getLiteral遇到是引用的时候，使用
     * getReferences求值
     */
    compareEqualExpressions: function(exp0, exp1) {
      const val0 = this.getExpression(exp0);
      const val1 = this.getExpression(exp1);
      const val0Json = val0 && val0.toJSON ? val0.toJSON() : val0;
      const val1Json = val1 && val1.toJSON ? val1.toJSON() : val1;
      return _.isEqual(val0Json, val1Json);
    },

    getExpression: function(ast) {
      var exp = ast.expression;
      var ret;
      if (ast.type === 'math') {
        switch (ast.operator) {
          case '+':
            ret = this.getExpression(exp[0]) + this.getExpression(exp[1]);
            break;

          case '-':
            ret = this.getExpression(exp[0]) - this.getExpression(exp[1]);
            break;

          case '/':
            ret = this.getExpression(exp[0]) / this.getExpression(exp[1]);
            break;

          case '%':
            ret = this.getExpression(exp[0]) % this.getExpression(exp[1]);
            break;

          case '*':
            ret = this.getExpression(exp[0]) * this.getExpression(exp[1]);
            break;

          case '||':
            ret = this.getExpression(exp[0]) || this.getExpression(exp[1]);
            break;

          case '&&':
            ret = this.getExpression(exp[0]) && this.getExpression(exp[1]);
            break;

          case '>':
            ret = this.getExpression(exp[0]) > this.getExpression(exp[1]);
            break;

          case '<':
            ret = this.getExpression(exp[0]) < this.getExpression(exp[1]);
            break;

          case '==':
            ret = this.compareEqualExpressions(exp[0], exp[1]);
            break;

          case '>=':
            ret = this.getExpression(exp[0]) >= this.getExpression(exp[1]);
            break;

          case '<=':
            ret = this.getExpression(exp[0]) <= this.getExpression(exp[1]);
            break;

          case '!=':
            ret = !this.compareEqualExpressions(exp[0], exp[1]);
            break;

          case 'minus':
            ret = -this.getExpression(exp[0]);
            break;

          case 'not':
            ret = !this.getExpression(exp[0]);
            break;

          case 'parenthesis':
            ret = this.getExpression(exp[0]);
            break;

          default:
            return;
          // code
        }

        return ret;
      } else {
        return this.getLiteral(ast);
      }
    },
  });
};
