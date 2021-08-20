'use strict';
var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        Object.defineProperty(o, k2, {
          enumerable: true,
          get: function () {
            return m[k];
          },
        });
      }
    : function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        o[k2] = m[k];
      });
var __setModuleDefault =
  (this && this.__setModuleDefault) ||
  (Object.create
    ? function (o, v) {
        Object.defineProperty(o, 'default', { enumerable: true, value: v });
      }
    : function (o, v) {
        o['default'] = v;
      });
var __importStar =
  (this && this.__importStar) ||
  function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null)
      for (var k in mod) if (k !== 'default' && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
  };
Object.defineProperty(exports, '__esModule', { value: true });
exports.run = exports.name = void 0;
exports.name = 'auth';
const run = async context => {
  if (process.platform === 'win32') {
    try {
      const { run } = await Promise.resolve().then(() => __importStar(require(`./${exports.name}/${context.parameters.first}`)));
      return run(context);
    } catch (e) {
      context.print.error('Command not found');
    }
  }
  const header = `amplify ${exports.name} <subcommands>`;
  const commands = [
    {
      name: 'add',
      description: `Takes you through a CLI flow to add an ${exports.name} resource to your local backend`,
    },
    {
      name: 'import',
      description: `Takes you through a CLI flow to import an existing ${exports.name} resource to your local backend`,
    },
    {
      name: 'push',
      description: `Provisions only ${exports.name} cloud resources with the latest local developments`,
    },
    {
      name: 'remove',
      description: `Removes the ${exports.name} resource from your local backend which would be removed from the cloud on the next push command`,
    },
    {
      name: 'update',
      description: `Updates the ${exports.name} resource from your local backend.`,
    },
    {
      name: 'console',
      description: `Opens the web console for the ${exports.name} category`,
    },
  ];
  context.amplify.showHelp(header, commands);
  context.print.info('');
};
exports.run = run;
//# sourceMappingURL=auth.js.map
