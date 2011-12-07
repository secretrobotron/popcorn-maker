#############################################################################################
# NOTES:
#
# This Makefile assumes that you have the following installed, setup:
#
#  * node: http://nodejs.org
#  * Unixy shell (use msys on Windows)
#
#############################################################################################

SRC_DIR := ./
DIST_DIR := ./dist
BUILD_DIR := ./build
PREVIEWER_SRC := $(SRC_DIR)/butter.previewer.js
PREVIEWER_DIST := $(DIST_DIR)/butter.previewer.js
PREVIEWER_MIN := $(DIST_DIR)/butter.previewer.min.js
TOOLS_DIR := ../../tools

PREVIEWER_FILES := butter.previewer.js media.js previewer.js link.js custom-link.js basic-link.js

compile = node $(TOOLS_DIR)/node_modules/uglify-js/bin/uglifyjs -o $(1) $(PREVIEWER_DIST)

all: $(DIST_DIR) $(PREVIEWER_DIST) $(PREVIEWER_MIN)
	@@echo "Finished, see $(DIST_DIR)"

$(DIST_DIR):
	@@echo "Creating $(DIST_DIR)"
	@@mkdir $(DIST_DIR)

$(BUILD_DIR):
	@@echo "Creating $(BUILD_DIR)"
	@@mkdir $(BUILD_DIR)

$(PREVIEWER_DIST): $(BUILD_DIR) $(DIST_DIR) $(PREVIEWER_SRC)
	@@echo "Building $(PREVIEWER_DIST)"
	@@cp $(PREVIEWER_FILES) $(BUILD_DIR)
	@@node $(TOOLS_DIR)/r.js -o $(SRC_DIR)/build.js

$(PREVIEWER_MIN): $(DIST_DIR) $(PREVIEWER_SRC)
	@@echo "Building $(PREVIEWER_MIN)"
	@@$(call compile,$(PREVIEWER_MIN))

clean:
	@@rm -fr $(DIST_DIR)
