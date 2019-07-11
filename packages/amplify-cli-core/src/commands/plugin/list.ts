import Context from '../../domain/context';
import util from 'util';

export default function add(context: Context) {
    console.log(util.inspect(context.pluginPlatform, { depth: 5}));
}