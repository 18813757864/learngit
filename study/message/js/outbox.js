
// 表格对象
var gridData = [];

var grid = {
    load:function(){
        $('.search-btn').click()
    }
};
$(function(){

    layui.use('laydate', function(){
        var laydate = layui.laydate;
         //自定义颜色

        var startTime = laydate.render({ 
            elem: '#starTime',
            type: 'date',
            theme: '#007aeb',
            format: 'yyyy-MM-dd',
            // btns: ['confirm'],
            max: '2099-12-31 24:59:59',
            btns: ['clear', 'confirm'],
            done: function (val, dates) {
                if (val) {
                    var timeObj = {
                        year: dates.year,
                        month: dates.month - 1, //关键  
                        date: dates.date,
                    }
                    endTime.config.min = timeObj;
                }else{
                    endTime.config.min = {
                        year: '1900',
                        month: '00', //关键  
                        date: '01',
                    }
                }
            }
        });
        var endTime = laydate.render({ 
            elem: '#endTime',
            type: 'date',
            theme: '#007aeb',
            format: 'yyyy-MM-dd',
            btns: ['clear', 'confirm'],
            done: function (val, dates) {
                if (val) {
                    startTime.config.max = {
                        year: dates.year,
                        month: dates.month - 1,//关键   
                        date: dates.date,
                    }
                } else{
                    startTime.config.max = {
                        year: '2099',
                        month: '11',//关键   
                        date: '31',
                    } 
                }
            }
        });
        //日期时间选择器
        laydate.render({
            elem: '#effectTime'
            ,type: 'datetime'
            ,format: 'yyyy-MM-dd HH:mm'
        });
    })
    layui.use('layer', function(){ //独立版的layer无需执行这一句
        var layer = layui.layer; //独立版的layer无需执行这一句     
            //消息模板
            top.layer.open({
                title: "新建消息模板",
                type: 1,
                content: $('#edit-msg-box'),
                area: ['750px', '450px'],
                btn: ['提交','关闭'],
                success: function(layero,index){
                    var $layero = $(layero);
                    var $other = $layero.find('#other');
                    var $typeOther = $layero.find('#typeOther');
                    $layero.find('#detailed').val('')
                    $other.click(function(){
                        $typeOther.toggle();
                    })
                },
                yes:function(index,layero){
                    var $layero = $(layero);
                    var $checkBox = $layero.find('input[name=type]');
                    var $detailed = $layero.find('#detailed');
                    var $other = $layero.find('#other');
                    var $typeOther = $layero.find('#typeOther');
                    var checkboxArr = [];
                    $.each($checkBox,function(i,item){
                        if($(item).prop('checked')){
                            checkboxArr.push(i);
                        }
                    })
                    if(checkboxArr.length == 0){
                        top.layerMsg({
                            icon: 0,// 0警告 1成功 2错误
                            time: 2000,
                            content: '请选择反馈类型！' 
                        });
                        return false;
                    }
                    if(!$detailed.val()){
                        top.layerMsg({
                            icon: 0,// 0警告 1成功 2错误
                            time: 2000,
                            content: '请填写反馈内容！' 
                        });
                        return false;
                    }
                    if($other.prop('checked') && !$typeOther.val()){
                        top.layerMsg({
                            icon: 0,// 0警告 1成功 2错误
                            time: 2000,
                            content: '请填写其他反馈类型！' 
                        });
                        return false;
                    }
                    var postData = {
                        type:checkboxArr.toString(),
                        typeOther:$typeOther.val(),
                        content:$detailed.val()
                    }
                    $.ajax({
                        url:curPath+"/minstone/orderingMeal/addFeedback",
                        type:"post",
                        dataType:'json',
                        data:postData,
                        success:function(data){
                            if(data.status == 200){
                                top.layerMsg({
                                    icon: 1,// 0警告 1成功 2错误
                                    time: 2000,
                                    content: data.desc
                                });
                                loadJqGrid()
                            }else{
                                top.layerMsg({
                                    icon: 2,// 0警告 1成功 2错误
                                    time: 2000,
                                    content: data.desc
                                });
                            }
                            top.layer.close(index);
                        }
                    })
                }
            });
    });

    // var content = '<link rel="stylesheet" type="text/css" href="'+ curPath +'/static/modules/diningroomManage/css/openLayer.css">' + $('#edit-msg-box').parent().html();
    var content = $('#edit-msg-box').html();

    // 页签切换执行信息
    var tabControl = [
        // 全部
        {
            params: {
                receiveOrSend:'send',
                stateIn:'0,1',
                title:''
            },
            url: 'http://172.16.2.73:8080/instance-web/minstone/docexchange/docMainList',
            // url: gwContextPath + '/instance-web/minstone/docexchange/docMainList',
            cols: [
                // {label:' ', name:'emergencyDegree',width:'5%', sortable:false,formatter: urgentFmt},
                {label:'时间', name:'documentNumber',width:'25%', sortable:false,},
                {label:'类别', name:'title', width:'25%', sortable:false},
                {label:'反馈内容', name:'createType',width:'25%', sortable:false},
                {label:'管理员回复', name:'modifyDate', width:'25%',formatter: dateFmt, sortable:false},
                {label:'', name:'pid', width:'0%'}
            ]
        }
    ];
    getData(0);
    var typeNum = 0;

    //格式化 日期
    function dateFmt(value, col, row){
        return (transformTime(value)).slice(0,10)
    }


    var statusName = ['草稿','待签发','已发送','待签收','已签收']
    //格式化 状态
    function statusFmt(value, col, row){
        console.log(value)
        return statusName[value]
    }
    
    //时间转化
    function transformTime(timestamp) {
        // timestamp = +new Date()
        if (timestamp) {
            var time = new Date(timestamp);
            var y = time.getFullYear();
            var M = time.getMonth() + 1;
            var d = time.getDate();
            var h = time.getHours();
            var m = time.getMinutes();
            var s = time.getSeconds();
            return y + '-' + addZero(M) + '-' + addZero(d) + ' ' + addZero(h) + ':' + addZero(m) + ':' + addZero(s); //"2018-08-08 12:09:12"
            } else {
                return '';
            }
    }
    function addZero(m) {
        return m < 10 ? '0' + m : m;
    }
    
    function getData(type){
        $.jgrid.defaults.styleUI = 'Bootstrap';
            var parObj = tabControl[type].params;

            $('#grid').jqGrid({
                colModel: tabControl[type].cols,
                height: 'calc(100vh - 300px)',
                url: tabControl[type].url,
                datatype: 'json',
                mtype: 'post',
                postData: parObj,
                width: 'auto',
                autowidth: true,
                rowNum: 15, //每页记录数
                rowList: [5, 10, 15,50, 100, 300],
                pager: '#pager', //
                // viewrecords: true,
                // multiselect:true,
                prmNames:{
                    'page':'page',
                    'rows':'rows'
                },
                jsonReader: {
                    root: 'datalist',
                    records: 'records', //总数
                    total: 'total' //总页数
                },
                loadComplete:function(data){
                    gridData = data.datalist;
                    // console.log(data)
                    if( gridData.length == 0 ){
                        if($(".no-records").html() == null){
                            $(this).parent().append("<div class=\"no-records\"><img src=\""+uiPath+"/components/jqgrid/default.svg\" width=\"180\" /></div>");
                        }
                        $(".no-records").show();
                    } else{
                        $(".no-records").hide();
                        
                    }
                    if(type==0){
                        $(".doc-num").text("("+ data.records +")");
                    }
                },
                beforeSelectRow:function(rowId,e){
                    if( e ){
                        var target = e.srcElement ? e.srcElement : e.target;
                        var $c = $(target);
                        return true
                    }
                },
                onSelectRow: function (rowId,status,e) {                      
                    if( e ){
                        var target = e.srcElement ? e.srcElement : e.target;
                        var $c = $(target);
                        
                        var $checkBox = $c.parents('tr').find('.cbox.checkbox');
                        if( $checkBox.prop('checked') ){
                            if($c.attr('role') == 'checkbox'){
                                return false;
                            }
                            if($c.attr('aria-describedby') == 'grid_stickStatus'){
                                return false;
                            }
                            var rowData = gridData[rowId-1];
                            // editArticle(rowData);
                            console.log(rowData)
                            if(rowData.status || rowData.status == 0){
                                openWin(rowData.status,rowData.pid);
                            }else {
                                openWin("beRejected",rowData.pid);
                            }
                            $('#grid').jqGrid('resetSelection')
                        }
                        return true
                    }
                }
            })
    }

    // 查询按钮
    $('.search-btn').click(function () {
        loadJqGrid();
    });
    // 重置按钮
    // $('.reset-btn').click(function () {
    //     $("#title").val('')
    //     loadJqGrid();
    // });

    //关闭提示
    $('#msg-box .fa-close').click(function(){
        $('#msg-box .tips').hide();
    });

    //刷新表格
    function loadJqGrid(type){
        if(type > -1){
            typeNum = type;
        }
        var params = tabControl[typeNum].params;
        params.title = $("#title").val();
        $('#grid').jqGrid('setGridParam', {
            postData: params,
            page: 1
        }).trigger('reloadGrid');
    }
})





