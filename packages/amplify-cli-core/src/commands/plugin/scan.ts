import Context from '../../domain/context';
import * as pluginManager from '../../plugin-manager';

export default function scan(context: Context) {
    pluginManager.scan();
}