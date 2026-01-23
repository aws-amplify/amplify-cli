#!/bin/bash
set -euxo pipefail
cp -f getRandomEmoji.js ./amplify/backend/function/MoodBoardFinalGetRandomEmoji/src/index.js
cp -f kinesisReader.js ./amplify/backend/function/moodboardfinalkinesisreader/src/index.js
