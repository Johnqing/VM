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
    var prefix = "vm-",
        W3C = window.dispatchEvent,
        // 切割字符串 'a,b,c'.replace(/[^, ]+/g)
        regx = /[^, ]+/g;
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

	var each = function(obj, fn){
		for (var i = obj.length - 1; i >= 0; i--) {
			fn && fn.call(obj[i], i, obj[i]);
		};
	}

    var event = {
        /**
         * 事件绑定
         * @param el
         * @param type
         * @param fn
         * @param phase
         * @returns {*}
         */
        on: function(el, type, fn, phase){
            phase = phase || false;
            if (W3C) {
                el.addEventListener(type, fn, phase);
            } else {
                el.attachEvent("on" + type, fn);
            }
            return fn;
        }
    }

    //vm-duplex
    var bindhandler = {
        on: function(obj, value){
            var text = getText(obj);
            this.model[text] = value;
        },
        duplex: function(data, obj){
            var that= this,
                el = data,
                v = el.value,
                type = el.type,
                evt = 'keyup';

            if(/radio|checkbox|select/.test(type)){
                v = '';
                evt = 'change';
            }

            event.on(el, evt, function(){
                bindhandler.on.call(that, obj, this.value);
            });
        }
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

    /**
     * 获取文件
      * @param node
     * @returns {*}
     */
	function getText(node){
		return node.textContent || node.innerText;
	}

    /**
     * 设置文本
     * @param node
     * @param text
     */
	function setText(node, text){
		if(W3C){
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
			render.call(that, this, obj);
		});

		// 递归子节点
		each(obj.childNodes, function(){
			// 如果发现是node节点 递归
			if (this.nodeType === 1) {
				return renderDOM.call(that, this);
			}
			render.call(that, this, obj);
		});

	}

	function render(obj, defObj){
		var that = this,
			defText = getText(obj);
        var isPrefix = obj.nodeName.indexOf(prefix)
        if(~isPrefix){
            var name = obj.nodeName.slice(prefix.length);
            that.bind(name, defObj, obj);
            return;
        }
        var text = renderTpl.call(that, defText, function(i){
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
	}

	MVVM.prototype = {
		init: function(){
			this.getModel();
			this.defMod();
            renderDOM.call(this, this.wp);
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
		},
        bind: function(name, data, obj){
            bindhandler[name].call(this, data, obj);
        }
	}

	// api
	VM.mvvm = function(id, opts){
		opts.model || (opts.model = {});
		return new MVVM(id, opts);
	}


});