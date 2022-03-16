'use strict';
module.exports = function (Velocity, utils) {
  /**
   * blocks语法处理
   */
  utils.mixin(Velocity.prototype, {
    /**
     * 处理代码库: if foreach macro
     */
    getBlock: function (block) {
      var ast = block[0];
      var ret = '';

      switch (ast.type) {
        case 'if':
          ret = this.getBlockIf(block);
          break;
        case 'foreach':
          ret = this.getBlockEach(block);
          break;
        case 'macro':
          this.setBlockMacro(block);
          break;
        case 'noescape':
          ret = this._render(block.slice(1));
          break;
        case 'define':
          this.setBlockDefine(block);
          break;
        case 'macro_body':
          ret = this.getMacroBody(block);
          break;
        default:
          ret = this._render(block);
      }

      return ret === undefined ? '' : ret;
    },

    /**
     * define
     */
    setBlockDefine: function (block) {
      var ast = block[0];
      var _block = block.slice(1);
      var defines = this.defines;

      defines[ast.id] = _block;
    },

    /**
     * define macro
     */
    setBlockMacro: function (block) {
      var ast = block[0];
      var _block = block.slice(1);
      var macros = this.macros;

      macros[ast.id] = {
        asts: _block,
        args: ast.args,
      };
    },

    getMacroBody: function (asts) {
      const ast = asts[0];
      var _block = asts.slice(1);
      var bodyContent = this.eval(_block, {});
      return this.getMacro(ast, bodyContent);
    },

    /**
     * parse macro call
     */
    getMacro: function (ast, bodyContent) {
      var macro = this.macros[ast.id];
      var ret = '';

      if (!macro) {
        var jsmacros = this.jsmacros;
        macro = jsmacros[ast.id];
        var jsArgs = [];

        if (macro && macro.apply) {
          utils.forEach(
            ast.args,
            function (a) {
              jsArgs.push(this.getLiteral(a));
            },
            this,
          );

          var self = this;

          // bug修复：此处由于闭包特性，导致eval函数执行时的this对象是上一次函数执行时的this对象，渲染时上下文发生错误。
          jsmacros.eval = function () {
            return self.eval.apply(self, arguments);
          };

          try {
            ret = macro.apply(jsmacros, jsArgs);
          } catch (e) {
            var pos = ast.pos;
            var text = Velocity.Helper.getRefText(ast);
            // throws error tree
            var err = '\n      at ' + text + ' L/N ' + pos.first_line + ':' + pos.first_column;
            e.name = '';
            e.message += err;
            throw new Error(e);
          }
        }
      } else {
        var asts = macro.asts;
        var args = macro.args;
        var callArgs = ast.args;
        var local = { bodyContent: bodyContent };
        var guid = utils.guid();
        var contextId = 'macro:' + ast.id + ':' + guid;

        utils.forEach(
          args,
          function (ref, i) {
            if (callArgs[i]) {
              local[ref.id] = this.getLiteral(callArgs[i]);
            } else {
              local[ref.id] = undefined;
            }
          },
          this,
        );

        ret = this.eval(asts, local, contextId);
      }

      return ret;
    },

    /**
     * eval
     * @param str {array|string} 需要解析的字符串
     * @param local {object} 局部变量
     * @param contextId {string}
     * @return {string}
     */
    eval: function (str, local, contextId) {
      if (!local) {
        if (utils.isArray(str)) {
          return this._render(str);
        } else {
          return this.evalStr(str);
        }
      } else {
        var asts = [];
        var parse = Velocity.parse;
        contextId = contextId || 'eval:' + utils.guid();

        if (utils.isArray(str)) {
          asts = str;
        } else if (parse) {
          asts = parse(str);
        }

        if (asts.length) {
          this.local[contextId] = local;
          var ret = this._render(asts, contextId);
          this.local[contextId] = {};
          this.conditions.shift();
          this.condition = this.conditions[0] || '';

          return ret;
        }
      }
    },

    /**
     * parse #foreach
     */
    getBlockEach: function (block) {
      var ast = block[0];
      var _from = this.getLiteral(ast.from);
      var _block = block.slice(1);
      var _to = ast.to;
      var local = {
        foreach: {
          count: 0,
        },
      };
      var ret = '';
      var guid = utils.guid();
      var contextId = 'foreach:' + guid;

      var type = {}.toString.call(_from);
      if (!_from || (type !== '[object Array]' && type !== '[object Object]')) {
        return '';
      }

      if (utils.isArray(_from)) {
        var len = _from.length;
        utils.forEach(
          _from,
          function (val, i) {
            if (this._state.break) {
              // reset break after breaking the loop
              this._state.break = false;
              return;
            }
            // 构造临时变量
            local[_to] = val;
            local.foreach = {
              count: i + 1,
              index: i,
              hasNext: () => i + 1 < len,
            };
            local.velocityCount = i + 1;

            this.local[contextId] = local;
            ret += this._render(_block, contextId);
          },
          this,
        );
      } else {
        var len = utils.keys(_from).length;
        utils.forEach(
          utils.keys(_from),
          function (key, i) {
            if (this._state.break) {
              // reset break after breaking the loop
              this._state.break = false;
              return;
            }
            local[_to] = _from[key];
            local.foreach = {
              count: i + 1,
              index: i,
              hasNext: () => i + 1 < len,
            };
            local.velocityCount = i + 1;
            this.local[contextId] = local;
            ret += this._render(_block, contextId);
          },
          this,
        );
      }

      // if foreach items be an empty array, then this code will shift current
      // conditions, but not this._render call, so this will shift parent context
      if (_from && _from.length) {
        this._state.break = false;
        // empty current local context object
        this.local[contextId] = {};
        this.conditions.shift();
        this.condition = this.conditions[0] || '';
      }

      return ret;
    },

    /**
     * parse #if
     */
    getBlockIf: function (block) {
      var received = false;
      var asts = [];

      utils.some(
        block,
        function (ast) {
          if (ast.condition) {
            if (received) {
              return true;
            }
            received = this.getExpression(ast.condition);
          } else if (ast.type === 'else') {
            if (received) {
              return true;
            }
            received = true;
          } else if (received) {
            asts.push(ast);
          }

          return false;
        },
        this,
      );

      // keep current condition fix #77
      return this._render(asts, this.condition);
    },
  });
};
