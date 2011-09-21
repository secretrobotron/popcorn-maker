#ifndef __ZIPPER_H__
#define __ZIPPER_H__

#include <v8.h>
#include <node.h>
#include <node_object_wrap.h>

// stl
#include <string>
#include <vector>

// libzip
#include <zlib.h>
#include <errno.h>
#include <zip.h>
//#include <zipint.h>

using namespace v8;
using namespace node;

class Zipper: public node::ObjectWrap {
  public:
    static Persistent<FunctionTemplate> constructor;
    static void Initialize(Handle<Object> target);
    static Handle<Value> New(const Arguments &args);
    
    // Async
    static Handle<Value> addFile(const Arguments& args);
    static int EIO_AddFile(eio_req *req);
    static int EIO_AfterAddFile(eio_req *req);
    
    Zipper(std::string const& file_name);

  private:
    ~Zipper();
    std::string const file_name_;
    struct zip *archive_;
};

#endif
