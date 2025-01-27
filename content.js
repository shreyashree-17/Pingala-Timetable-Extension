function getPersonalData(){
    let dp=document.getElementsByClassName('pull-left image')[0].getElementsByTagName('img')[0].src;
    let name=document.getElementsByClassName('pull-left info')[0].getElementsByTagName('p')[0].innerHTML.trim();
    let str=document.getElementsByClassName('content-header')[0]
    .getElementsByClassName('breadcrumb')[0]
    .getElementsByTagName('li')[1].innerText;
    
    
    let d=document.getElementsByClassName('col-lg-6');
    let roll_no;
    let programme;
    let dept;
    let appliedCredits;
    for(let i=1;i<d.length;i++){
        if(d[i].getElementsByTagName('div')[0].previousElementSibling.innerText==="Applied Credits :"){
            appliedCredits=d[i].getElementsByTagName('div')[0].innerText;
        }
        else if(d[i].getElementsByTagName('div')[0].previousElementSibling.innerText==="Roll No. :"){
            roll_no=d[i].getElementsByTagName('div')[0].innerText;
        }
        else if(d[i].getElementsByTagName('div')[0].previousElementSibling.innerText==="Programme :"){
            programme=d[i].getElementsByTagName('div')[0].innerText;
        }
        else if(d[i].getElementsByTagName('div')[0].previousElementSibling.innerText==="Department :"){
            dept=d[i].getElementsByTagName('div')[0].innerText;
        }
    }
        
    // let roll_no=document.getElementsByClassName('row col-lg-12')[0].getElementsByClassName('col-lg-6')[0].getElementsByTagName('div')[0].innerText;
    // let programme=document.getElementsByClassName('row col-lg-12')[0].getElementsByClassName('col-lg-6')[1].getElementsByTagName('div')[0].innerText;
    // let dept=document.getElementsByClassName('row col-lg-12')[2].getElementsByClassName('col-lg-6')[0].getElementsByTagName('div')[0].innerText;
    // let appliedCredits=document.getElementsByClassName('row col-lg-12')[1].getElementsByClassName('col-lg-6')[1].getElementsByTagName('div')[0].innerText;


    let sem="";
    for(let i=0;i<str.length;i++){
        if((str[i]>='0'&&str[i]<='9')||str[i]==='/') sem+=str[i];
    }
    sem=sem.slice(0,4) +'-'+sem.slice(4);
    return {dp:dp,name:name,roll_no:roll_no,programme:programme,dept:dept,appliedCredits:appliedCredits,sem:sem};

}    

chrome.runtime.onMessage.addListener(async function(request, sender, sendResponse) {
    if (request.action === 'GetTT') {
      const bodyContent = document.body.innerHTML;
      const parser = new DOMParser();
      const doc = parser.parseFromString(bodyContent, 'text/html');
      let timetable = {}
      let personal_data = {}
      if(!CheckSite(doc)){
        sendResponse({timetable: timetable, personal_data: personal_data});
        return
      }
      personal_data = getPersonalData();
      const content = doc.getElementsByClassName("fc-event-container")
      let d = -1;
      for(let i=0; i<content.length; i++){
        const x = content[i].getElementsByClassName("fc-content")
        if(!(x.length)){
            d++;
        }
        for(let j=0; j<x.length; j++){
            const time1 = x[j].getElementsByClassName("fc-time")
            const title1 = x[j].getElementsByClassName("fc-title")
            let time = null
            let time_start = null;
            let time_end = null;
            let title = null;
            Array.from(time1).forEach((element) => {
                time = element.getAttribute("data-full")
                for(let k=0; k<time.length; k++){
                    if(time[k] === '-'){
                        time_start = time.slice(0,k-1)
                        time_end = time.slice(k+2)
                    }
                }
              });
            Array.from(title1).forEach((element) => {
                title = element.innerText
              });
            let day = Day(d);
            if (!timetable.hasOwnProperty(day)) {
                timetable[day] = [];
            }
            timetable[day].push({ time: time_start, time_end: time_end, title: title , lectureHall : '' })
        }
      }
      sendResponse({timetable: timetable, personal_data: personal_data});
    }
    if(request.action === 'LHC'){
        const bodyContent = document.body.innerHTML;
        const parser = new DOMParser();
        const doc = parser.parseFromString(bodyContent, 'text/html');
        chrome.runtime.sendMessage({action: 'alert', alert_type: CheckSite_1(doc)});
        if(CheckSite_1(doc) !== '3'){
            return
        }
        let data
        search(request.courses, 10).then(LHC => {
            console.log(LHC)
            chrome.runtime.sendMessage({ action: 'LHCData', data: LHC });
        })
        .catch(error => {
            console.error(error);
        });
    }
});

async function search(queries, delay) {
    let LHC = {}
    const parent = document.getElementById('datatable_filter');
    const input = parent.querySelector('.form-control');
  
    for (const query of queries) {
        console.log(query);
        input.value = '(' + query + ')';
        const inputEvent = new Event('input', { bubbles: true });
        input.dispatchEvent(inputEvent);
        const changeEvent = new Event('change', { bubbles: true });
        input.dispatchEvent(changeEvent);
        
        await new Promise(resolve => setTimeout(resolve, delay));

        const table = document.getElementById('datatable');
        const tbody = table.tBodies[0]
        const firstRow = tbody.rows[0];
        const firstCell = firstRow.cells[9];
        const innerText = firstCell.innerText;
        LHC[query] = innerText
        console.log(innerText);
    }
    return LHC
}
  

function CheckSite_1(doc){
    const header = doc.getElementById('headerText')
    if(header == null){
        return '1'
    }
    if(header.innerText != ' Check Timetable'){
        return '1'
    }
    const show = doc.getElementById('showTimeTableBtn')
    if (showTimeTableBtn.getAttribute('disabled') !== null) {
        return '2'
    }
    if(showTimeTableBtn.getAttribute('disabled') == null){
        const table = document.getElementById('datatable');
        const tbody = table.tBodies[0]
        if(tbody.innerText === 'No data available in table'){
            InvalidSite_1(2)
            return '2'
        }
    }
    return '3'
}


function CheckSite(doc){
    const header = doc.getElementById('headerText')
    if(header === null){
        return false
    }
    if(!header.innerText.includes('Application')){
        return false
    }
    return true
}


function Day(d){
    if(d == 0){
        return "Monday"
    }
    if(d == 1){
        return "Tuesday"
    }
    if(d == 2){
        return "Wednesday"
    }
    if(d == 3){
        return "Thursday"
    }
    if(d == 4){
        return "Friday"
    }
}
