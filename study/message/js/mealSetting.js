
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
        laydate.render({
            elem: '#morningTime'
            ,theme: '#2697f5'
            ,type: 'time'
            // ,format: 'HH:mm'
        });
        laydate.render({
            elem: '#nightTime'
            ,theme: '#2697f5'
            ,type: 'time'
            // ,format: 'HH:mm'
        });
        laydate.render({
            elem: '#noonTime'
            ,theme: '#2697f5'
            ,type: 'time'
            // ,format: 'HH:mm'
        });
    })
    layui.use('layer', function(){ //独立版的layer无需执行这一句
        var layer = layui.layer; //独立版的layer无需执行这一句     

        //菜谱查看按钮
        $('#add').click(function () {
            layer.open({
                title: "菜谱查看",
                type: 1,
                content: $('#add-box'),
                area: ['700px', '300px'],
                btn: ['关闭'],
                success: function(layero,index){

                },
            });
        });
        $('#clear').click(function(){
            layer.confirm('确认要清空吗？',{
                skin: 'layer-rubik-skin',
                btn:['确定','取消'],
                icon:3,
                area:  ['422px','168px'],
                title:'提示'
            },function(index){
                layer.close(index)
            });
        })
    });
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
                {label:'序号', name:'documentNumber',width:'25%', sortable:false,},
                {label:'菜品名', name:'title', width:'25%', sortable:false},
                {label:'分类', name:'createType',width:'25%', sortable:false},
                {label:'操作', name:'modifyDate', width:'25%',formatter: dateFmt, sortable:false},
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
                rowNum: 1000, //每页记录数
                rowList: [5, 10, 15,50, 100, 300],
                pager: '#pager', //
                viewrecords: true,
                multiselect:true,
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





