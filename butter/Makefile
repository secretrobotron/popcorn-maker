#############################################################################################
# NOTES:
#
# This Makefile assumes that you have the following installed, setup:
#
#  * node: http://nodejs.org
#  * Unixy shell (use msys on Windows)
#
#############################################################################################

BUTTER := butter 
SRC_DIR := ./src
TEST_DIR := ./test
DIST_DIR := ./dist
EXTERNAL_DIR := ./external
BUTTER_SRC := $(SRC_DIR)/$(BUTTER).js
PREVIEWER_SRC := $(SRC_DIR)/previewer/$(BUTTER).previewer.js
BUTTER_DIST := $(DIST_DIR)/$(BUTTER).js
BUTTER_MIN := $(DIST_DIR)/$(BUTTER).min.js
TOOLS_DIR := ./tools
DIST_TEST_DIR := $(DIST_DIR)/test
DIST_TOOLS_DIR := $(DIST_DIR)/tools

CORE_FILES := \
  $(SRC_DIR)/butter.js \
  $(wildcard $(SRC_DIR)/core/*.js) \
  $(wildcard $(SRC_DIR)/eventeditor/*.js) \
  $(wildcard $(SRC_DIR)/pluginmanager/*.js) \
  $(wildcard $(SRC_DIR)/trackeditor/*.js) \
  $(wildcard $(SRC_DIR)/timeline/*.js) \
  $(wildcard $(SRC_DIR)/previewer/*.js) \
  $(wildcard $(SRC_DIR)/comm/*.js)

PREVIEWER_FILES := \
  $(wildcard $(SRC_DIR)/previewer/*.js)

compile = node $(TOOLS_DIR)/node_modules/uglify-js/bin/uglifyjs -o $(1) $(BUTTER_DIST)

complete = cat $(BUTTER_MIN) > $(1)

jshint = echo "Linting $(1)" ; node $(TOOLS_DIR)/jshint-cmdline.js $(1)

all: $(DIST_DIR) $(BUTTER_DIST) $(BUTTER_MIN) $(PREVIEWER_DIST) $(PREVIEWER_MIN)
	@@echo "Finished, see $(DIST_DIR)"

$(DIST_DIR):
	@@echo "Creating $(DIST_DIR)"
	@@mkdir $(DIST_DIR)

$(PREVIEWER_DIST): $(DIST_DIR) $(PREVIEWER_SRC)
	@@echo "Building $(PREVIEWER_DIST)"
	@@$(TOOLS_DIR)/node r.js -o $(SRC_DIR)/build.js

$(PREVIEWER_MIN): $(DIST_DIR) $(PREVIEWER_SRC)
	@@echo "Building $(PREVIEWER_MIN)"
	@@$(call compile,$(PREVIEWER_MIN))

$(BUTTER_DIST): $(DIST_DIR) $(BUTTER_SRC)
	@@echo "Building $(BUTTER_DIST)"
	@@cd $(TOOLS_DIR) && node r.js -o build.js

$(BUTTER_MIN): $(DIST_DIR) $(BUTTER_SRC)
	@@echo "Building $(BUTTER_MIN)"
	@@$(call compile,$(BUTTER_MIN))

test: $(DIST_DIR) $(BUTTER_MIN)
	@@echo "Creating tests in $(DIST_TEST_DIR)"
	@@mv $(BUTTER_MIN) $(BUTTER_DIST)
	@@cp -R $(TEST_DIR) $(DIST_DIR)
	@@mv $(DIST_TEST_DIR)/index.html.dist $(DIST_TEST_DIR)/index.html
	@@mkdir -p $(DIST_TOOLS_DIR)/qunit
	@@cp -R $(TOOLS_DIR)/qunit/qunit $(DIST_TOOLS_DIR)/qunit
	@@echo "Starting web server in $(DIST_DIR), browse to http://localhost:9914/ (ctrl+c to stop)..."
	@@cd $(DIST_DIR) && python ../$(TOOLS_DIR)/test_server.py

clean:
	@@rm -fr $(DIST_DIR)

check-lint: check-lint-core

check-lint-core:
	@@$(foreach corefile,$(CORE_FILES),echo "-----" ; $(call jshint,$(corefile)) ; )
