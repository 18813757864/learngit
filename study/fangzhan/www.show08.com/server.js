var http = require('http');
var fs = require('fs');
var documentRoot = 'D:/study/fangzhan/www.show08.com'; //设置文件的根目录，可以修改为个人的自定义目录。
var server = http.createServer(function(req,res) {
    var url = req.url;
    var file = documentRoot + url;
    console.log(url);
    fs.readFile(file,function(err,data) {
        if(err){
            res.writeHeader(404,{
                'content-type':'text/html;charset="utf-8"'
            });
            res.write('<h1>404错误</h1><p>你要找的页面不存在</p>');
            res.end();
        }else{
            res.writeHeader(200,{
                'content-type':'text/html;charset=utf-8"'
            });
            res.write(data);
            res.end();
        }
    });
}).listen(8887);//设置的端口号，建议为6000以上。
console.log('服务器开启成功');

'https://xtbgyy.digitalgd.com.cn/OA/YxSynthetical-web/minstone/affairAnnual/lookButton?type=0&classify=4&userLab=申请人&realDayBtn=请假天数&workDate=参加工作时间&workYear=工作年限&annualDay=应休假期天数&startName=开始时间&endName=结束时间&vacationType=休假类别&startDate=开始日期&startMeridiem=开始时段&endDate=结束日期&endMeridiem=结束时段&readOnly=true&flowId=269&flowInid=46016&stepInco=-1&primaryKey=&tableName=pm_leave_info&formCode=332&formVersion=1.0&formula=0'