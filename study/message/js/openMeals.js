$(function(){
    //自定义颜色
    // laydate.render({
    //     elem: '#time'
    //     ,theme: '#2697f5'
    //     ,type: 'month'
    // });

    layui.use('laydate', function(){
        var laydate = layui.laydate;
         //自定义颜色
        laydate.render({
            elem: '#time'
            ,theme: '#2697f5'
            ,type: 'month'
        });
    })

   function getNowMonth(){
        var nowDate = new Date();
        var y = nowDate.getFullYear();
        var m = nowDate.getMonth() + 1;
        if(m < 10){
            m = '0' + m;
        }
        return y + '-'+ m;
   }

   //获取某个月有多少天
   function getCountDays(month) {
        var curDate = new Date(month);
        /* 获取当前月份 */
        var curMonth = curDate.getMonth();
       /*  生成实际的月份: 由于curMonth会比实际月份小1, 故需加1 */
       curDate.setMonth(curMonth + 1);
       /* 将日期设置为0, 这里为什么要这样设置, 我不知道原因, 这是从网上学来的 */
       curDate.setDate(0);
       /* 返回当月的天数 */
          return curDate.getDate();
   }

    //根据日期 得到是 星期几
    function getWeekByDay(dayValue){ //dayValue=“2014-01-01”
        var day = new Date(Date.parse(dayValue.replace(/-/g, '/'))); //将日期值格式化 
        var today = new Array("星期日","星期一","星期二","星期三","星期四","星期五","星期六"); //创建星期数组
        return today[day.getDay()];  //返一个星期中的某一天，其中0为星期日 
    }
    
    $('#time').val(getNowMonth());
    var dataMonth = [
        {
            mealDate:'2019-04-01',
            breakfastState:'1',
            lunchState:'0',
            dinnerState:'1',
            week:'星期一',
        }
    ];

    function updatedTable(){
        var strHtml = '';
            $.each(dataMonth,function(i,item){
                var breakfastActive = '';
                var lunchActive = '';
                var dinnerActive = '';
                var weekend = '';
                if(item.breakfastState == 1){
                    breakfastActive = 'checked';
                } 
                if(item.lunchState == 1){
                    lunchActive = 'checked';
                } 
                if(item.dinnerState == 1){
                    dinnerActive = 'checked';
                }
                if(item.week == '星期六'|| item.week == '星期日'){
                    weekend = 'weekend'
                }
                strHtml += '<tr class="'+ weekend +'"><td>'+ item.mealDate + ' ' + item.week +'</td>'
                        +  '<td><input class="breakfast-checbox" type="checkbox" '+ breakfastActive +'></td>'
                        +  '<td><input class="lunch-checbox" type="checkbox" '+ lunchActive +'></td>'
                        +  '<td><input class="dinner-checbox" type="checkbox" '+ dinnerActive +'></td></tr>'
            });
            $('#meal-table tbody').html(strHtml);
    }
    
    //清空按钮
    $('#clear').click(function(){
        layer.confirm('确认要清空吗？',{
            skin: 'layer-rubik-skin',
            btn:['确定','取消'],
            icon:3,
            area:  ['422px','168px'],
            title:'提示'
        },function(index){
            $.each(dataMonth,function(i,item){
                item.dinnerState = 0;
                item.lunchState = 0;
                item.dinnerState = 0;
            })
            updatedTable();
            layer.close(index)
        });
    });
    // 查询按钮
    $('.search-btn').click(function () {
        dataMonth = [];
        var dateStr = $('#time').val();
        var curMonthNum = getCountDays(dateStr);
        for(var i = 0; i < curMonthNum; i++){
            var curday = i + 1;
            if(curday < 10){
                curday = '0' + curday;
            }
            dataMonth.push({
                mealDate:dateStr + '-' + curday,
                breakfastState:0,
                lunchState:0,
                dinnerState:0,
                week: getWeekByDay(dateStr + '-' + curday),
            })
            updatedTable();
        }
        if(dateStr){
            $.ajax({
                url:curPath+"/minstone/diningroomInfo/findMealSettingByMonth",
                type:"post",
                dataType:'json',
                data:{
                    dateStr:dateStr
                },
                success:function(data){
                   console.log(data);
                   if(data.status==200){
                        $.each(data.data,function(i,item){
                            $.each(dataMonth, function(j,jtem){
                                if(jtem.mealDate == item.mealDate){
                                    jtem.breakfastState = item.breakfastState;
                                    jtem.lunchState = item.lunchState;
                                    jtem.dinnerState = item.dinnerState;
                                }
                            })
                        })
                        updatedTable();
                   }else if(data.status==404){
                        updatedTable();
                   }else{
                    top.layerMsg({
                        icon: 2,// 0警告 1成功 2错误
                        time: 2000,
                        content: data.desc
                    });
                   }
                }
            })
        }else{
            top.layerMsg({
                icon: 0,
                time: 2000,
                content: "请选定年月"
            });
        }
    });
    $('.search-btn').click();
    // 重置按钮
    $('.reset-btn').click(function () {
        $('#time').val(getNowMonth());
        $('.search-btn').click();
    });
    //早餐全开按钮
    $('#all-breakfast-btn').click(function(){
        $.each(dataMonth,function(i,item){
            if(item.week != "星期六" && item.week != "星期日" ){
                item.breakfastState = 1;
            }
        })
        updatedTable();
    });
    //中餐全开按钮
    $('#all-lunch-btn').click(function(){
        $.each(dataMonth,function(i,item){
            if(item.week != "星期六" && item.week != "星期日" ){
                item.lunchState = 1;
            }
        })
        updatedTable();
    });
    //晚餐全开按钮
    $('#all-dinner-btn').click(function(){
        $.each(dataMonth,function(i,item){
            if(item.week != "星期六" && item.week != "星期日" && item.week != "星期五"){
                item.dinnerState = 1;
            }
        })
        updatedTable();
    });
    //全部开餐按钮
    $('#all-btn').click(function(){
        $('#all-breakfast-btn').click();
        $('#all-lunch-btn').click();
        $('#all-dinner-btn').click();
    });
    $('#save').click(function(){
        var dataList = [];
        $.each(dataMonth, function(i,item){
            if(item.breakfastState == 1 || item.lunchState == 1 || item.dinnerState){
                dataList.push(item)
            }
        });
        if(dataList.length > 0){
            $.ajax({
                url:curPath+"/minstone/canteenInfo/confirmReleaseCookBook",
                type:"post",
                dataType:'json',
                data:dataList,
                success:function(data){
                    top.layerMsg({
                        icon: 1,
                        time: 2000,
                        content: data.desc
                    });
                }
            })
        }else{
            top.layerMsg({
                icon: 1,
                time: 2000,
                content: '保存成功！'
            });
        }
    });
})





