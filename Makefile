
POPMKR := popcorn-maker 
SRC_DIR := .
DIST_DIR := $(SRC_DIR)/dist
POPMKR_DIST := $(DIST_DIR)/$(POPMKR).js
JS_DIR := $(SRC_DIR)/js
LAYOUTS_DIR := $(SRC_DIR)/layouts
CSS_DIR := $(SRC_DIR)/css
EXTERNAL_DIR := $(SRC_DIR)/external
LIB_DIR := $(SRC_DIR)/lib
BUTTER_DIR := $(SRC_DIR)/butter

HTML_SRCS := \
  $(SRC_DIR)/index.html

JS_LIBS := \
  $(BUTTER_DIR)/dist/butter.js \
  $(BUTTER_DIR)/dist/lib/butter.preview-link.js \
  $(BUTTER_DIR)/dist/lib/butter.comm.js \
  $(BUTTER_DIR)/dist/lib/jquery.js \
  $(BUTTER_DIR)/dist/lib/jquery-ui.min.js \
  $(BUTTER_DIR)/dist/lib/trackLiner.js

CSS_LIBS := \
  $(BUTTER_DIR)/dist/css/jquery-ui-1.8.5.custom.css \
  $(BUTTER_DIR)/dist/css/trackLiner.css

MISC_LIBS := \
  $(BUTTER_DIR)/dist/lib/defaultEditor.html

$(POPMKR_DIST): $(DIST_DIR)
	@@echo "Creating popcorn-maker"
	@@cp -r $(JS_DIR) $(DIST_DIR)/js
	@@cp -r $(LAYOUTS_DIR) $(DIST_DIR)
	@@cd $(BUTTER_DIR); make clean; make; cd ..
	@@cp $(JS_LIBS) $(LIB_DIR)
	@@cp $(CSS_LIBS) $(LIB_DIR)
	@@cp $(MISC_LIBS) $(LIB_DIR)
	@@cp -r $(CSS_DIR) $(DIST_DIR)
	@@cp -r $(LIB_DIR) $(DIST_DIR)
	@@cp $(HTML_SRCS) $(DIST_DIR)
	@@echo "Finished, see $(DIST_DIR)"

all: $(DIST_DIR) $(POPMKR_DIST)
	@@echo "Finished, see $(DIST_DIR)"

$(DIST_DIR):
	@@echo "Creating $(DIST_DIR)"
	@@mkdir $(DIST_DIR)

clean:
	@@rm -fr $(DIST_DIR)

submodules:
	@@git submodule init
	@@git submodule update
