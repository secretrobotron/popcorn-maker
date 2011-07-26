
POPMKR := popcorn-maker 
SRC_DIR := .
DIST_DIR := $(SRC_DIR)/dist
POPMKR_DIST := $(DIST_DIR)/$(POPMKR).js
JS_DIR := $(SRC_DIR)/js
LAYOUTS_DIR := $(SRC_DIR)/layouts
CSS_DIR := $(SRC_DIR)/css
EXTERNAL_DIR := $(SRC_DIR)/external
LIB_DIR := $(SRC_DIR)/lib

HTML_SRCS := \
  $(SRC_DIR)/index.html

JS_LIBS := \
  $(EXTERNAL_DIR)/butter/dist/butter.js \
  $(EXTERNAL_DIR)/butter/dist/butter.min.js \
  $(EXTERNAL_DIR)/butter/dist/lib/jquery.js \
  $(EXTERNAL_DIR)/butter/dist/lib/jquery-ui.min.js \
  $(EXTERNAL_DIR)/butter/dist/lib/popcorn-complete.js \
  $(EXTERNAL_DIR)/butter/dist/lib/trackLiner.js

CSS_LIBS := \
  $(EXTERNAL_DIR)/butter/dist/css/jquery-ui-1.8.5.custom.css \
  $(EXTERNAL_DIR)/butter/dist/css/trackLiner.css

$(POPMKR_DIST): $(DIST_DIR)
	@@echo "Creating popcorn-maker"
	@@cp -r $(JS_DIR) $(DIST_DIR)/js
	@@cp -r $(LAYOUTS_DIR) $(DIST_DIR)
	@@cp -r $(CSS_DIR) $(DIST_DIR)
	@@cp -r $(LIB_DIR) $(DIST_DIR)
	@@cp $(HTML_SRCS) $(DIST_DIR)
	@@echo "Finished, see $(DIST_DIR)"

libs:
	@@cp $(JS_LIBS) $(LIB_DIR)
	@@cp $(CSS_LIBS) $(LIB_DIR)

all: $(DIST_DIR) libs $(POPMKR_DIST)
	@@echo "Finished, see $(DIST_DIR)"

$(DIST_DIR):
	@@echo "Creating $(DIST_DIR)"
	@@mkdir $(DIST_DIR)

clean:
	@@rm -fr $(DIST_DIR)

submodules:
	@@git submodule init
	@@git submodule update
