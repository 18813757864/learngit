
$(function(){
    layui.use('layer', function(){ //独立版的layer无需执行这一句
        var layer = layui.layer; //独立版的layer无需执行这一句     

        //菜谱录入按钮
        $('.blue-txt').click(function () {
            layer.open({
                title: "录入菜谱",
                type: 1,
                content: $('#add-box'),
                area: ['700px', '550px'],
                btn: ['提交','关闭'],
                success: function(layero,index){

                },
            });
        });
        // $('.blue-txt').click();
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
    var data = {"deptName":"研发部","message":"跳转页面成功","userCode":"wuwf","status":1,"pageInfo":{"pageNum":1,"pageSize":10,"size":0,"startRow":0,"endRow":0,"total":0,"pages":0,"firstPage":0,"prePage":0,"nextPage":0,"lastPage":0,"isFirstPage":true,"isLastPage":false,"hasPreviousPage":false,"hasNextPage":false,"navigatePages":8},"userName":"伍伟烽","timeInfoList":[{"isEmpty":"0","createTime":"2019-04-09 18:04:34","workDate":"2019-04-09","createUser":"wuwf","updateTime":"2019-04-09 18:04:09","color":4,"seq":"7007439281634169a7d4b45db6134f80","colorType":4,"updateUser":"wuwf"},{"isEmpty":"0","createTime":"2019-04-03 20:04:11","workDate":"2019-04-03","createUser":"wuwf","updateTime":"","color":1,"seq":"3a3b73e87ada4f388aa29fade6ef691f","colorType":1,"updateUser":""},{"isEmpty":"0","createTime":"2019-04-23 18:04:10","workDate":"2019-04-23","createUser":"wuwf","updateTime":"2019-04-23 18:04:41","color":1,"seq":"7a6787f3485149fd826d4ddca1ef30cc","colorType":1,"updateUser":"wuwf"},{"isEmpty":"0","createTime":"2019-04-11 18:04:36","workDate":"2019-04-11","createUser":"wuwf","updateTime":"","color":1,"seq":"36cca2c8a58741bdaac3494aefa78496","colorType":1,"updateUser":""},{"isEmpty":"0","createTime":"2019-04-30 14:04:18","workDate":"2019-04-30","createUser":"wuwf","updateTime":"","color":0,"seq":"eea4139a66c84ddfbc05bac3a00b0e2c","colorType":2,"updateUser":""},{"isEmpty":"0","createTime":"2019-04-22 18:04:05","workDate":"2019-04-22","createUser":"wuwf","updateTime":"","color":1,"seq":"fd33512dd8824f8a871bdfa92c5a7bf4","colorType":1,"updateUser":""},{"isEmpty":"0","createTime":"2019-04-17 08:04:54","workDate":"2019-04-16","createUser":"wuwf","updateTime":"","color":1,"seq":"0efb5f865e4b40099c5d4f41428a051d","colorType":1,"updateUser":""},{"isEmpty":"0","createTime":"2019-04-25 17:04:17","workDate":"2019-04-25","createUser":"wuwf","updateTime":"2019-04-25 17:04:03","color":1,"seq":"b7b64362c1374fe4a72f8c4cafb7528d","colorType":1,"updateUser":"wuwf"},{"isEmpty":"0","createTime":"2019-04-19 18:04:28","workDate":"2019-04-19","createUser":"wuwf","updateTime":"2019-04-19 18:04:12","color":1,"seq":"5d7aa819196b4e13aa0883988157e120","colorType":1,"updateUser":"wuwf"},{"isEmpty":"0","createTime":"2019-04-16 11:04:25","workDate":"2019-04-12","createUser":"wuwf","updateTime":"","color":1,"seq":"34b8a741ef8d48448d0c2d10bc7efff4","colorType":1,"updateUser":""},{"isEmpty":"0","createTime":"2019-04-16 11:04:58","workDate":"2019-04-15","createUser":"wuwf","updateTime":"","color":1,"seq":"74e5dc154c6745df89b6755fe84808ba","colorType":1,"updateUser":""},{"isEmpty":"0","createTime":"2019-04-26 17:04:59","workDate":"2019-04-26","createUser":"wuwf","updateTime":"","color":1,"seq":"004e0285fbbe45f68619fcd925e71138","colorType":1,"updateUser":""},{"isEmpty":"0","createTime":"2019-04-08 22:04:57","workDate":"2019-04-08","createUser":"wuwf","updateTime":"","color":1,"seq":"c4925c5d6d2d4d1d9fb371a84bf28a05","colorType":1,"updateUser":""},{"isEmpty":"0","createTime":"2019-04-10 18:04:48","workDate":"2019-04-10","createUser":"wuwf","updateTime":"","color":1,"seq":"7dd96b3ea4774f1d8c3d90d060aa0b50","colorType":1,"updateUser":""},{"isEmpty":"0","createTime":"2019-04-02 20:04:42","workDate":"2019-04-02","createUser":"wuwf","updateTime":"","color":1,"seq":"0056dae0ba72419691dfbfbab4c582f3","colorType":1,"updateUser":""},{"isEmpty":"0","createTime":"2019-04-19 09:04:04","workDate":"2019-04-18","createUser":"wuwf","updateTime":"","color":1,"seq":"4e9a4097ec0845469b7b960b283f04dc","colorType":1,"updateUser":""},{"isEmpty":"0","createTime":"2019-04-28 17:04:52","workDate":"2019-04-28","createUser":"wuwf","updateTime":"2019-04-28 18:04:41","color":1,"seq":"7bae20dc221f4c15a8f882666f632f2e","colorType":1,"updateUser":"wuwf"},{"isEmpty":"0","createTime":"2019-04-09 18:04:14","workDate":"2019-04-06","createUser":"wuwf","updateTime":"","color":1,"seq":"c188af0ef55e495d827bbdfc6b724d60","colorType":1,"updateUser":""},{"isEmpty":"0","createTime":"2019-04-25 17:04:00","workDate":"2019-04-24","createUser":"wuwf","updateTime":"","color":1,"seq":"30d4c8f23c6e4a5386eb67db42d230ee","colorType":1,"updateUser":""},{"isEmpty":"0","createTime":"2019-04-29 17:04:46","workDate":"2019-04-29","createUser":"wuwf","updateTime":"2019-04-29 18:04:41","color":1,"seq":"fa68fc09159f4c6e8992c6e255b64ea2","colorType":1,"updateUser":"wuwf"},{"isEmpty":"0","createTime":"2019-04-01 18:04:23","workDate":"2019-04-01","createUser":"wuwf","updateTime":"","color":1,"seq":"8ca5c9cfc424449d8acc7e0309b2f7e7","colorType":1,"updateUser":""},{"isEmpty":"0","createTime":"2019-04-18 08:04:19","workDate":"2019-04-17","createUser":"wuwf","updateTime":"","color":1,"seq":"c6def6c88e3b4f0da17edebdbbea5176","colorType":1,"updateUser":""}],"deptCode":"1915"};
    var data2 = {"time":1557643385402,"data":{"datalist":[{"mealWeek":"星期日","dinnerMenu":"烧鸭饭","dbName":"oracle","modifier":"","lunchOvertime":0,"lunchState":1,"delFlag":0,"uuid":"1111","createrDate":null,"inputState":2,"modiUser":"","breakfastState":1,"id":"","mealDate":"2019-05-12","createDate":"","creator":"","modifyDate":"","breakfastOvertime":0,"lunchMenu":"猪脚饭","isNewRecord":true,"dinnerOvertime":0,"createrUser":"","tccStatus":"DRAFT","modiDate":null,"dinnerState":0,"applicationCode":"MD_XCPYB_OA","breakfastMenu":"肠粉"},{"mealWeek":"星期一","dinnerMenu":"","dbName":"oracle","modifier":"","lunchOvertime":0,"lunchState":1,"delFlag":0,"uuid":"2222","createrDate":null,"inputState":1,"modiUser":"","breakfastState":0,"id":"","mealDate":"2019-05-13","createDate":"","creator":"","modifyDate":"","breakfastOvertime":0,"lunchMenu":"","isNewRecord":true,"dinnerOvertime":0,"createrUser":"","tccStatus":"DRAFT","modiDate":null,"dinnerState":1,"applicationCode":"MD_XCPYB_OA","breakfastMenu":""}]},"status":200,"desc":"查询成功"};
    var options = {
        width: '430px',
        height: '450px',
        language: 'CH', //语言
        showLunarCalendar: true, //阴历
        showHoliday: true, //休假
        showFestival: true, //节日
        showLunarFestival: false, //农历节日
        showSolarTerm: false, //节气
        showMark: true, //标记
        timeRange: {
            startYear: 1900,
            endYear: 2049
        },
        hasWriteMark: {},
        theme: {
            changeAble: true,
            weeks: {
                backgroundColor: '#4778c7',
                borderColor: 'rgb(89, 194, 230)',
                fontColor: 'rgb(255, 255, 255)',
                fontSize: '18px',
            },
            days: {
                backgroundColor: '#e8e8e8',
                fontColor: '#565555',
                fontSize: '15px'
            },
            todaycolor: '#e8e8e8',
        },
        // 配置日期的点击事件
        getClickDate: function (infoFlag, dateString, dom) {
            if (infoFlag === 999) {
                return;
            }
            var clickNow = new Date();
            var workDateArray = dateString.split("-");
            if (clickNow.getFullYear() < (workDateArray[0] - 0)) {
                return;
            }
            if (clickNow.getFullYear() == (workDateArray[0] - 0) && (clickNow.getMonth() + 1) < (workDateArray[1] - 0)) {
                return;
            }
            if (clickNow.getFullYear() == (workDateArray[0] - 0) && (clickNow.getMonth() + 1) == (workDateArray[1] - 0) && clickNow.getDate() < (workDateArray[2] - 0)) {
                return;
            }
            if($(dom).attr('data-seq')){
                
            }else{
                top.layerMsg({
                    icon: 0,
                    time: 2000,
                    content: "所选日期未开餐，无法录入菜谱。"
                });
                return false;
            }
            console.log(infoFlag)
            console.log(dateString)
            console.log(dom)
            console.log(dom.dataset)
            // var seq = dom.dataset.seq || ""
            // var url = projectPath + "/timeInfo/timeInfoWrite#workDate=" + encodeURIComponent(dateString) + "&id=" + seq;
            // window.location.href = url
        },
        // 在这里发起请求，获取查询的时间对应的工时数据，修改日历的样式
        selectMonthOrYear: function (calendarTime2) {
            calendarStatus(calendarTime2);
        }
    };

    var myCalendar = new SimpleCalendar('#dateContainer', options);
    var timeInfoList = data2.data.datalist || []
    for (var i = 0; i < timeInfoList.length; i++) {
        console.log(timeInfoList[i])
        myCalendar.addMark(timeInfoList[i].mealDate, timeInfoList[i])
    }
})





