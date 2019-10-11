//登出
function logout() {
    window.location.href = logoutUrl;
}

//成功提示
function successMsg(msg){
    top.layer.msg(msg, {icon: 1});
}
//错误提示
function errorMsg(msg){
    top.layer.msg(msg, {icon: 5});
}
//警告提示
function warnMsg(msg){
    top.layer.msg(msg, {icon: 7});
}
// 页面顶部悬浮提示
function operationTipSuccess(message) {
    message = '<i class="fa fa-check-circle-o"></i>  ' + message;
    top.layer.msg(message + '  ', {
        skin: 'operation-tip success',
        // offset: offsetTop,
        // anim: 5
        // time:3000000
    });
}
function operationTipWarn(message) {
    message = '<i class="fa fa-warning"></i>  ' + message;
    top.layer.msg(message + '  ', {
        skin: 'operation-tip warn',
        // offset: offsetTop,
        // anim: 6,
        // time:3000000
    });
}
function operationTipError(message) {
    message = '<i class="fa fa-warning"></i>  ' + message;
    top.layer.msg(message + '  ', {
        skin: 'operation-tip error',
        // offset: offsetTop,
        // anim: 6
    });
}
function handler200(handler){
    return function (data) {
        if(data.status == 200){
            handler(data);
        }else{
            operationTipError(data.desc);
        }
    }
}
// 判断字符串是否只包含空格或者为空或特殊字符
var patrn = /[`~!@#$%^&*()_\-+=<>?:"{}|,.\/;'\\[\]·~！@#￥%……&*（）——\-+={}|《》？：“”【】、；‘’，。、]/im;
function isOnlySpace(str) {
    var reg = new RegExp(patrn);
    if (str.length == 0 || !/[^\s]/.test(str) || reg.test(str)) {
        return true;
    } else {
        return false;
    }
}
/**
 * 获取url中指定的参数，默认查询当前页面路径
 * @param name {string} 参数名
 * @param url {url} url
 * @returns {string} 参数值
 */
function getParam(name,url){
    var target = url ? url.substr(url.indexOf('?')) : window.location.search;
    var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)", "i");
    var r = target.substr(1).match(reg);
    if (r != null) return (r[2]);
}
/**
 * laydate换主题色
 * @returns {string} 颜色值
 *
 * */
function changeLayDateColor(){
	var color = skin
	if (color == "red"){
		return "#ff4b58"
	}
	if (color == "blue"){
		return "#007aeb"
	}
	if (color == "green"){
		return "#4ec1b1"
	}
}

/**
 * 拿到父页面的url
 */
function getUrl(name, url) {
    var target = url;
    var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)", "i");
    var r = target.substr(1).match(reg);
    if (r != null) return (r[2]);
}

/**
 * Date对象增加格式化方法，Date().Format("yyyy-MM-dd hh:mm:ss")
 */
function addDateProto(){
    Date.prototype.Format = function(fmt){
        var o = {
            "M+": this.getMonth() + 1, //月份
            "d+": this.getDate(), //日
            "h+": this.getHours(), //小时
            "m+": this.getMinutes(), //分
            "s+": this.getSeconds(), //秒
            "q+": Math.floor((this.getMonth() + 3) / 3), //季度
            "S": this.getMilliseconds() //毫秒
        };
        if (/(y+)/.test(fmt)) {
            fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
        }
        for (var k in o) {
            if (new RegExp("(" + k + ")").test(fmt)) {
                fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
            }
        }
        return fmt;
    };
}


/**
 * 获取当前日期
 *@return {String}
 * */
function getNowDate() {
    var date = new Date();
    var seperator1 = "-";
    var seperator2 = ":";
    var year = date.getFullYear();
    var month = date.getMonth() + 1;
    var strDate = date.getDate();
    if (month >= 1 && month <= 9) {
        month = "0" + month;
    }
    if (strDate >= 0 && strDate <= 9) {
        strDate = "0" + strDate;
    }
    var currentdate = year + seperator1 + month + seperator1 + strDate

    return currentdate;
}

//获取当前时间
function getNowTime() {
    var date = new Date();
    var seperator1 = "-";
    var seperator2 = ":";
    var year = date.getFullYear(); //年
    var month = date.getMonth() + 1; //月
    var strDate = date.getDate(); //日
    var hour = date.getHours();//时
    var min = date.getMinutes(); //分
    if (month >= 1 && month <= 9) {
        month = "0" + month;
    }
    if (strDate >= 0 && strDate <= 9) {
        strDate = "0" + strDate;
    }
    if (hour >= 0 && hour <= 9) {
        hour = "0" + hour;
    }
    if (min >= 0 && min <= 9) {
        min = "0" + min;
    }

    var currentdate = year + seperator1 + month + seperator1 + strDate + ' ' + hour + seperator2 + min

    return currentdate;
}

/**
 * 集中处理ie8 JS兼容
 */
function compatibilitySetups(){
    // console.log兼容
    if(!window.console){
        window.console = {};
    }
    if(!window.console.log){
        window.console.log = function(msg){};
    }
    // ie8 .trim兼容
    String.prototype.trim = function () {
        return this.replace(/^\s\s*!/, '').replace(/\s\s*$/, '');
    };
}



//顶部提示
function topToastErr(message) {
    top.toastr.error(message);
}


//为全局加载效果所做的类的实例
var indicator = (function () {
    var _index = -1;
    return {
        busy: function () {
            _index = layer.load(1);
        },
        free: function () {
            layer.close(_index);
        }
    };
})();
/* 加载提示*/
function showLoading() {
    indicator.busy();
}
function clearLoading() {
    indicator.free();
}
function showTopLoading() {
    top.indicator.busy();
}
function clearTopLoading() {
    top.indicator.free();
}



/* 添加类名，同辈删除类名*/
(function ($) {
    $.fn.radioCls = function (cls) {
        cls = cls || 'active';
        this.addClass(cls).siblings().removeClass(cls);
        return this;
    };
})($);



//全局ajax配置
$.ajaxSetup({
    type: 'post',
    dataType: 'json',
    beforeSend: showLoading,
    complete: clearLoading,
    error:function(){
        operationTipError('接口失败');
    }
});

//获取当前用户信息
function getUserInfoAsync(fn) {
    // if (!top.userInfo) {
        $.ajax({
            url: rubikWeb + '/api/org/user/getUserInfo',
            success: function (res) {
                var status = res.status;
                var data = res.data;
                if (status == 200) {
                    top.userInfo = {
                        userCode: data.userCode,
                        deptCode: data.deptCode,
                        roleCodes: data.roleCodeList.map(roleCodeMapper)
                    };
                    fn && fn(top.userInfo);
                }else {
                    operationTipError('获取用户信息失败');
                }
            },
            error: function () {
                operationTipError('获取用户信息失败');
            }
        });
    // }else {
    //     fn && fn(top.userInfo);
    // }
}


function getUserInfoCallback(fn){
    $.ajax({
        url: rubikWeb + '/api/org/user/getUserInfo',
        success: function (res) {
            var status = res.status;
            var data = res.data;
            if (status == 200) {
                var userInfo = {
                    userCode: data.userCode,
                    deptCode: data.deptCode,
                    roleCodes: data.roleCodeList.map(roleCodeMapper)
                };
                fn && fn(userInfo);
            }else {
                operationTipError('获取用户信息失败');
            }
        },
        error: function () {
            operationTipError('获取用户信息失败');
        }
    });
}

//数组映射：取roleCode属性
function roleCodeMapper(item) {
    return item.roleCode;
}





// 获取所有流程的itemSeq
function getItemSeqMap() {
    if (!top.itemSeqMap) {
        top.itemSeqMap = {};
        $.ajax({
            async: false,
            url: rubikWeb + '/api/treeDef/getFormDef',
            beforeSend: null,
            complete: null,
            data: {
                ItemTypeStr: 2,
                applicationCode: applicationCode,
            },
            success: handler200(function (res) {
                var flows = res.data;
                for (var i = 0, len = flows.length; i < len; i++) {
                    var flow = flows[i];
                    top.itemSeqMap[flow.id] = flow.itemSeq;
                }
            })
        })
    }
}
// 获取对应的itemSeq
function itemSeqFmt(flowId) {
    return top.itemSeqMap[flowId] || '';
}


// getItemSeqMap();


//测试是否为空格
function isSpace(str) {
    if (str == "") return true;
    var regu = "^[ ]+$";
    var re = new RegExp(regu);
    return re.test(str);
}

//判断是否是数组
function isArray(arr) {
    return Object.prototype.toString.call(arr) == '[object Array]';
}

//对象转地址字符串拼接
function transParams(obj) {
    var arr = [];
    for (var key in obj) {
        if (obj[key] == null) {
            continue;
        }
        arr.push(key + "=" + obj[key]);
    }
    return arr.join("&");
}
/*转换时分秒 */
function transformDate(time) {
    var regObj = /时|分/g
    var time = time.replace(regObj, ':')
    time = time.substring(0, time.length - 4);
    return time;
}




//绑定回车事件
function enterFn(className){
    $(document).keydown(function(event){
        if(event.keyCode==13){
            $("."+className).click(); 
        }
    })
}

//销毁layer
function distoryTimeRanfer(start,end){
    var $start = $('[name='+start+']')
    var $end = $('[name='+end+']')
    // var $cloneStart = $start.clone();
    $start.remove();
    $end.remove();
    var strHtml = '<input type="text" autocomplete="off" name="'+ start +'" class="laydate-input" placeholder="请选择日期" >'

    var endHtml = '<input style="margin-left:13px" type="text" autocomplete="off" name="'+ end +'" class="laydate-input" placeholder="请选择日期" >'
    $('.layer-div-start').append(strHtml)
    $('.layer-div-end').append(endHtml)
    layerRander(start,end)
}

//渲染时间段
function layerRander(start,end){
    var theme = changeLayDateColor();
    var startDate = laydate.render({
        elem: '[name='+ start +']',
        type: 'date',
        theme: theme,
        min: '1900-01-01',
        max: '2099-12-31',
        done: function (val, dates) {
            if (val) {
                endDate.config.min = {
                    year: dates.year,
                    month: dates.month - 1, //关键
                    date: dates.date,
                    hours: dates.hours,
                    minutes: dates.minutes,
                    seconds: dates.seconds
                }
            }else{
                endDate.config.min = {
                    year: '1900',
                    month: '00', //关键
                    date: '01',
                    hours: '',
                    minutes: '',
                    seconds: ''
                }
            }
            if( $('[name='+start+']').val() != '' && $('[name='+end+']').val() != ''  ){
                if( new Date($('[name='+start+']').val().replace("-", "/")) > new Date($('[name='+end+']').val().replace("-", "/"))){
                    $('[name='+start+']').val('')
                    operationTipWarn('开始时间不得大于结束时间')
                    return false;
                }
            }
        }
    })
    var endDate = laydate.render({
        elem: '[name='+ end +']',
        theme: theme,
        min: '1900-01-01',
        done: function (val, dates) {
            if (val) {
                startDate.config.max = {
                    year: dates.year,
                    month: dates.month - 1,//关键
                    date: dates.date,
                    hours: dates.hours,
                    minutes: dates.minutes,
                    seconds: dates.seconds
                }
            } else{
                startDate.config.max = {
                    year: '2099',
                    month: '11',//关键
                    date: '31',
                    hours: '',
                    minutes: '',
                    seconds: ''
                }
            }
            if( $('[name='+start+']').val() != '' && $('[name='+end+']').val() != '' ){
                if( new Date($('[name='+start+']').val().replace("-", "/")) > new Date($('[name='+end+']').val().replace("-", "/"))){
                    operationTipWarn('结束时间不得小于开始时间');
                    $('[name='+end+']').val('')
                    return false;
                }
            }
        }
    })
}




$(document).ready(function () {
    setInterval(function(){
		
		//复选按钮样式优化
        $('.ui-jqgrid-view input[role="checkbox"]').each(function(){
            if(!$(this).hasClass('has_not')){
                $(this).wrap("<em class='ui-jqgrid-chekced'></em>");
                $(this).addClass('has_not');
                $(this).parent().append('<span></span>');
                $(this).show();
            }else if($(this).closest('.ui-jqgrid-chekced').find('span').length>1){
                var checked_ = $(this).parent().children('input');
                $(this).closest('.ui-jqgrid-chekced').prepend(checked_);
                $(this).closest('.ui-jqgrid-chekced').find('span').eq(0).remove()
            }
        });
		//ie浏览器input-readonly属性能获取光标，改成disabled
		$('.wrapper-content [readonly]').each(function(){
			if(!$(this).hasClass('layer-date')){
				$(this).attr('disabled',true);
			}
		});
	}, 100);
})


