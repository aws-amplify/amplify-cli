/* 
    entry code for amplify override root
*/

import { generateOverrideSkeleton } from '../../utils/override-skeleton-generator';


const subcommand = 'override';

module.exports = {
  name: subcommand,
  run: async context => {
    await generateOverrideSkeleton(context);
  },
};