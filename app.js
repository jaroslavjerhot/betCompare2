// const { timeStamp } = require("node:console");

// localStorage.clear()




let lxdTeams = []
let lxdNewOpTeams = []
let lxdBetOffices = []

async function fLoadScrapedData(sName, sLink) {
    // const urlInput = document.getElementById('scrapeUrl').value; // your input field
    // const urlInput='https://www.oddsportal.com/matches/football/20260227/'
    const urlInput = lxdBetOffices.find(d => d.sName === sName)[sLink];
    alert('Načítá se data ze scrape pro ' + sName + ' z odkazu ' + urlInput)
    try {
        // For demo, we always fetch the saved JSON
        const response = await fetch(urlInput);
        // const response = await fetch('data.json');
        const data = await response.json();

        // Optional: check that the URL matches
        if (data.url !== urlInput) {
            console.warn(`Requested URL "${urlInput}" differs from scraped URL "${data.url}"`);
        }
        localStorage.setItem(sName + '_inText', data.content);
        alert(`Data scraped from ${urlInput} and saved to localStorage under key "${sName}_inText".`);
        document.getElementById('output').value = data.content;
    } catch (err) {
        alert('Nepodařilo se načíst data ze scrape pro ' + sName + ' z odkazu ' + urlInput)
        console.error('Could not load scraped data', err);
    }
}

document.addEventListener("DOMContentLoaded", async () => {
    //fLoadScrapedData();
    const csvOffices = await fLoadCsv(sOffices)
    lxdBetOffices = fCsvToLxd(csvOffices)
    //const csvTeams = await fLoadCsv(sTransTeams)
    const csvTeams = localStorage.getItem('teams_Csv') || await fLoadCsv(sTransTeams)
    fRenderDownloadSelectBox()
    fRenderConsole(lxdBetOffices); 
    // alert(csvTeams.slice(0,100))
    lxdTeams = fCsvToLxd(csvTeams)
    //localStorage.setItem('teams_Csv', csvTeams)
    // alert(csvOffices.slice(0,100))
    
    
});

function fRenderDownloadSelectBox() {
    // alert('Object.keys(localStorage): ' + Object.keys(localStorage)[0])
    const select = document.getElementById("downloadSelect");
    const options = Object.keys(localStorage)
//        .filter(key => key.endsWith('_Csv'))    
        .sort()
        options.forEach(option => {
            const optionElement = document.createElement("option");
            optionElement.value = option;
            optionElement.textContent = option;
            select.appendChild(optionElement);
        });
}





const dctDnesZitra = {
    'dnes': fGetDateFormatted(0), 'zítra': fGetDateFormatted(1),
    'today': fGetDateFormatted(0), 'tomorrow': fGetDateFormatted(1),
}
let dctB = []


async function fPasteText(textareaId, sCheckWord, sCheckTrans='') {
    let sText = ''
    try {
        sText = await navigator.clipboard.readText();
    } catch (err) {
        alert("Přístup do schránky byl odmítnut.");
        return
    }
    if (!sText) {
        alert("Schránka je prázdná.");
        return
    }
    let sName = ''
    let iMatches = 0
    lxdBetOffices.forEach((d, i) => {
        if (sText.includes(d.sCheckPhrase) && (d.sNotPhrase=='' || !sText.includes(d.sNotPhrase))){
            sName = d.sName
            d.sMatchCountBy = d.sMatchCountBy.replace('##n','\n')
            //iMatches = (sText.length - sText.replaceAll(d.sMatchCountBy,'').length) / d.sMatchCountBy.length
            //lxdBetOffices[i].iMatches = iMatches
            
        }
    })
    const iRows = sText.split('\n').length
    if (sName){
        alert(`Stažený text je z ${sName}. Je v něm ${iRows} řádků.`)
    }else{
        alert(`Stažený text nebyl rozpoznán. Měl by obsahovat jeden z termínů: \n${lxdBetOffices.map(d => d.sName + ': ' + d.sCheckPhrase).join('\n ')}.\nMožná byl automaticky přeložen do češtiny.`)
        return
    }
    
    localStorage.setItem(sName+'_Time', new Date());
    localStorage.setItem(sName+'_inText', sText)
    
    // [sCsv, dctB[sName]] = fProcessText(sName, sText)
}

function fProcessText(sBoId, sText=''){
    const sName = lxdBetOffices.find(d => d.sBoId === sBoId).sName || 'All offices'
    
    sText = sText || localStorage.getItem(sName + '_inText');
    if (!sText){ 
        alert(`${sName+'_inText'} není uloženo.`)
        return(null, null)}

    const lstText = sText
        .split('\n')
        .map(l => l.trim())
        .filter(l => l.length >= 0);
    
    // alert(`Zpracovává se ${sName+'_inText'}. V textu je ${lstText.length} řádků.`)
    let lxdMatches = []
    let lxdNewTeams = []
    const sTeamCol = 'sTeam' + sBoId
    switch (sBoId){
        case 'Op': case 'xx': [lxdMatches, lxdNewTeams] = fProcessOddsPortal(lstText); break;
        case 'Aw': case 'xx': [lxdMatches, lxdNewTeams] = fProcessAllwyn(lstText); break;
        case 'Bx': case 'xx': [lxdMatches, lxdNewTeams] = fProcessBetX(lstText); break;
        case 'Fn': case 'xx': [lxdMatches, lxdNewTeams] = fProcessFortuna(lstText); break;
        case 'Mk': case 'xx': [lxdMatches, lxdNewTeams] = fProcessMerkur(lstText); break;
        case 'Sn': case 'xx': [lxdMatches, lxdNewTeams] = fProcessSynot(lstText); break;
        case 'Ts': case 'xx': [lxdMatches, lxdNewTeams] = fProcessTipsport(lstText); break;
    }
    if (lxdNewTeams.length>0){
        let sFirst5 = lxdNewTeams.slice(0,5).map(d => d[sTeamCol]).join('\n')
        alert(`V datech od ${sName} bylo nalezeno ${lxdNewTeams.length} nových týmů:\n\n${sFirst5}`)
        lxdTeams = fInsertNewTeamsToLxd(lxdTeams, lxdNewTeams, sTeamCol)
        fLxdToLocalStorage(lxdTeams, 'teams_Csv', [sTeamCol])
    } else {
        alert(`V datech od ${sName} nebyly nalezeny žádné nové týmy.`)
    }
    if (lxdMatches.length>0){  
        alert(`V datech od ${sName} bylo zpracováno ${lxdMatches.length} zápasů.`)
        fLxdToLocalStorage(lxdMatches, sName+'_Matches')
    } else {
        alert(`V datech od ${sName} nebyly nalezeny žádné zápasy.`)
    }
}

