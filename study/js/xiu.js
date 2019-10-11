var x,y,str;
for(var i = 1.5;i > -1.5;i -= 0.1){
    str = "";
    for(var x = -1.5; x < 1.5; x+=0.05){
        y = x * x + i * i - 1;
        if(y * y * y - x * x * i * i < 0.0){
            str += "*";
        }else{
            str += " "
        }
    }
    console.log(str);
}