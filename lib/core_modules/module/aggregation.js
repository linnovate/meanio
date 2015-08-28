'use strict';

var fs = require('fs'),
  request = require('request'),
  uglify = require('uglify-js'),
  rtlcss = require('rtlcss'),
  _ = require('lodash'),
  crypto = require('crypto'),
  path = require('path'),
  List = require('complex-list'),
  inherit = require('./inherit'),
  assetmanager = require('assetmanager'),
  md5 = require('md5'),
  async = true;

//Asset and subtypes represent css and js file (remote, inlines and files)
//WieghtedList - type that represents list with ability to sort out its content according to its weight
//AssetDir - type that can list directory and read files there and create appropriate assets type (see above)
//
//On incoming request modules traversal is begging. Traversal function creates AssetDir instance
//for each public directory of each found module. AssetDir instances read directories and search for js and
//css files and create new instances of corresponding assets.
//
//Some assets are created via aggregateAsset function from app.js of module
//
//When Asset is created, it looks through its content and in case when aggregation is not enabled not using it at all. (can be optimized)
//
//Asset lifecycle
//Asset creation - reading content - process string data - minify (if needed) - putting Asset in corresponding weighted list
//
//RTL is leveraging aggregation functionality even if it is disabled (needs to be changed)

function ascending(a,b){
  return a.options.weight>=b.options.weight;
}

function WeightedList(){
  List.call(this,ascending);
  this.data = '';
  this.src = []
  this.dirty = false;
}
inherit(WeightedList,List);
WeightedList.prototype.add = function(content){
  this.dirty = true;
  List.prototype.add.call(this,content);
};
WeightedList.prototype.getData = function(){
  if(this.dirty){
    this.buildScalars();
  }
  return this.data;
};
WeightedList.prototype.getSrc = function(){
  if(this.dirty){
    this.buildScalars();
  }
  return this.src;
};
WeightedList.prototype.buildScalars = function(){
  this.data = '';
  this.src = [];
  this.traverse(this.addToScalars.bind(this));
  this.dirty = false;
};
WeightedList.prototype.addToScalars = function(content){
  if(!content){return;}
  if(content.src){
    if(content.options.hash && content.hash) {
      this.src.push(content.src + content.options.separator + content.hash);
    } else {
      this.src.push(content.src);
    }
  }
  if(content.data){
    if(this.data){
      this.data += '\n';
    }
    this.data += content.data;
  }
};


var aggregated = {
  css: new WeightedList(),
  js : {
    header: new WeightedList(),
    footer: new WeightedList()
  }
};

function Asset(src,options){
  this.src = src;
  this.options = options;
  this.hash = null;
  if(!this.options.weight){
    this.options.weight=0;
  }
  this.data = null;
}
Asset.prototype.destroy = function(){
  this.data = null;
  this.options = null;
  this.src = null;
  this.hash = null;
};
Asset.prototype.minifyData = function(stringdata){
  this.data = stringdata;
};
Asset.prototype.minifyJSData = function(stringdata){
  var ugly;
  try {
    ugly = uglify.minify(stringdata, {
      fromString: true,
      mangle: false
    });
  }
  catch (e) {
    console.log('\\n\nError in', stringdata, 'on line', e.line);
    console.log(e.message);
    throw e;
  }
  this.data = ugly.code;
};
Asset.prototype.storeCSS = function(){
  aggregated.css.add(this);
};
Asset.prototype.storeJS = function(){
  aggregated.js[this.group()].add(this);
};
Asset.prototype.group = function(){
  var ret = this.options.group || 'footer';
  return ret;
};
Asset.prototype.shouldAggregate = function(){
  return this.options.aggregate !== false;
};
Asset.prototype.shouldMinify = function(){
  return this.options.debug!==true;
};
Asset.prototype.shouldConvertToRtl = function(){
  return this.options.canConvertToRtl && this.options.direction === 'rtl';
};
Asset.prototype.isGlobal = function(){
  return this.options.global===true;
};
Asset.prototype.processStringData = function(stringdata){
  if(this.shouldAggregate()){
    if(stringdata.length){
      this.aggregateStringData(stringdata);
    }else{
      console.log('but not, since data is of 0 length');
    }
  } else if(this.options.hash) {
    this.hash = md5(stringdata);
  }
  this.store();
};
Asset.prototype.processJSStringData = function(stringdata){
  if(!(stringdata && stringdata.length)){
    this.destroy();
    return;
  }
  if(!this.isGlobal()){
    stringdata = '(function(){'+stringdata+'})();';
  }
  Asset.prototype.processStringData.call(this,stringdata);
};
Asset.prototype.aggregateStringData = function(stringdata){
  //console.log('aggregating',stringdata);
  if(this.shouldMinify()){
    this.minifyData(stringdata);
  } else {
    this.data = stringdata;
  }
};