function fLxdFromLocalStorage(sKey) {
    const csv = localStorage.getItem(sKey)
    return fCsvToLxd(csv)
}
function fLxdToLocalStorage(lxd, sKey, lstExtra=[]) {
    const csv = fLxdToCsv(lxd, lstExtra)
    localStorage.setItem(sKey, csv)
}

function fRenderConsole(lxd) {
  const container = document.getElementById("console");
  
//   let html = `<table class="table table-striped table-bordered">
  let html = `<table class="niceTable">
    <thead>
      <tr>
        <th>Name</th>
        <th>Link</th>
        <th>Age</th>
        <th>Počet</th>
        <th>Paste</th>
        <th>Process</th>
      </tr>
    </thead>
    <tbody>`;

  lxd.forEach((dct, index) => {
    // compute age in seconds
    const [sAge, iAgeS] = ['','']
    const sText = localStorage.getItem(dct.name)
    
    if (sText){
        //[sAge, iAgeS] = getItemAge(dct.name)
        iMatches = (sText.length - sText.replaceAll(dct.sMatchCountBy,'').length) / dct.sMatchCountBy.length
    } else {
        iMatches = 0
    }       
    // const age = Math.floor((Date.now() - new Date(dct.date).getTime()) / 1000);
    const ageClass = iAgeS > 3600 ? "age-old" : ""; // older than 1h → red
    dct.sLinkToday = fGetDateFormatted(dateDiff = 0, dct.sLinkToday)
    dct.sLinkTomorrow = fGetDateFormatted(dateDiff = 1, dct.sLinkTomorrow)

    dct.sLinkToday = dct.sLinkToday.replaceAll('timefilter','timeFilter')
    dct.sLinkTomorrow = dct.sLinkTomorrow.replaceAll('timefilter','timeFilter')


    htmlLinkToday = dct.sLinkToday ? `<a href="${dct.sLinkToday}" target="_blank" class="btn btn-primary btn-sm btn-link">Dnes</a>` : ''
    htmlLinkTomorrow = dct.sLinkTomorrow ? `<a href="${dct.sLinkTomorrow}" target="_blank" class="btn btn-primary btn-sm btn-link">Zítra</a>` : ''
    htmlLinkDate = dct.sLinkDate ? `<a href="${dct.sLinkDate}" target="_blank" class="btn btn-primary btn-sm btn-link">Datum</a>` : ''
        
    html += `<tr>
      <td>${dct.sName ?? ""}</td>
      <td>
      ${htmlLinkToday}
      ${htmlLinkTomorrow}
      ${htmlLinkDate}
      </td>
      <td class="${ageClass}">${sAge}</td>
      <td>${iMatches} zápasů</td>
      <td><button class="btn btn-success btn-sm" onclick="fPasteText()">Paste</button></td>
      <td><button class="btn btn-warning btn-sm" onclick="fProcessText('${dct.sBoId}')">Process</button></td>
      </tr>`;
    x=0
  });

  html += "</tbody></table>";
  container.innerHTML = html;
}

function getItemAge(key) {
    if (!localStorage.getItem(key+'_Time')) {return[0,'N/A']}
    
    const ageMs = Date.now() - localStorage.getItem(key+'_Time').getTime(); // age in milliseconds
    const totalMinutes = Math.floor(ageMs / (1000 * 60));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    // format as hh:mm with leading zeros
    const hh = String(hours).padStart(2, '0');
    const mm = String(minutes).padStart(2, '0');

    return [ageMs/1000, `${hh}:${mm}`]
  } 


function clearTextsmazat(textareaId) {
    document.getElementById(textareaId).value = "";
    localStorage.removeItem(textareaId)
}


function isDecimalOdd(text) {
    return /^\s*\d+\.\d+\s*$/.test(text);
}
function fGetDateFormatted(dateDiff = 0, sFormat='dd.mm.yyyy') {
    const today = new Date();
    
    // Add dateDiff days
    today.setDate(today.getDate() + dateDiff);
    
    const sec = String(today.getSeconds()).padStart(2, '0');
    const min = String(today.getMinutes()).padStart(2, '0');
    const hour = String(today.getHours()).padStart(2, '0'); 
    
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year4 = String(today.getFullYear()); 
    const year2 = year4.slice(-2)
    sFormat = sFormat.toLowerCase()
    if (sFormat.includes('_utc')){
        utcSeconds = (Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())/1000).toString().slice(0, -3)
        return sFormat.replace('_utc', utcSeconds)
    }
    if (sFormat.includes('_y')){
        return sFormat
            .replace('_dd', `${day}`).replace('_mm', `${month}`).replace('_yyyy', `${year4}`).replace('_yy', `${year2}`)
            .replace('_hh', `${hour}`).replace('_mn', `${min}`).replace('_ss', `${sec}`)
    }
    
    if (sFormat) 
        return sFormat
        .replace('dd', `${day}`).replace('mm', `${month}`).replace('yyyy', `${year4}`).replace('yy', `${year2}`)
        .replace('hh', `${hour}`).replace('mn', `${min}`).replace('ss', `${sec}`);
    return `${day}.${month}.${year4}`;
}

