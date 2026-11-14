/**
 * The calculator's own Indonesian wording, so the article and the calculator
 * use the same names for the same things.
 */
import {createTranslator, dictionary} from './id.generated';

const translate = createTranslator(dictionary) as (text: string) => string;

/**
 * English text from the calculator in, Indonesian out. Numbers inside the
 * text are re-formatted (1,133.5 becomes 1.133,5). Text the dictionary does
 * not know comes back in English.
 */
export function tr(text: string): string {
  return translate(text);
}

/**
 * The calculator marks formulas in its notes for conversion to MathML. The
 * article shows notes as plain text, so the marks are dropped.
 */
export function plain(text: string): string {
  return text.replace(/~?“([^”]*)”/g, ' $1').replace(/[⟦⟧]/g, '');
}
