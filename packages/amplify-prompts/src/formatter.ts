import { Printer, printer as defaultPrinter } from './printer';

/**
 * Provides methods for writing formatted multi-line output to a printer
 */
class AmplifyPrintFormatter implements Formatter {
  constructor(private readonly printer: Printer = defaultPrinter) {}
  list = (items: string[]) => items.forEach((item) => this.printer.info(`- ${item}`));
}

export const formatter: Formatter = new AmplifyPrintFormatter();

export type Formatter = {
  list: (items: string[]) => void;
};
