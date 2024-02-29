const checkFormatHour=(data)=>{
     if(data==null || data==undefined || data=="") return false;

     var regex=/^([01]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/;
     return regex.test(data);
}

const checkFormatDate=(data)=>{
     if(data==null || data==undefined || data=="") return false;

     var regex=/^d{4}-\d{2}-\d{2}$/;
     return regex.test(data);
}

/* rend 0 si pareil, rend 1 si hour1 est plus grand, et rend -1 si hour2 est plus grand */
const compareHours=(hour1,hour2)=>{
     var [hh1,mm1]=hour1.split(":");
     var [hh2,mm2]=hour2.split(":");

     hh1=parseInt(hh1, 10);
     mm1=parseInt(mm1, 10);
     hh2=parseInt(hh2, 10);
     mm2=parseInt(mm2, 10);

     if(hh1>hh2) return 1
     else if(hh1==hh2 && mm1>mm2) return 1
     else if(hh1==hh2 && mm1==mm2) return 0
     else return -1
}

module.exports={
     checkFormatHour,
     compareHours
}
