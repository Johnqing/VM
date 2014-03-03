(function(root, factory){

	if(typeof exports == 'object' && exports){
		// commonjs
		factory(module.exports);
	} else{
		var VM = {};

		factory(VM);

		if(typeof define == 'function' && define.amd){
			//AMD
			define(VM);
		} else {
			root.VM = root.vm = VM;
		}

	}

})(this, function(VM, undefined){
	// 定界符
	var openTags = VM.openTags = '{{';
	var closeTags = VM.closeTags = '}}';

	// =============== 私有 ==========================

	var $ = function(id){
		var fst = id.slice(0, 1);
		if(fst == '#'){
			return document.getElementById(id.slice(1));	
		}
		// 偷懒。。。
		return document.querySelector(id);		
	}

	var isType = function(type){
		return function(obj){
			return {}.toString.call(obj) == '[object '+type+']';
		}
	}

	var isArray = isType('Array');

	var each = function(obj, fn){
		for (var i = obj.length - 1; i >= 0; i--) {
			fn && fn.call(obj[i], i, obj[i]);
		};
	}
	// ie6 - 8
	if(!Object.keys){
		Object.keys = function(obj){
			var result = [];

			for(var key in obj){
				if(obj.hasOwnProperty(key)){
					result.push(key);
				}
			}

			return result;

		}
	}

	// ===================ie6-7 不支持，ie8有bug=====================
	var defineProperty = Object.defineProperty;

	// 
	function getText(node){
		return node.textContent || node.innerText;
	}

	function setText(node, text){
		if(node.textContent){
			node.textContent = text;
			return;
		}
		node.innerText = text;
	}

	// {{name}} 渲染 
	function renderTpl(str, fn){
		var that = this,
			result = '';

		var opArr = str.split(openTags);

		for (var i = 0; i < opArr.length; i++) {
			var closeArr = opArr[i].split(closeTags);
			if(closeArr.length === 1){
				result += opArr[i];	
			}else{
				result += that.defModel[closeArr[0]] + closeArr[1]
				fn && fn(closeArr[0]);
			}
		};

		return result;
	}

	// class="{{cls}}"
	function renderDOM(obj){
		var that = this;
		each(obj.attributes, function(){
			render.call(that, this);
		});

		// 递归子节点
		each(obj.childNodes, function(){
			// 如果发现是node节点 递归
			if (this.nodeType === 1) {
				return renderDOM.call(that, this);
			}
			render.call(that, this);
		});

	}

	function render(obj){
		var that = this,
			defText = getText(obj),
			text = renderTpl.call(that, defText, function(i){
				that.mod[i].push({
					node: obj,
					cont: defText
				});
			});
		setText(obj, text)	
	}

	// ==============================================

	function MVVM(id, opts){

		this.wp = $(id);

		this.defModel = opts.model;
		// 节点存储
		this.mod = {};

		this.init();

		renderDOM.call(this, this.wp);


	}

	MVVM.prototype = {
		init: function(){
			this.getModel();
			this.defMod();
		},
		defMod: function(){
			var that = this;
			for(var key in that.defModel){
				that.mod[key] = [];
			}
		},
		getModel: function(){
			var that = this,
				def = that.defModel,
				model = {};

			each(Object.keys(def), function(i, key){
				defineProperty(model, key, {
					get: function(key){
						return def[key];
					},
					set: function(value){
						def[key] = value;
						each(that.mod[key], function(){
							setText(this.node, renderTpl.call(that, this.cont));
						});
					}
				});	
			});
			that.model = model;
		}
	}

	// api
	VM.mvvm = function(id, opts){
		opts.model || (opts.model = {});
		return new MVVM(id, opts);
	}


});