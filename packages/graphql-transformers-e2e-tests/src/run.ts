import { setupUserPool } from './setupUserPool';
setupUserPool('us-west-2_9ZddNgNah', '27t3je7vkn9oli2unkq7lf2g4t')
    .then(tokens => console.log(tokens));