function InlineAsset(src,data,options){
  Asset.call(this,src,options);
  this.processStringData(data);
}
inherit(InlineAsset,Asset);

function InlineCSSAsset(src,options){
  InlineAsset.call(this,"<style>\n"+src+"\n</style>",src,options);
}
inherit(InlineCSSAsset,InlineAsset);
InlineCSSAsset.prototype.store = Asset.prototype.storeCSS;

function InlineJSAsset(src,options){
  InlineAsset.call(this,"<script language='javascript'>\n"+src+"\n</script>",src,options);
}
inherit(InlineJSAsset,InlineAsset);
InlineJSAsset.prototype.store = Asset.prototype.storeJS;
InlineJSAsset.prototype.processStringData = Asset.prototype.processJSStringData;

function RemoteAsset(src,options){
  Asset.call(this,src,options);
  this.fetchData();
}
inherit(RemoteAsset,Asset);
RemoteAsset.prototype.fetchData = function(){
  request(this.src, this.onRemoteData.bind(this));
};
RemoteAsset.prototype.onRemoteData = function(err, res, body) {
  if (!err && res.statusCode === 200) {
    this.processStringData(body);
  }else{
    this.destroy();
  }
};

function RemoteCSSAsset(src,options){
  RemoteAsset.call(this,src,options);
}
inherit(RemoteCSSAsset,RemoteAsset);
RemoteCSSAsset.prototype.store = Asset.prototype.storeCSS;

function RemoteJSAsset(src,options){
  RemoteAsset.call(this,src,options);
}
inherit(RemoteJSAsset,RemoteAsset);
RemoteJSAsset.prototype.store = Asset.prototype.storeJS;
RemoteJSAsset.prototype.processStringData = Asset.prototype.processJSStringData;

function FileAsset(filepath,src,options){
  this.path = filepath;
  if(src.charAt(0)!=='/'){
    src = '/'+src;
  }
  Asset.call(this,src.replace(/\\/g, "/"),options);
  this.read();
}
inherit(FileAsset,Asset);
FileAsset.prototype.destroy = function(){
  Asset.prototype.destroy.call(this);
  this.path = null;
};
FileAsset.prototype.read = function(){
  if(!fs.existsSync(this.path)){
    console.log(this.path,'not found');
    this.destroy();
    return;
  }
  if(async){
    fs.readFile(this.path,this.onErrorAndData.bind(this));
  }else{
    this.onData(fs.readFileSync(this.path));
  }
};
FileAsset.prototype.onErrorAndData = function(err,data){
  if(err){
    return;
  }
  this.onData(data);
};
FileAsset.prototype.onData = function(data){
  this.processStringData(data.toString());
};
FileAsset.prototype.aggregateData = function(stringdata){
};

function CSSFileAsset(filepath,src,options){
  FileAsset.call(this,filepath,src,options);
}
inherit(CSSFileAsset,FileAsset);
CSSFileAsset.prototype.store = Asset.prototype.storeCSS;
CSSFileAsset.prototype.processStringData = function(stringdata) {
  var result = stringdata;

  if (this.shouldConvertToRtl()) {
    try {
      result = rtlcss.process(stringdata);
      this.data = result;
    } catch (e) {
      console.log('\\n\nError in', stringdata, 'on line', e.line);
      console.log(e.message);
      throw e;
    }
  }

  Asset.prototype.processStringData.call(this, result);
};

function JSFileAsset(filepath,src,options){
  FileAsset.call(this,filepath,src,options);
}
inherit(JSFileAsset,FileAsset);
JSFileAsset.prototype.store = Asset.prototype.storeJS;
JSFileAsset.prototype.minifyData = Asset.prototype.minifyJSData;
JSFileAsset.prototype.processStringData = Asset.prototype.processJSStringData;