function createTimestamp(dateStr, timeStr) {
    if (!dateStr || !timeStr) {return ''}
    const [day, month, year] = dateStr.split('.');
    const [hour, minute] = timeStr.split(':');

    const d = new Date(
        parseInt(year),
        parseInt(month) - 1, // month is 0-based
        parseInt(day),
        parseInt(hour),
        parseInt(minute)
    );

    const utc_year = d.getUTCFullYear();
    const utc_month = String(d.getUTCMonth() + 1).padStart(2, '0');
    const utc_day = String(d.getUTCDate()).padStart(2, '0');
    const utc_hour = String(d.getUTCHours()).padStart(2, '0');
    const utc_minute = String(d.getUTCMinutes()).padStart(2, '0');

    return `${utc_year}-${utc_month}-${utc_day}T${utc_hour}:${utc_minute}`+':00Z';
    

    // return date.getTime(); // milliseconds
    return date.toLocaleString('cs-CZ')
}

// app.js
//let rawTextTipsport = ''

function fProcessTipsport(lines) {
    let sLeague = ''
    let lxd = []
    let lxdOddsPortal = fCsvToLxd(localStorage.getItem('oddsPortal_Matches'))
    let lxdNewTeams = []
    let lstSports=['Fotbal']
    lstSports = lstSports.map(v => ', ' + v);

    for (let i = 0; i < lines.length; i++) {

        if (lstSports.some(word => lines[i].includes(word))) {
            sSport = lines[i].split(',').at(-1).trim()
            sLeague = lines[i].replace(', ' + sSport,'').trim()
            i+=4
        } else if (lines[i].includes(' - ') &&
            lines[i+1].includes(' | ') &&
            lines[i+2].startsWith('+') && 
            isDecimalOdd(lines[i+3]) &&
            isDecimalOdd(lines[i+4]) &&
            isDecimalOdd(lines[i+5]) &&
            isDecimalOdd(lines[i+6]) &&
            isDecimalOdd(lines[i+7])) {

            let match = {'sBoId': 'Ts'};
            match.sId = ''
            match.sSport = sSport;
            match.sCountry = ''
            match.sLeague = sLeague;
            
            match.sDate = lines[i+1].split(' | ')[0].trim()
            sTime = lines[i+1].split(' | ')[1].trim()
            match.sTime = sTime.slice(0, sTime.indexOf(":") + 3);
            // match.sTime = lines[i+1].split(' | ')[1].trim().slice(0, str.indexOf(":") + 3);
            

            if (match.sDate.includes('.')){
                // match.date = match.date.text.replace(/ /g, ''); // vymaze mezery z datumu
                match.sDate = match.sDate.replaceAll(' ', ''); // vymaze mezery z datumu
            }else{
                match.sDate = dctDnesZitra[match.sDate.toLowerCase()]
            }
            
            match.sTs = createTimestamp(match.sDate, match.sTime)
            
            match.sTeam1Id = ''
            match.sTeam1 = lines[i].split(' - ')[0].replace('(1.z)','').replace('(odv.)','').trim()
            match.sTeam2Id = ''
            match.sTeam2 = lines[i].split(' - ')[1].replace('(1.z)','').replace('(odv.)','').trim()
            
            if (match.sTeam1.includes('PAOK')){
                x=0
            }
            
            fIdentifyIdByTeams(lxdTeams, lxdNewTeams, lxdOddsPortal, 'sTeamTs', match)

            if (lines[i+3] * lines[i+5] * lines[i+7] > 0){
                match.iMargin = 1/lines[i+3] + 1/lines[i+5] + 1/lines[i+7]
            }
            
            match.iOdd1 = Number(lines[i+3])
            //match.odd1X = lines[i+4]
            match.iOddX= Number(lines[i+5])
            //match.odd2X = lines[i+6]
            match.iOdd2 = Number(lines[i+7])

            lxd.push(match);
            i += 7;


        }
    }

    return [lxd, lxdNewTeams];

};

