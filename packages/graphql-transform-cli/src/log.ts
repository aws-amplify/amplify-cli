import chalk from 'chalk'
const log = {
    debug(msg: string) {
        console.log(chalk.cyan(msg))
    },
    info(msg: string) {
        console.log(chalk.white(msg))
    },
    error(msg: string) {
        console.log(chalk.red(msg))
    }
}
export default log