function AssetDir(ext,dirpath,src,options){
  this.ext = ext;
  this.path = dirpath;
  this.src = src;
  this.options = options;
  this.readdir();
}
AssetDir.prototype.destroy = function(){
  this.options = null;
  this.src = null;
  this.path = null;
  this.ext = null;
};
AssetDir.prototype.readdir = function(){
  if(!fs.existsSync(this.path)){
    this.destroy();
    return;
  }
  if(async){
    fs.readdir(this.path,this.onErrorAndItems.bind(this));
  }else{
    this.onItems(fs.readdirSync(this.path));
  }
};
AssetDir.prototype.onErrorAndItems = function(error,items){
  if(error){
    this.destroy();
    return;
  }
  this.onItems(items);
};
AssetDir.prototype.onItems = function(items){
  items.forEach(this.produceAsset.bind(this));
  this.destroy();
};
AssetDir.prototype.produceAsset = function(item){
  if(item==='assets'){
    return;
  }
  if(item==='tests'){
    return;
  }
  AssetDir.produceAssetFromPath(path.join(this.path,item),this.ext,this.options,path.join(this.src,item));
};
AssetDir.produceAssetFromPath = function(fpath,ext,options,src){
  fpath = fpath.split('?')[0];
  if(!fs.existsSync(fpath)){
    return;
  }
  var fstats = fs.statSync(fpath);
  if(fstats.isDirectory()){
    new AssetDir(ext,fpath,src,options);
  }else{
    if(fstats.isFile()){
      if (path.extname(fpath) !== '.' + ext){
        return;
      }
      switch(ext){
        case 'css':
          new CSSFileAsset(fpath,src,options);
          return;
        case 'js':
          new JSFileAsset(fpath,src,options);
          return;
      }
    }
  }
};

function PackageDir(ext,rootpath,name,options){
  AssetDir.call(this,ext,path.join(rootpath,name,'public'),name,options);
}
inherit(PackageDir,AssetDir);

function moduleAggregateTraverser(ext,options,module){
  new PackageDir(ext,path.join(process.cwd(), module.source), module.name, options);
}

function onAggregatedSrc(loc,ext,res,next,data){
  res.locals.aggregatedassets[loc][ext] = data;
  next && next();
}

function aggregationRequestHandler(meanioinstance, req, res, next){
  //res.locals.assets = assets;
  res.locals.aggregatedassets = {header:{},footer:{}};
  meanioinstance.aggregatedsrc('css', 'header', onAggregatedSrc.bind(null,'header','css',res,null));
  meanioinstance.aggregatedsrc('js', 'header', onAggregatedSrc.bind(null,'header','js',res,null));
  meanioinstance.aggregatedsrc('css', 'footer', onAggregatedSrc.bind(null,'footer','css',res,null));
  meanioinstance.aggregatedsrc('js', 'footer', onAggregatedSrc.bind(null,'footer','js',res,next));
}

function configureApp(Meanio,meanioinstance,defer,app){
  Meanio.modules.dependableConstructor().prototype.aggregatePackage = function(){
    var options = {};
    options.aggregate = Meanio.Singleton.config.clean.aggregate;
    options.debug = Meanio.Singleton.config.clean.debug;
    if(Meanio.Singleton.config.clean.assets) {
      options.hash = Meanio.Singleton.config.clean.assets.hash === false ? false : true;
      options.separator = Meanio.Singleton.config.clean.assets.separator || '?v=';
    } else {
      options.hash = true;
      options.separator = '?v=';
    }

    new PackageDir('js',path.join(process.cwd(), this.source), this.name, options);
    app.useStatic('/'+this.name, this.path('public'));
  };
  var assets = assetmanager.process({
    assets: require(path.join(process.cwd(),'config','assets.json')),
    debug: true, //process.env.NODE_ENV !== 'production',
    webroot: /public\/|packages\//g
  });
  for(var i in assets.core.css){
    meanioinstance.aggregate('css',assets.core.css[i],{group:'header',singlefile:true},meanioinstance.config.clean);
  }
  for(var i in assets.core.js){
    meanioinstance.aggregate('js',assets.core.js[i],{group:'footer',singlefile:true,global:true,weight:-1000000+parseInt(i)},meanioinstance.config.clean);
  }

  // Add assets to local variables
  app.use(aggregationRequestHandler.bind(null,meanioinstance));
  defer.resolve();
}

function onInstance(Meanio,instance,defer){
  instance.resolve('app',configureApp.bind(null,Meanio,instance,defer));
}