function fProcessOddsPortal(lines) {
    // rawText = document.getElementById('txtOddsPortal').value;
    
    let sLeague = ''
    let sDate = ''
    let sSport = ''
    let sCountry = ''   
    let lxd = []
    let lxdNewOpTeams = []
    let sNextIdForTeam = fGetNextIdForTeam(lxdTeams)
    
    let lstSports=['Football']
    const reTime = /^([0-1]?\d|2[0-3]):[0-5]\d$/;
    
    
    for (let i = 0; i < lines.length; i++) {
        if (lstSports.some(word => lines[i].includes(word)) && lines[i+1]==='/') {
            sSport = lines[i]
            sCountry = lines[i+3]
            sLeague = lines[i+6]
            i+=5
        } else if (lines[i].includes('Today,') && lines[i+1]=='1'){
            sDate = dctDnesZitra.today
            i+=3
        } else if (lines[i].includes('Tomorrow,') && lines[i+1]=='1'){
            sDate = dctDnesZitra.tomorrow
            i+=3
        } else if (reTime.test(lines[i]) && lines[i+1]==''){
            sTime = lines[i]
            if (sDate && sTime){
                sTs = (sDate && sTime) ? createTimestamp(sDate, sTime) : ''
            } else {
                sTs = ''
            }   

        } else if (lines[i]!='' & lines[i]===lines[i+1] && lines[i+2]==='' && lines[i+3]==='–' && lines[i+4]===lines[i+5] &&
            isDecimalOdd(lines[i+7]) && isDecimalOdd(lines[i+9]) &&isDecimalOdd(lines[i+11])){
            let match = {'sBoId': 'Op'};
            match.sId = '' 
            match.sSport = sSport;
            match.sCountry = sCountry;
            match.sLeague = sLeague;
            sKey = sCountry + '|' + sLeague
            //match.sLeagueTS = dctTransLeagues[sKey]
            match.sDate = sDate
            match.sTime = sTime
            match.sTs = sTs
            match.sTeam1Id = ''
            match.sTeam1 = lines[i]
            match.sTeam2Id = ''
            match.sTeam2 = lines[i+4]
            if (match.sTeam1.includes('Guara')){
                x=0
            }
            match.sTeam1Id = fGetValByKeyFromLxd(lxdTeams, 'sTeamOp', match.sTeam1, 'sId') || ''
            match.sTeam2Id = fGetValByKeyFromLxd(lxdTeams, 'sTeamOp', match.sTeam2, 'sId') || ''
            
            if (!match.sTeam1Id) {
                match.sTeam1Id = sNextIdForTeam
                lxdNewOpTeams.push({'sId': sNextIdForTeam, 'sTeamOp': match.sTeam1})}
                sNextIdForTeam = fIncrementId(sNextIdForTeam, 1)
            if (!match.sTeam2Id) {
                match.sTeam2Id = sNextIdForTeam
                lxdNewOpTeams.push({'sId': sNextIdForTeam, 'sTeamOp': match.sTeam2})}
                sNextIdForTeam = fIncrementId(sNextIdForTeam, 1)
                
            match.sId = match.sTs.slice(2,10).replaceAll('-', '') + '-' + 
                match.sTeam1Id + '-' + match.sTeam2Id
        
           
            match.iMargin = 0
            if (lines[i+7]*lines[i+9]*lines[i+11]>0){
                match.iMargin = (1/lines[i+7] + 1/lines[i+9]+ 1/lines[i+11])
            }
            match.iNormOdd1 = lines[i+ 7]*match.iMargin
            match.iNormOddX = lines[i+ 9]*match.iMargin
            match.iNormOdd2 = lines[i+11]*match.iMargin

            lxd.push(match);
            i += 11;
        }
    }
    
    return [lxd, lxdNewOpTeams];
};

function fGetNextIdForTeam(lxd){
    const sIdPrefix = 'f'

    const maxId = lxd.reduce((max, obj) => {
        const idNum = parseInt(obj.sId.slice(1, 10), 10);
        return Math.max(max, isNaN(idNum) ? 0 : idNum);
    }, 0);

    return sIdPrefix + (maxId + 1).toString().padStart(4, '0');
}

function fIncrementId(sId, increment=1){
    const sIdPrefix = sId.slice(0, -4)
    const idNum = parseInt(sId.slice(-4), 10);  
    const newIdNum = idNum + increment;
    return sIdPrefix + newIdNum.toString().padStart(4, '0');
}

function fAppendLxd(lxd, lxdToAppend){
    const sIdPrefix = lxd[0].sId.slice(0, -4);
    const maxId = lxd.reduce((max, obj) => Math.max(max, parseInt(obj.sId.slice(1), 10)), 0);
    lxdToAppend.forEach((obj, index) => {
        obj.sId = sIdPrefix + (maxId + index + 1).toString().padStart(4, '0');
        lxd.push(obj);
     });
     return lxd}

function fProcessAllwyn(lines) {
    let lxd = []
    const lxdOddsPortal = fCsvToLxd(localStorage.getItem('oddsPortal_Matches'))
    
    let lstDays=['Dnes | ', 'Zítra | ']
    let lxdNewTeams = []
    const sBoId = 'Aw'
    let sTeamCol = 'sTeamAw'
    for (let i = 0; i < lines.length; i++) {
        if  (lines[i].includes(' - ') && lstDays.some(word => lines[i+1].includes(word)) && 
            lines[i+3].startsWith('+') &&
            isDecimalOdd(lines[i+5]) && isDecimalOdd(lines[i+9]) &&isDecimalOdd(lines[i+13])) {
            let match = {'sBoId':  sBoId};
            match.sId = ''
            match.sSport = 'Fotbal';
            match.sDate = lines[i+1].split(' | ')[0]
            match.sTime = lines[i+1].split(' | ')[1]
            match.sDate = dctDnesZitra[match.sDate.toLowerCase()]
            match.sTs = createTimestamp(match.sDate, match.sTime)
            
            match.sTeam1Id = ''
            match.sTeam1 = lines[i].split(' - ')[0]
            match.sTeam2Id = ''
            match.sTeam2 = lines[i].split(' - ')[1]
            

            if (match.sTeam1.includes('Stras')){
                x=0
            }

            fIdentifyIdByTeams(lxdTeams, lxdNewTeams, lxdOddsPortal, sTeamCol, match)

            
            match.iMargin = 0
            if (lines[i+5]*lines[i+9]*lines[i+13]>0){
                match.iMargin = (1/lines[i+5] + 1/lines[i+9]+ 1/lines[i+13])
            }
            
            match.iOdd1 = Number(lines[i+5])
            match.iOddX = Number(lines[i+9])
            match.iOdd2 = Number(lines[i+13])

            lxd.push(match);
            i += 13;
        }
    }
    return [lxd, lxdNewTeams];
};

