(function ($) {
    // 下拉框的编号，用于操作各自对应的下拉框
    var serialNo = 0;

    // 插件类
    var Eselect = function ($element, options) {
        /*private*/
        var _this = this,// 实例
            _opt = options, // 配置
            _serialNo = serialNo + 1,// 编号，每初始化一个加1
            _data, // 缓存数据
            _vkMap = {}, // 缓存的value,key映射
            _isLoaded, // 已加载数据的标识
            _$ele = $element, _$wrap, _$name, _$pop, _$options, _$indicator,// 需要频繁操作的元素
            _placeholder = _opt.placeholder || '请选择', // placeholder
            _readonly = false, // 只读标识
            _params = _opt.params;// 请求参数

        // 初始化，生成html，缓存元素，生成选项
        var _init = function(){
            _$ele.attr('type','hidden')
                 .addClass('eselect-value')
                 .hide()
                 .wrap('<div class="eselect-wrap"></div>');
            _$wrap = _$ele.parent('.eselect-wrap').width(_opt.width || 240);
            _$name = $('<div class="eselect-name">'+_placeholder+'</div>').appendTo(_$wrap);
            $('<div class="eselect-addon"><i class="fa fa-angle-down"></i></div>').appendTo(_$wrap);
            _genPop();
            _evt();
            if(_opt.url && !_opt.doNotLoadUntilOpen){
                _load();
            }else{
                _this.setOptions();
            }
        }
        // 生成下拉框，缓存元素
        var _genPop = function(){
            var width = _$wrap.width();
            var height = _opt.height || 'auto';
            var offset = _$wrap.offset();
            var left = offset.left;
            var top = offset.top + _$wrap.height() + 4;
            _$pop = $('<div class="eselect-pop pop-'+_serialNo+'"></div>')
                .css({
                    top: top,
                    left: left,
                    width: width,
                    height: height
                })
                .appendTo('body');
            _$indicator = $('<div class="eselect-indicator"></div>').appendTo(_$pop);
            _$options = $('<ul class="eselect-options"></ul>').appendTo(_$pop);
        }
        // 使某个选项高亮
        var _highlightOption = function ($obj) {
            $obj.addClass('active').siblings().removeClass('active');
        }
        // 绑定事件
        var _evt = function(){
            // 下拉框显隐
            _$wrap.on('click', function(){
                // doNotLoadUntilOpen为真时，初次点开下拉框时才进行初次请求数据
                if(!_isLoaded && _opt.url && _opt.doNotLoadUntilOpen){
                    _load();
                }
                _this.toggle();
            });
            // 选项选中，选中值变化时触发onCHange，
            _$pop.on('click','.eselect-option',function(e){
                var $this = $(this);
                var oldVal = _$ele.val();
                var index = $this.index();
                var option = _data[index];
                var newVal = option[_opt.valueField || 'value'];
                _this.val(newVal);
                _this.shut();
                if(newVal != oldVal){
                    // 参数为新选中值newVal和选项数据option
                    _opt.onChange(newVal, option);
                }
            });
            // 点击外部隐藏下拉框
            $('body').on('mousedown',function(e){
                var $target = $(e.target);
                if(
                    !(
                        $target.closest(_$wrap).length > 0
                        || $target.closest(_$pop).length > 0
                    )
                ){
                    _this.shut();
                }
            });
        }
        // 设置提示的内容，message为假时隐藏提示
        var _indicate = function(message){
            var content = {
                busy: '<i class="fa fa-spin fa-spinner"></i>'
            };
            if(message){
                _$indicator.html(content[message] || message).show();
            }else{
                _$indicator.empty().hide();
            }
        }
        // 请求数据，此方法未完成
        var _load = function(){
            $.ajax({
                type: 'post',
                dataType: 'json',
                url: _opt.url,
                data: _params,
                beforeSend: function(){
                    _$options.empty();
                    _indicate('busy');
                },
                success: function(res){
                    _isLoaded = true;
                    // _indicate(false);
                }
            });
        }



        /*public*/
        // 下拉框显隐
        this.toggle = function(){
            _$wrap.toggleClass('open');
            _$pop.toggleClass('open');
        }
        // 下拉框显示
        this.pop = function(){
            _$wrap.addClass('open');
            _$pop.addClass('open');
        }
        // 下拉框隐藏
        this.shut = function(){
            _$wrap.removeClass('open');
            _$pop.removeClass('open');
        }
        // val真，手动选中选项，val假，获取当前选中值
        this.val = function(val){
            if(typeof val == 'undefined'){
                return _$ele.val();
            }else{
                if (_readonly) {
                    return;
                }
                var nameAtIndex = _vkMap[val];
                if(nameAtIndex){
                    var splitMarkIndex = nameAtIndex.indexOf('@');
                    var name = nameAtIndex.substring(0,splitMarkIndex);
                    var index = nameAtIndex.substring(splitMarkIndex + 1);
                    _highlightOption(_$pop.find('.eselect-option').eq(index));
                    _$name.text(name);
                    return _$ele.val(val);
                }else{
                    _this.clear();
                }
            }
        }
        // 清空选中
        this.clear = function(){
            _$pop.find('.eselect-option').removeClass('active');
            _$ele.val('');
            _$name.text(_placeholder);
        }
        // 根据数据生成选项
        this.setOptions = function(options){
            _vkMap = {};
            var nameField = _opt.nameField || 'key';
            var valueField = _opt.valueField || 'value';
            options = options || _opt.options;
            _data = options;
            var html = '';
            for(var i=0,len=options.length;i<len;i++){
                var option = options[i];
                var val = option[valueField];
                var name = option[nameField];
                _vkMap[val] = name + '@' + i;
                var cls = 'eselect-option';
                if (option.hidden) {
                    cls += ' eselect-hidden';
                }
                html += '<li class="'+ cls +'">'+name+'</li>';
            }
            _$options.html(html);
        }
        // 设置只读，只读时this.val(val)无效
        this.setReadonly = function (isReadonly) {
            _readonly = isReadonly;
        }

        _init();
    };

    // 插件主调用，保持jQuery链式调用
    $.fn.eselect = function (options, params) {
        if(typeof options == 'string'){
            var inst = this.data('eselect');
            return inst[options](params);
        }
        var opt = $.extend({},defaults,options);
        var eselect = new Eselect(this, opt);
        return this.data('eselect', eselect);
    };

    // 默认配置
    var defaults = {

    };



})(jQuery);







