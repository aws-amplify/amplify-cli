import add from './plugin/add';
import configure from './plugin/configure';
import init from './plugin/init';
import list from './plugin/list';
import remove from './plugin/remove';
import scan from './plugin/scan';
import verify from './plugin/verify';
import Context from '../domain/context';

export default async function plugin(context: Context) {
    const subcommand = (context.input.subCommands as string[])[0];
    switch (subcommand) {
        case 'add':
            await add(context);
            break;
        case 'configure':
            await configure(context);
            break;
        case 'init':
            await init(context);
            break;
        case 'list':
            await list(context);
            break;
        case 'remove':
            await remove(context);
            break;
        case 'scan':
            await scan(context);
            break;
        case 'verify':
            await verify(context);
            break;
    }
}