function fProcessBetX(lines) {
    let lxd = []
    const lxdOddsPortal = fCsvToLxd(localStorage.getItem('oddsPortal_Matches'))
    const reTime= fCreateDateTimeRegex('hh:mn')
    const reDate= fCreateDateTimeRegex('dd.mm.yy')
    
    let lxdNewTeams = []
    const sBoId = 'Bx'
    let sTeamCol = 'sTeam'+sBoId
    for (let i = 0; i < lines.length; i++) {
        if  (lines[i].includes(' / ') && lines[i+1]==='1' && lines[i+2]==='X' && lines[i+3]==='2'){
            sCountry = lines[i].split(' / ')[0]
            sLeague = lines[i].split(' / ')[1]
            i+=6    
        }
        else if (reDate.test(lines[i]) && reTime.test(lines[i+1])){
            let match = {'sBoId':  sBoId};
            match.sId = ''
            match.sSport = 'Fotbal';
            match.sDate = lines[i].slice(0, 6) + '20' + lines[i].slice(6)
            match.sTime = lines[i+1]
            match.sTs = createTimestamp(match.sDate, match.sTime)

            match.sTeam1Id = ''
            match.sTeam1 = lines[i+2]
            match.sTeam2Id = ''
            match.sTeam2 = lines[i+3]

            if (match.sTeam1.includes('Stras')){
                x=0
            }

            fIdentifyIdByTeams(lxdTeams, lxdNewTeams, lxdOddsPortal, sTeamCol, match)
            
            match.iMargin = 0
            
            match.iOdd1 = Number(lines[i+4].replace(',','.'))
            match.iOddX = Number(lines[i+5].replace(',','.'))
            match.iOdd2 = Number(lines[i+6].replace(',','.'))

            if (match.iOdd1*match.iOddX*match.iOdd2>0){
                match.iMargin = (1/match.iOdd1 + 1/match.iOddX + 1/match.iOdd2)
            }

            lxd.push(match);
            i += 10;
        }
            
        }
    return [lxd, lxdNewTeams];
};

function fProcessFortuna(lines) {
    let lxd = []
    const lxdOddsPortal = fCsvToLxd(localStorage.getItem('oddsPortal_Matches'))
    // const reTime= fCreateDateTimeRegex('hh:mn')
    // const reDate= fCreateDateTimeRegex('dd.mm.yy')
    let lstDays=['dnes', 'zítra']
    let lxdNewTeams = []
    const sBoId = 'Fn'
    let sTeamCol = 'sTeam'+sBoId
    for (let i = 0; i < lines.length; i++) {
        if  (lines[i]==='ufo-sprt-00.png'){
            sCountry = ''
            sLeague = lines[i+1]
            i+=3
        }
        else if (lstDays.some(word => lines[i].includes(word))){
            sDate = dctDnesZitra[lines[i].split(' ')[0].toLowerCase()]
            sTime = lines[i].split(' ')[1]
            i+=2
        }
        else if (lines[i].startsWith('Výsledek zápasu')){
            let match = {'sBoId':  sBoId};
            match.sId = ''
            match.sSport = 'Fotbal';
            match.sDate = sDate
            match.sTime = sTime
            match.sTs = createTimestamp(match.sDate, match.sTime)

            match.sTeam1Id = ''
            match.sTeam1 = lines[i+1]
            match.sTeam2Id = ''
            match.sTeam2 = lines[i+5]

            if (match.sTeam1.includes('Stras')){
                x=0
            }

            fIdentifyIdByTeams(lxdTeams, lxdNewTeams, lxdOddsPortal, sTeamCol, match)
            
            match.iMargin = 0
            
            match.iOdd1 = Number(lines[i+2])
            match.iOddX = Number(lines[i+4])
            match.iOdd2 = Number(lines[i+6])

            if (match.iOdd1*match.iOddX*match.iOdd2>0){
                match.iMargin = (1/match.iOdd1 + 1/match.iOddX + 1/match.iOdd2)
            }

            lxd.push(match);
            i += 18;
        }
            
        }
    return [lxd, lxdNewTeams];
};

function fProcessMerkur(lines) {
    return [[], []];
};

function fProcessSynot(lines) {
    let lxd = []
    const lxdOddsPortal = fCsvToLxd(localStorage.getItem('oddsPortal_Matches'))
    const reTime= fCreateDateTimeRegex('hh:mn')
    const reDate= fCreateDateTimeRegex('dd.mm.yy')
    let lstDays=['dnes', 'zítra']
    lstSports=['Fotbal']
    let lxdNewTeams = []
    const sBoId = 'Sn'
    let sTeamCol = 'sTeam'+sBoId
    for (let i = 0; i < lines.length; i++) {
        if  (lstSports.some(word => lines[i].includes(word)) && lines[i+1]==='|' && lines[i+2].includes(' / ')==='Fotbal'){
            sCountry = lines[i+2].split(' / ')[0]
            sLeague = lines[i+2].split(' / ')[1]
            i+=2
        }
        else if (lines[i].includes(' - ') && reDate.test(lines[i+1]) && reTime.test(lines[i+2])){
            let match = {'sBoId':  sBoId};
            match.sId = ''
            match.sSport = 'Fotbal';
            match.sDate = lines[i+1].slice(0, 6) + '20' + lines[i+1].slice(6)
            match.sTime = lines[i+2]
            match.sTs = createTimestamp(match.sDate, match.sTime)

            match.sTeam1Id = ''
            match.sTeam1 = lines[i+3]
            match.sTeam2Id = ''
            match.sTeam2 = lines[i+7]

            if (match.sTeam1.includes('Stras')){
                x=0
            }

            fIdentifyIdByTeams(lxdTeams, lxdNewTeams, lxdOddsPortal, sTeamCol, match)
            
            match.iMargin = 0
            
            match.iOdd1 = Number(lines[i+4])
            match.iOddX = Number(lines[i+6])
            match.iOdd2 = Number(lines[i+8])

            if (match.iOdd1*match.iOddX*match.iOdd2>0){
                match.iMargin = (1/match.iOdd1 + 1/match.iOddX + 1/match.iOdd2)
            }

            lxd.push(match);
            i += 9;
        }
            
        }
    return [lxd, lxdNewTeams];
};

