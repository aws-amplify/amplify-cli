import { Printer, printer as defaultPrinter } from './printer';

/**
 * Provides methods for writing formmatted multi-line output to a printer
 */
class AmplifyPrintFormater implements Formatter {
  constructor(private readonly printer: Printer = defaultPrinter) {}
  list = (items: string[]) => items.forEach(item => this.printer.info(`- ${item}`));
}

export const formatter: Formatter = new AmplifyPrintFormater();

export type Formatter = {
  list: (items: string[]) => void;
};
