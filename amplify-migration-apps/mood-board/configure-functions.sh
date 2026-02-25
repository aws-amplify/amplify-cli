#!/bin/bash
set -euxo pipefail
cp -f getRandomEmoji.js ./amplify/backend/function/moodboardGetRandomEmoji/src/index.js
cp -f kinesisReader.js ./amplify/backend/function/moodboardKinesisReader/src/index.js