function fIdentifyIdByTeams(lxdTeams, lxdNewTeams, lxdOddsPortal, sTeamCol, match){
    let dctNewTeam = null
    let dct1 = lxdTeams.find(d => d[sTeamCol] === match.sTeam1)
    match.sTeam1Id = dct1 ? dct1.sId : ''
    if (!dct1) {
        dct1 = fFindInWholeLxd(lxdTeams, match.sTeam1)
        if (dct1){
            match.sTeam1Id = dct1.sId
            dctNewTeam = {'sDescr':'nalezen v teams1', 'sId': dct1.sId, 'sTeamOp': dct1.sTeamOp}
            dctNewTeam[sTeamCol] = match.sTeam1
        }
    }
    let dct2 = lxdTeams.find(d => d[sTeamCol] === match.sTeam2)
    match.sTeam2Id = dct2 ? dct2.sId : ''
    if (!dct2) {
        dct2 = fFindInWholeLxd(lxdTeams, match.sTeam2)
        if (dct2){
            match.sTeam2Id = dct2.sId
            dctNewTeam = {'sDescr':'nalezen v teams2', 'sId': dct2.sId, 'sTeamOp': dct2.sTeamOp}
            dctNewTeam[sTeamCol] = match.sTeam2
        }
    }

    if (!dct1 && dct2){
        dct1 = lxdOddsPortal.find(d => d.sTeam2Id === match.sTeam2Id)
        if (dct1){
            match.sTeam1Id = dct1.sTeam1Id
            dctNewTeam = {'sDescr':'nalezen v zapasech dle team2', 'sId': match.sTeam1Id, 'sTeamOp': dct1.sTeam1}
            dctNewTeam[sTeamCol] = match.sTeam1
        }
    }
    if (!dct2 && dct1){
        dct2 = lxdOddsPortal.find(d => d.sTeam1Id === match.sTeam1Id)
        if (dct2){
            match.sTeam2Id = dct2.sTeam2Id
            dctNewTeam = {'sDescr':'nalezen v zapasech dle team1', 'sId': match.sTeam2Id, 'sTeamOp': dct2.sTeam2}
            dctNewTeam[sTeamCol] = match.sTeam2
        }
    }
    if (dctNewTeam) lxdNewTeams.push(dctNewTeam)
    match.sTeam1Id = dct1 ? dct1.sId : ''
    match.sTeam2Id = dct2 ? dct2.sId : ''
    
    if (match.sTeam1Id && match.sTeam2Id){
        match.sId = match.sTs.slice(2,10).replaceAll('-', '') + '-' + 
            match.sTeam1Id + '-' + match.sTeam2Id
    }
}
function fInsertNewTeamsToLxd(lxd, lxdNewTeams, sTeamCol){
    if (sTeamCol === 'sTeamOp'){
        lxdNewTeams.forEach(dctNew => {
                lxd.push(dctNew)
        })
    return lxd
    }
    lxdNewTeams.forEach(dctNew => {
        dctExisting = lxd.find(d => d.sId === dctNew.sId)
        if (dctExisting){
            dctExisting[sTeamCol] = dctNew[sTeamCol]
            x=0
        }
    })
    return lxd
}
function fCompareOdds(){
    const iTreshRate = 0.975
    const iTreshOdd = 5
    const lxdOddsPortal = fCsvToLxd(localStorage.getItem('oddsPortal_Matches'))
    let lxdOther = []
    lxdBetOffices.forEach(d => {
        if (d.sName != 'oddsPortal' && localStorage.getItem(d.sName + '_Matches')){
            lxd = fCsvToLxd(localStorage.getItem(d.sName + '_Matches'))
            lxdOther = lxdOther.concat(lxd)
        }
    })

    lxdCompared = []

    lxdOddsPortal.forEach(dctOp =>{
        sId = dctOp.sId
        let lxdFound = []
        // lxdFound.push(dctOp)
        lxdBetOffices.forEach(d => {
            const dctFound = lxdOther.find(dct => dct.sId === sId && dct.sBoId === d.sBoId)
            if (dctFound){
                lxdFound.push(dctFound)
            }   
        })

        if (lxdFound.length > 0){
            const dctMaxOdd1 = fFindMaxByKey(lxdFound, 'iOdd1')
            const dctMaxOddX = fFindMaxByKey(lxdFound, 'iOddX')
            const dctMaxOdd2 = fFindMaxByKey(lxdFound, 'iOdd2')

            dctOp.sBOMaxOdd1 = dctMaxOdd1 ? dctMaxOdd1.sBoId : ''
            dctOp.sColorMaxOdd1 = dctMaxOdd1 ? dctMaxOdd1.sColor : ''
            dctOp.iMaxOdd1 = dctMaxOdd1 ? dctMaxOdd1.iOdd1 : 0
            
            dctOp.sBOMaxOddX = dctMaxOddX ? dctMaxOddX.sBoId : ''
            dctOp.sColorMaxOddX = dctMaxOddX ? dctMaxOddX.sColor : ''
            dctOp.iMaxOddX = dctMaxOddX ? dctMaxOddX.iOddX : 0
            
            dctOp.sBOMaxOdd2 = dctMaxOdd2 ? dctMaxOdd2.sBoId : ''
            dctOp.sColorMaxOdd2 = dctMaxOdd2 ? dctMaxOdd2.sColor : ''
            dctOp.iMaxOdd2 = dctMaxOdd2 ? dctMaxOdd2.iOdd2 : 0

            dctOp.iMargin = 1/dctOp.iMaxOdd1 + 1/dctOp.iMaxOddX + 1/dctOp.iMaxOdd2
            
            
            dctOp.iRate1 = (dctOp.iMaxOdd1-1)/(dctOp.iNormOdd1-1)
            dctOp.iRateX = (dctOp.iMaxOddX-1)/(dctOp.iNormOddX-1)
            dctOp.iRate2 = (dctOp.iMaxOdd2-1)/(dctOp.iNormOdd2-1)
            
            // recommendations
            // dctOp.sRec1 = dctOp.iRate1>iTreshRate && dctOp.iMaxOdd1>iTreshOdd ? 'x' : ''
            // dctOp.sRecX = dctOp.iRateX>iTreshRate && dctOp.iMaxOddX>iTreshOdd ? 'x' : ''
            // dctOp.sRec2 = dctOp.iRate2>iTreshRate && dctOp.iMaxOdd2>iTreshOdd ? 'x' : ''

            
            function fBetVolume(iRate, iBase = 180){
                if (iRate <= iTreshRate) return 0
                iBase = iBase / 30
                return Math.round((iRate - iTreshRate) / (1-iTreshRate) * iBase + iBase)
            }
            function fReverseOdd(iOdd){
                return (0.9/(iOdd-1)+1)
            }
             sRecommendation = ''
            if (dctOp.iRate2>iTreshRate && dctOp.iMaxOdd2>iTreshOdd) sRecommendation = '2: ' + dctOp.sTeam2 + ' (' + dctOp.iMaxOdd2.toFixed(2) + ')  + ' + fBetVolume(dctOp.iRate2) + ' Kč.'
            if (dctOp.iRate1>iTreshRate && dctOp.iMaxOdd1>iTreshOdd) sRecommendation = '1: ' + dctOp.sTeam1 + ' (' + dctOp.iMaxOdd1.toFixed(2) + ')  + ' + fBetVolume(dctOp.iRate1) + ' Kč.'
            if (dctOp.iRateX>iTreshRate && dctOp.iMaxOddX>iTreshOdd) sRecommendation = 'o: Remíza (' + dctOp.iMaxOddX.toFixed(2) + ')  + ' + fBetVolume(dctOp.iRateX) + ' Kč.'
            
            if (dctOp.iRate2>iTreshRate && dctOp.iMaxOdd2<iTreshOdd) sRecommendation = '1o: neprohra ' + dctOp.sTeam1 + ' (' + fReverseOdd(dctOp.iMaxOdd2).toFixed(2) + ')  + ' + fBetVolume(dctOp.iRate2) + ' Kč.'
            if (dctOp.iRate1>iTreshRate && dctOp.iMaxOdd1<iTreshOdd) sRecommendation = 'o2: neprohra ' + dctOp.sTeam2 + ' (' + fReverseOdd(dctOp.iMaxOdd1).toFixed(2) + ')  + ' + fBetVolume(dctOp.iRate1) + ' Kč.'
            if (dctOp.iRateX>iTreshRate && dctOp.iMaxOddX<iTreshOdd) sRecommendation = '12: nebude remíza (' + fReverseOdd(dctOp.iMaxOddX).toFixed(2) + ')  + ' + fBetVolume(dctOp.iRateX) + ' Kč.'
            
            if (sRecommendation){
                sRecommendation = sRecommendation
            }

            dctOp.sRecommendation = sRecommendation.trim()

            // arbitrage
            dctOp.sArb = dctOp.iMargin<1 ? 'x' : ''
            lxdCompared.push(dctOp)
        }
    })

    
    if (lxdCompared.length === 0){
        alert('K porovnání nebylo nic nalezeno.')
    }else{
        //alert(`Bylo porovnáno ${lxdCompared.length} zápasů.`)
        fLxdToLocalStorage(lxdCompared, 'Compared_Matches')
        lxdToView = fModifyToView(lxdCompared)
        renderTable(lxdToView, 'tableContainer');
    }
}
function fModifyToView(lxd){
    return lxd.map(dct => {
        return { 
            'Zeme-cas': dct.sCountry + ' - ' + dct.sLeague + '\n' + dct.sDate + ' ' + dct.sTime,
            'Teamy': dct.sTeam1 + ' - ' + dct.sTeam2,
            'b1': dct.sBOMaxOdd1,
            'v1': dct.iMaxOdd1 ? dct.iMaxOdd1.toFixed(2) : '',
            'b0': dct.sBOMaxOddX,
            'v0': dct.iMaxOddX ? dct.iMaxOddX.toFixed(2) : '',
            'b2': dct.sBOMaxOdd2,
            'v2': dct.iMaxOdd2 ? dct.iMaxOdd2.toFixed(2) : '',
            'r1': dct.iRate1 ? dct.iRate1.toFixed(3) : '',
            'r0': dct.iRateX ? dct.iRateX.toFixed(3) : '',
            'r2': dct.iRate2 ? dct.iRate2.toFixed(3) : '',
            // 'x1': dct.sRec1,
            // 'x0': dct.sRecX,
            // 'x2': dct.sRec2,
            'Arb': dct.sArb,
            'Doporučení': dct.sRecommendation
        }
    })
}

