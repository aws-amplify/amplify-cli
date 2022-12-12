import { $TSContext } from "amplify-cli-core";
import { showAllHelp } from "../extensions/amplify-helpers/show-all-help";

/**
 * displays amplify help menu
 */
export const run = async (context: $TSContext): Promise<void> => {
  showAllHelp(context);
};
