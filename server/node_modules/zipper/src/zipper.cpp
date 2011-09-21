#include "zipper.hpp"

// stl
#include <sstream>
#include <vector>
#include <cstring>
#include <algorithm>
//#include <iostream>

#include <node_buffer.h>
#include <node_version.h>


#define TOSTR(obj) (*String::Utf8Value((obj)->ToString()))

Persistent<FunctionTemplate> Zipper::constructor;

void Zipper::Initialize(Handle<Object> target) {

    HandleScope scope;
  
    constructor = Persistent<FunctionTemplate>::New(FunctionTemplate::New(Zipper::New));
    constructor->InstanceTemplate()->SetInternalFieldCount(1);
    constructor->SetClassName(String::NewSymbol("Zipper"));

    // functions
    NODE_SET_PROTOTYPE_METHOD(constructor, "addFile", addFile);

    target->Set(String::NewSymbol("Zipper"),constructor->GetFunction());
}

Zipper::Zipper(std::string const& file_name) :
  ObjectWrap(),
  file_name_(file_name),
  archive_() {}

Zipper::~Zipper() {
    zip_close(archive_);
}

Handle<Value> Zipper::New(const Arguments& args)
{
    HandleScope scope;

    if (!args.IsConstructCall())
        return ThrowException(String::New("Cannot call constructor as function, you need to use 'new' keyword"));

    if (args.Length() != 1 || !args[0]->IsString())
        return ThrowException(Exception::TypeError(
          String::New("first argument must be a path to a zipfile")));

    std::string input_file = TOSTR(args[0]);
    struct zip *za;
    int err;
    char errstr[1024];
    if ((za=zip_open(input_file.c_str(), ZIP_CREATE, &err)) == NULL) {
        zip_error_to_str(errstr, sizeof(errstr), err, errno);
        std::stringstream s;
        s << "cannot open file: " << input_file << " error: " << errstr << "\n";
        return ThrowException(Exception::Error(
            String::New(s.str().c_str())));
    }

    Zipper* zf = new Zipper(input_file);
    zf->archive_ = za;
    zf->Wrap(args.This());
    return args.This();

}


typedef struct {
    Zipper* zf;
    struct zip *za;
    std::string name;
    std::string path;
    bool error;
    std::string error_name;
    std::vector<unsigned char> data;
    Persistent<Function> cb;
} closure_t;


Handle<Value> Zipper::addFile(const Arguments& args)
{
    HandleScope scope;

    if (args.Length() < 3)
        return ThrowException(Exception::TypeError(
          String::New("requires three arguments, the path of a file, a filename and a callback")));
    
    // first arg must be path
    if(!args[0]->IsString())
        return ThrowException(Exception::TypeError(
          String::New("first argument must be a file path to add to the zip")));
    
    // second arg must be name
    if(!args[1]->IsString())
        return ThrowException(Exception::TypeError(
          String::New("second argument must be a file name to add to the zip")));
    
    // last arg must be function callback
    if (!args[args.Length()-1]->IsFunction())
        return ThrowException(Exception::TypeError(
                  String::New("last argument must be a callback function")));
  
    std::string path = TOSTR(args[0]);
    std::string name = TOSTR(args[1]);
  
    Zipper* zf = ObjectWrap::Unwrap<Zipper>(args.This());

    closure_t *closure = new closure_t();

    // libzip is not threadsafe so we cannot use the zf->archive_
    // instead we open a new zip archive for each thread
    struct zip *za;
    int err;
    char errstr[1024];
    if ((za=zip_open(zf->file_name_.c_str() , ZIP_CREATE, &err)) == NULL) {
        zip_error_to_str(errstr, sizeof(errstr), err, errno);
        std::stringstream s;
        s << "cannot open file: " << zf->file_name_ << " error: " << errstr << "\n";
        zip_close(za);
        return ThrowException(Exception::Error(String::New(s.str().c_str())));
    }

    closure->zf = zf;
    closure->za = za;
    closure->error = false;
    closure->path = path;
    closure->name = name;
    closure->cb = Persistent<Function>::New(Handle<Function>::Cast(args[args.Length()-1]));
    eio_custom(EIO_AddFile, EIO_PRI_DEFAULT, EIO_AfterAddFile, closure);
    ev_ref(EV_DEFAULT_UC);
    zf->Ref();
    return Undefined();
}


int Zipper::EIO_AddFile(eio_req *req)
{
    closure_t *closure = static_cast<closure_t *>(req->data);

    struct zip_source *source = zip_source_file(closure->za, closure->path.c_str(), 0, 0);
    if (zip_add(closure->za, closure->name.c_str(), source) < 0) {
        std::stringstream s;
        s << "Cannot prepare file for add to zip: '" << closure->path << "'\n";
        closure->error = true;
        closure->error_name = s.str();
        zip_source_free(source);
    }

    if (zip_close(closure->za) < 0) {
        std::stringstream s;
        s << "Cannot add file to zip: '" << closure->path << "' (" << zip_strerror(closure->za) << ")\n";
        closure->error = true;
        closure->error_name = s.str();
    }

    return 0;
}


int Zipper::EIO_AfterAddFile(eio_req *req)
{
    HandleScope scope;

    closure_t *closure = static_cast<closure_t *>(req->data);
    ev_unref(EV_DEFAULT_UC);

    TryCatch try_catch;
  
    if (closure->error) {
        Local<Value> argv[1] = { Exception::Error(String::New(closure->error_name.c_str())) };
        closure->cb->Call(Context::GetCurrent()->Global(), 1, argv);
    } else {
        Local<Value> argv[1] = { Local<Value>::New(Null()) };
        closure->cb->Call(Context::GetCurrent()->Global(), 1, argv);
    }

    if (try_catch.HasCaught()) {
      FatalException(try_catch);
      //try_catch.ReThrow();
    }
    
    closure->zf->Unref();
    closure->cb.Dispose();
    delete closure;
    return 0;
}