function supportAggregate(Meanio) {

  Meanio.onInstance(onInstance.bind(null,Meanio));
  Meanio.prototype.aggregated = function(ext, group, callback) {
    // Aggregated Data already exists and is ready
    //console.log('aggregated calling back on', ext, group,'with',aggregated);
    if(ext==='css' && group==='header'){
      callback(aggregated.css.getData());
      return;
    }

    if (Meanio.Singleton.config.clean.aggregate === false){
      return callback('');
    }

    if(ext==='js'){
      callback(aggregated.js[group].getData());
      return;
    }
    callback('');
  };

  Meanio.prototype.aggregatedsrc = function(ext, group, callback) {
    // Aggregated Data already exists and is ready
    if (Meanio.Singleton.config.clean.aggregate !== false){
      if(ext==='js'){
        if(group==='header'){
          return callback(['/modules/aggregated.js?group=header']);
        }else{
          return callback(['/modules/aggregated.js']);
        }
      }else if(ext==='css' && group==='header'){
        return callback(['/modules/aggregated.css']);
      }
      return callback([]);
    }

    var rtl = [];
    if (ext==='css' && group==='header'){
      rtl.push('/modules/rtl.css');
    }

    if(ext==='css'){
      callback(group==='header' ? (aggregated.css ? aggregated.css.getSrc().concat(rtl) : []) : []);
      return;
    }
    if(ext==='js'){
      callback(aggregated.js && aggregated.js[group] ? aggregated.js[group].getSrc() : []);
      return
    }
    callback([]);
  };

  Meanio.prototype.Module.prototype.aggregateAsset = function(type, asset, options) {
    options = options || {};
    options.aggregate = Meanio.Singleton.config.clean.aggregate;
    options.debug = Meanio.Singleton.config.clean.debug;
    if(Meanio.Singleton.config.clean.assets) {
      options.hash = Meanio.Singleton.config.clean.assets.hash === false ? false : true;
      options.separator = Meanio.Singleton.config.clean.assets.separator || '?v=';
    } else {
      options.hash = true;
      options.separator = '?v=';
    }

    if (Meanio.Singleton.config.clean.public && 
      Meanio.Singleton.config.clean.public.languages &&
      Meanio.Singleton.config.clean.public.currentLanguage) {

      var languages = Meanio.Singleton.config.clean.public.languages;
      var currentLanguage = Meanio.Singleton.config.clean.public.currentLanguage;

      currentLanguage = _(languages).find(function(l) {
        return l.locale === currentLanguage;
      });

      if (currentLanguage) {
        var direction = currentLanguage.direction;
        if (direction) {
          options.direction = direction;
        }
      }
    }

    if (options.inline){
      switch(type){
        case 'css':
          new InlineCSSAsset(asset,options);
          return;
        case 'js':
          new InlineJSAsset(asset,options);
          return;
      }
      return;
    }
    else if (options.url){
      switch(type){
        case 'css':
          new RemoteCSSAsset(asset,options);
          return;
        case 'js':
          new RemoteJSAsset(asset,options);
          return;
      }
      return;
    }else{
      var fpath = path.join(this.loadedmodule.path('public'),'assets',type,asset);
      switch(type){
        case 'css':
          new CSSFileAsset(fpath,path.join(this.name,'assets',type,asset),options);
          return;
        case 'js':
          new JSFileAsset(fpath,path.join(this.name,'assets',type,asset),options);
          return;
      }
    }
  };

  Meanio.onModulesFoundAggregate = function(ext, options) {
    options = options||{};
    options.aggregate = Meanio.Singleton.config.clean.aggregate;
    options.debug = Meanio.Singleton.config.clean.debug;
    if(Meanio.Singleton.config.clean.assets) {
      options.hash = Meanio.Singleton.config.clean.assets.hash === false ? false : true;
      options.separator = Meanio.Singleton.config.clean.assets.separator || '?v=';
    } else {
      options.hash = true;
      options.separator = '?v=';
    }
    Meanio.modules.traverse(moduleAggregateTraverser.bind(null,ext,options));
  };

  Meanio.aggregate = function(ext, asset, options, config) {
    if (!asset) {
      return;
    }
    options = options||{};
    options.aggregate = Meanio.Singleton.config.clean.aggregate;
    options.debug = Meanio.Singleton.config.clean.debug;
    if(Meanio.Singleton.config.clean.assets) {
      options.hash = Meanio.Singleton.config.clean.assets.hash === false ? false : true;
      options.separator = Meanio.Singleton.config.clean.assets.separator || '?v=';
    } else {
      options.hash = true;
      options.separator = '?v=';
    }
    if (options.inline){
      switch(ext){
        case 'css':
          new InlineCSSAsset(asset,options);
          return;
        case 'js':
          new InlineJSAsset(asset,options);
          return;
      }
      return;
    }
    else if (options.url){
      switch(ext){
        case 'css':
          new RemoteCSSAsset(asset,options);
          return;
        case 'js':
          new RemoteJSAsset(asset,options);
          return;
      }
      return;
    }
    AssetDir.produceAssetFromPath(path.join(process.cwd(),asset),ext,options,asset);
  };

  Meanio.prototype.aggregate = Meanio.aggregate;
}

module.exports = supportAggregate;
