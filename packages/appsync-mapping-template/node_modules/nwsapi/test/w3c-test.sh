#!/bin/sh

path=`dirname $0`

# start an instance the php7 internal httpd server
# needed to execute the w3c tests in a browser

php -S localhost:8000 -t ${path}/w3c/ &