function fFindMaxByKey(lxd, key) {
  return lxd.reduce((maxRow, currentRow) => {
    if (!maxRow) return currentRow;
    return currentRow[key] > maxRow[key] ? currentRow : maxRow;
  }, null);
}
function fShowContentOfLocalStorageInTable(sKey) {
    const content = localStorage.getItem(sKey);
    if (content) {
        const lxd = fCsvToLxd(content);
        renderTable(lxd, 'tableContainer');
    } else {
        alert(`No content found for ${sKey}`);
    }
}



function secondsUntil(commenceTime) {
  const eventMs = new Date(commenceTime).getTime();
  const nowMs = Date.now();
  return Math.floor((eventMs - nowMs) / 1000);
}




function fLxdToCsv(data, lstExtra=[]) {
    if (data.length === 0) return '';
    let headers = Object.keys(data[0]);
    // Přidání extra sloupců do hlavičky, pokud nejsou již obsaženy
    if (lstExtra.length > 0){
        headers = [...new Set([...headers, ...lstExtra])];
    }
  

  const rows = data.map(obj =>
    headers.map(h => `"${fReplaceDotToComma(obj[h])}"`).join(';')
  );

  const csvContent = [headers.join(';'), ...rows].join('\n');

  const BOM = '\uFEFF';

  return (BOM + csvContent)
}

