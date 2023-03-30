#!/bin/bash

for filename in $(ls pkg-fetch/v3.4); do mv pkg-fetch/v3.4/$filename pkg-fetch/v3.4/${filename/node/fetched}; done