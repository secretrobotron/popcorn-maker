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
PREVIEWER := butter.previewer 
SRC_DIR := ./
DIST_DIR := ./dist
PREVIEWER_SRC := $(SRC_DIR)/$(PREVIEWER).js
PREVIEWER_DIST := $(DIST_DIR)/$(PREVIEWER).js
PREVIEWER_MIN := $(DIST_DIR)/$(PREVIEWER).min.js
TOOLS_DIR := ../../tools

CORE_FILES := \
  $(wildcard $(SRC_DIR)/previewer/*.js)

compile = node $(TOOLS_DIR)/node_modules/uglify-js/bin/uglifyjs -o $(1) $(PREVIEWER_DIST)

complete = cat $(PREVIEWER_MIN) > $(1)

jshint = echo "Linting $(1)" ; node $(TOOLS_DIR)/jshint-cmdline.js $(1)

all: $(DIST_DIR) $(PREVIEWER_DIST) $(PREVIEWER_MIN) $(PREVIEWER_DIST) $(PREVIEWER_MIN)
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

$(PREVIEWER_DIST): $(DIST_DIR) $(PREVIEWER_SRC)
	@@echo "Building $(PREVIEWER_DIST)"
	@@cd $(TOOLS_DIR) && node r.js -o build.js

$(PREVIEWER_MIN): $(DIST_DIR) $(PREVIEWER_SRC)
	@@echo "Building $(PREVIEWER_MIN)"
	@@$(call compile,$(PREVIEWER_MIN))

clean:
	@@rm -fr $(DIST_DIR)
