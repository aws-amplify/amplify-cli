#!/bin/bash

for filename in $(ls pkg-cache/v3.4); do mv pkg-cache/v3.4/$filename pkg-cache/v3.4/${filename/node/fetched}; done