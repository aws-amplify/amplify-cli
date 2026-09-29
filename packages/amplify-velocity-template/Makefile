version = `cat package.json | grep version | awk -F'"' '{print $$4}'`
SRC = $(wildcard src/*.js src/**/*.js)
TESTS = $(wildcard tests/*.js)
BIN := ./node_modules/.bin
REPORTER ?= spec

parse:
	cd src/parse && \
		node ../../$(BIN)/jison velocity.yy velocity.l \
		&& mv velocity.js index.js

cov: $(SRC) $(TESTS)
	@node $(BIN)/istanbul cover \
		-x src/parse/index.js \
	  $(BIN)/_mocha -- \
	    --reporter mocha-lcov-reporter \
			--require should \
	    --timeout 5s \
			$(TESTS) \
			&& cat ./coverage/lcov.info | \
			$(BIN)/coveralls --verbose