function fDownloadFile(sStorageKey, sCsv='', sFilename=''){
    let csvContent = ''
    if (sStorageKey){
        csvContent = localStorage.getItem(sStorageKey)
    } else if(sCsv) {
        csvContent = sCsv
    }
    
    sFilename = sFilename || sStorageKey
    if (!csvContent){

        alert(`Soubor ${sFilename} nebyl zatím vytvořen`)
        return
    }

    const blob = new Blob([csvContent], {
        type: 'text/csv;charset=utf-8;'
    });

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    sNow = fGetDateFormatted(0,'yymmdd_hhmnss')
    sFilename = (sFilename + '.csv').replace('.csv.csv', '.csv')
        .replace('.csv', '_' + sNow + '.csv')
    link.download = sFilename;
    link.click();
    }

function lxdToTable(lxd, columns, maxTreshold) {
  let html = '<table class="table table-striped">\n';

  // Header
  html += "<thead><tr>";
  columns.forEach(key => {
    html += `<th class="col-${key}">${key}</th>`.replaceAll('Pct', ' %').replaceAll('Frm', '');
  });
  html += "</tr></thead>\n";

  // Body
  html += "<tbody>\n";

  lxd.forEach(row => {
    // if (row.max<maxTreshold) {
    //     x=0;  // skip when i is 2
    // }
    html += "<tr>";
    columns.forEach(key => {
      let value = (row[key] ?? "").replace(/(\d)\.(\d)/g, '$1,$2');
      if (key==='date') value = value.replaceAll(',','.')
      html += `<td class="col-${key}">${value}</td>`;
    });
    html += "</tr>\n";
  });
  html += "</tbody></table>";

  const container = document.getElementById('output');
  container.innerHTML = html;


//   return html;


}
function fShowContentOfLocalStorage(sKey) {
    const content = localStorage.getItem(sKey);
    //alert(`Content of ${sKey}:\n\n` );
    if (content) {
        document.getElementById('output').value = content;
    } else {
        alert(`No content found for ${sKey}`);
    }
}


function renderTable(data, containerId) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';

  if (!data.length) return;

  const table = document.createElement('table');
  table.className = 'niceTable';

  const thead = document.createElement('thead');
  const tbody = document.createElement('tbody');

  const headers = Object.keys(data[0]).map(h => h.replace('MaxOdd', '')); // Add space before capital letters
  let sortDirection = 1;

  // Create header row
  const headerRow = document.createElement('tr');

  headers.forEach(key => {
    const th = document.createElement('th');
    th.textContent = key;
    th.style.cursor = 'pointer';

    th.onclick = () => {
      sortDirection *= -1;

      data.sort((a, b) => {
        const valA = a[key];
        const valB = b[key];

        if (!isNaN(valA) && !isNaN(valB)) {
          return (valA - valB) * sortDirection;
        }

        return valA.toString().localeCompare(valB.toString(), 'cs', { sensitivity: 'base' }) * sortDirection;
      });

      renderTable(data, containerId);
    };

    headerRow.appendChild(th);
  });

  thead.appendChild(headerRow);

  // Create body rows
  data.forEach(row => {
    const tr = document.createElement('tr');

    headers.forEach(key => {
      const td = document.createElement('td');
      td.textContent = row[key];
      tr.appendChild(td);
    });

    tbody.appendChild(tr);
  });

  table.appendChild(thead);
  table.appendChild(tbody);
  container.appendChild(table);
}

function fOpenMultiple() {
  urls = lxdBetOffices.map(d => d.sLinkToday).filter(link => link);
  const linksContainer = document.getElementById('linksContainer');
  linksContainer.innerHTML = ''; // Clear previous links
  let a = document.createElement('a');
  a.target = '_blank';
  urls.forEach(url => {
    let a = document.createElement('a');
    a.target = '_blank';
    
    a.href = url;
    
    a.title = url;
    //document.body.appendChild(a);
    linksContainer.appendChild(a);
    //alert(`Otevírám ${url}`)
    //a.click();
    // document.body.removeChild(a);
  });
}



let currentIndex = 0;

document.getElementById('btnNext').onclick = (e) => {
    const urls = lxdBetOffices.map(d => d.sLinkToday).filter(link => link).reverse();
  if (currentIndex >= urls.length) {
    alert('No more URLs');
    return;
  }

  //window.open(urls[currentIndex], '_blank');
    const a = document.createElement('a');
    a.target = '_blank';
    a.href = urls[currentIndex];
    
    a.title = urls[currentIndex];
    document.body.appendChild(a);
    //linksContainer.appendChild(a);
    //alert(`Otevírám ${url}`)
    a.click();
    document.body.removeChild(a);
  currentIndex++;
};


