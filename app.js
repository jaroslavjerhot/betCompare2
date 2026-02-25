// const { timeStamp } = require("node:console");

// localStorage.clear()

x=0



const lxdBetOffices = [
    {'name': 'oddsPortal', 'checkPhrase': 'Oddsportal.com', 'notPhrase': 'zápas', 'matchCountBy': '\n/', 
        'linkToday': 'https://www.oddsportal.com/matches/football/' + fGetDateFormatted(0,'YYYYMMDD'), 
        'linkTomorrow':'https://www.oddsportal.com/matches/football/' + fGetDateFormatted(1,'YYYYMMDD')
    },
    {'name': 'allwyn', 'checkPhrase': 'Blog - Allwyn svět', 'notPhrase': '', 'matchCountBy': ' | ',
        'linkToday': 'https://www.allwyn.cz/kurzove-sazky/kurzy/11?timeFilter=TODAY', 
        'linkTomorrow':'https://www.allwyn.cz/kurzove-sazky/kurzy/11?timeFilter=TOMORROW'
    },
    {'name': 'tipsport', 'checkPhrase': 'Tipsport.net a.s.', 'notPhrase': '', 'matchCountBy': ' | ',
        'linkToday': 'https://www.tipsport.cz/kurzy/fotbal-16?timeFilter=form.period.today', 
        'linkTomorrow':'https://www.tipsport.cz/kurzy/fotbal-16?timeFilter=form.period.tomorrow'
    },
]
const dctDnesZitra = {
    'Dnes': fGetDateFormatted(0), 'Zítra': fGetDateFormatted(1),
    'Today': fGetDateFormatted(0), 'Tomorrow': fGetDateFormatted(1),
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
        if (sText.includes(d.checkPhrase) && (d.notPhrase=='' || !sText.includes(d.notPhrase))){
            sName = d.name
            iMatches = (sText.length - sText.replaceAll(d.matchCountBy).length) / d.matchCountBy.length
            //lxdBetOffices[i].iMatches = iMatches
        }
    })

    if (sName){
        alert(`Stažený je z ${sName}. Je v něm odhadem ${iMatches} zápasů.`)
    }else{
        alert('Stažený text nebyl rozpoznán.')
        return
    }
    
    localStorage.setItem(sName+'_Time', new Date());
    localStorage.setItem(sName, sText)
    
    // [sCsv, dctB[sName]] = fProcessText(sName, sText)
}

function fProcessText(sName, sText=''){
    sText = sText || localStorage.getItem(sName);
    if (!sText) return(null, null)

    const lstText = sText
        .split('\n')
        .map(l => l.trim())
        .filter(l => l.length >= 0);

    switch (sName){
        case 'oddsPortal':  lxd = fProcessOddsPortal(lstText); break;
        case 'tipsport':    lxd = fProcessTipsport(lstText); break;
        case 'allwyn':      lxd = fProcessAllwyn(lstText); break;
    }
    csv = fCreateCsv(lxd)
    localStorage.setItem(sName + '_Csv', csv)
    return [csv, lxd]
}

document.addEventListener("DOMContentLoaded", async () => {
const ttt = await fLoadCsv(sTransTeams)
  renderConsole(lxdBetOffices);
});

function renderConsole(lxd) {
  const container = document.getElementById("console");
  
  let html = `<table class="table table-striped table-bordered">
    <thead>
      <tr>
        <th>Name</th>
        <th>Link</th>
        <th>Age</th>
        <th>Počet</th>
        <th>Paste</th>
        <th>Process</th>
        <th>Download</th>
      </tr>
    </thead>
    <tbody>`;

  lxd.forEach((dct, index) => {
    // compute age in seconds
    const [sAge, iAgeS] = ['','']
    const sText = localStorage.getItem(dct.name)
    
    if (sText){
        //[sAge, iAgeS] = getItemAge(dct.name)
        iMatches = (sText.length - sText.replaceAll(dct.matchCountBy,'').length) / dct.matchCountBy.length
    } else {
        iMatches = 0
    }       
    // const age = Math.floor((Date.now() - new Date(dct.date).getTime()) / 1000);
    const ageClass = iAgeS > 3600 ? "age-old" : ""; // older than 1h → red

    htmlLinkToday = dct.linkToday ? `<a href="${dct.linkToday}" target="_blank" class="btn btn-primary btn-sm btn-link">Dnes</a>` : ''
    htmlLinkTomorrow = dct.linkTomorrow ? `<a href="${dct.linkTomorrow}" target="_blank" class="btn btn-primary btn-sm btn-link">Zítra</a>` : ''
        
    html += `<tr>
      <td>${dct.name ?? ""}</td>
      <td>
      ${htmlLinkToday}
      ${htmlLinkTomorrow}
      
      </td>
      <td class="${ageClass}">${sAge}</td>
      <td>${iMatches} zápasů</td>
      <td><button class="btn btn-success btn-sm" onclick="fPasteText('${dct.name}')">Paste</button></td>
      <td><button class="btn btn-warning btn-sm" onclick="fProcessText('${dct.name}')">Process</button></td>
      <td><button class="btn btn-warning btn-sm" onclick="fDownloadFile('${dct.name}')">Download</button></td>
    </tr>`;
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


function clearText(textareaId) {
    document.getElementById(textareaId).value = "";
    localStorage.removeItem(textareaId)
}

function isDecimalOdd(text) {
    return /^\s*\d+\.\d+\s*$/.test(text);
}
function fGetDateFormatted(dateDiff = 0, sFormat) {
    const today = new Date();
    
    // Add dateDiff days
    today.setDate(today.getDate() + dateDiff);
    
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year4 = String(today.getFullYear()); 
    const year2 = year4.slice(-2)
    
    if (sFormat) return sFormat.toLowerCase().replace('dd', `${day}`).replace('mm', `${month}`).replace('yyyy', `${year4}`).replace('yy', `${year2}`)
    return `${day}.${month}.${year4}`;
}

function createTimestamp(dateStr, timeStr) {

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
let rawTextTipsport = ''

function processTipsport() {
    rawTextTipsport = localStorage.getItem('txtTipsport');
    
    const lines = rawTextTipsport
        .split('\n')
        .map(l => l.trim())
        .filter(l => l.length >= 0);

    

    const dctDnesZitra = {'Dnes': fGetDateFormatted(0), 'Zítra': fGetDateFormatted(1)}

    let sLeague = ''
    let lxdTipsport = []

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

            let match = {};
            match.sSport = sSport;
            match.sLeague = sLeague;
            match.team1 = lines[i].split(' - ')[0].replace('(1.z)','').trim()
            match.team2 = lines[i].split(' - ')[1].replace('(1.z)','').trim()
            

            match.date = lines[i+1].split(' | ')[0].trim()
            match.time = lines[i+1].split(' | ')[1].trim()
            
            if (match.date.includes('.')){
                // match.date = match.date.text.replace(/ /g, ''); // vymaze mezery z datumu
                match.date = match.date.replaceAll(' ', ''); // vymaze mezery z datumu
            }else{
                match.date = dctDnesZitra[match.date]
            }
            
            match.timestamp = createTimestamp(match.date, match.time)
            match.odd1 = lines[i+3]
            //match.odd1X = lines[i+4]
            match.oddX= lines[i+5]
            //match.odd2X = lines[i+6]
            match.odd2 = lines[i+7]

            match.odd1Frm = lines[i+3].replace('.', ',')
            //match.odd1XFrm = lines[i+4].replace('.', ',')
            match.oddXFrm= lines[i+5].replace('.', ',')
            //match.odd2XFrm = lines[i+6].replace('.', ',')
            match.odd2Frm = lines[i+7].replace('.', ',')

            if (lines[i+3] * lines[i+5] * lines[i+7] > 0){
                match.margin = Math.round(((1/lines[i+3] + 1/lines[i+5] + 1/lines[i+7])-1)*1000)
            }
            
            lxdTipsport.push(match);
            i += 7;

        }
    }
    //fCreateCsv(lxdTipsport, 'tipsport.csv')
    //renderResults(lxdMatches);
    return lxdTipsport
};

function processBoth(){
    const lxdOP = fProcessOddsPortal()
    const lxdTS = processTipsport()
    let lxdCompared = []
    let lxdToTrans = []
    
    lxdOP.forEach(dctOP => {
        if (dctOP.team1TS) {
            if (dctOP.team1.includes('Boavista')){
                x=0
            }
            lxdTS.forEach(item => {
                if (item.team1.includes('Boavista')){
                x=0
                }
                b1 = (item.team1 === dctOP.team1TS)
                b2 = (item.team2 === dctOP.team2TS)
                b3 = (item.sLeague === dctOP.sLeagueTS) 
                b4 = (item.timestamp == dctOP.timestamp)
                b5 = 0

            })
            let dctTS = lxdTS.find(item =>
                item.team1 === dctOP.team1TS &&
                item.team2 === dctOP.team2TS &&
                item.sLeague === dctOP.sLeagueTS &&
                item.timestamp == dctOP.timestamp
                );
            if (dctTS){
                dctTS.odd1_OP = dctOP.odd1Frm
                dctTS.oddX_OP = dctOP.oddXFrm
                dctTS.odd2_OP = dctOP.odd2Frm
                // dctTS.arbit = 1-(1/Math.max(dctOP.odd1, dctTS.odd1) + 1/Math.max(dctOP.oddX, dctTS.oddX) +
                //     1/Math.max(dctOP.odd2, dctTS.odd2))
                dctTS.rate1Pct = ((dctTS.odd1/dctOP.odd1 - 1)*100)
                dctTS.rateXPct = ((dctTS.oddX/dctOP.oddX - 1)*100)
                dctTS.rate2Pct = ((dctTS.odd2/dctOP.odd2 - 1)*100)
                dctTS.rateMaxPct = Math.max(dctTS.rate1Pct, dctTS.rateXPct, dctTS.rate2Pct)

                if (dctTS.rateMaxPct>-2) {
                    dctTS.rate1Pct = dctTS.rate1Pct.toFixed(1)
                    dctTS.rateXPct = dctTS.rateXPct.toFixed(1)
                    dctTS.rate2Pct = dctTS.rate2Pct.toFixed(1)
                    dctTS.rateMaxPct = dctTS.rateMaxPct.toFixed(1)
                    lxdCompared.push(dctTS)
                }
            }

            dctTS = lxdTS.find(item =>
                (item.team1 === dctOP.team1TS && !(dctOP.team2TS) || 
                 item.team2 === dctOP.team2TS && !(dctOP.team1TS)) &&                
                item.timestamp == dctOP.timestamp
                );
            if (dctTS){
                const dct = {
                    'sCountry': dctOP.sCountry, 'sLeagueTS': dctTS.sLeague, 'timestamp': dctOP.timestamp,
                    'team1OP': dctOP.team1, 
                    'team1TS': dctTS.team1, 
                    'team2OP': dctOP.team2,
                    'team2TS': dctTS.team2,
                    'oddDiff':  Math.abs(dctOP.odd1/dctTS.odd1-1) + 
                                Math.abs(dctOP.oddX/dctTS.oddX-1) + 
                                Math.abs(dctOP.odd2/dctTS.odd2-1)}
                lxdToTrans.push(dct)     
                }

            }})

    // fCreateCsv(lxdOP, 'oddsportal.csv')
    // fCreateCsv(lxdTS, 'tipsport.csv')
    if (lxdToTrans.length>0) fCreateCsv(lxdToTrans, 'toTrans.csv')
    //fCreateCsv(lxdCompared, 'compared.csv')
    //renderResults(lxdCompared)
    const tbl = lxdToTable(lxdCompared,
        ['sSport','sLeague', 'team1' , 'team2', 'date', 'time', 
        'odd1Frm', 'oddXFrm', 'odd2Frm' , 'rate1Pct' , 'rateXPct' , 'rate2Pct', 'rateMaxPct'],
        maxLevel = -2)

    x=0
}

function fProcessOddsPortal(lines) {
    // rawText = document.getElementById('txtOddsPortal').value;
    
    let sLeague = ''
    let lxd = []

    let lstSports=['Football']
    const reTime = /^([0-1]?\d|2[0-3]):[0-5]\d$/;
    
    for (let i = 0; i < lines.length; i++) {
        if (lstSports.some(word => lines[i].includes(word)) && lines[i+1]==='/') {
            sSport = lines[i]
            sCountry = lines[i+3]
            sLeague = lines[i+6]
            i+=5
        } else if (lines[i].includes('Today,') && lines[i+1]=='1'){
            sDate = dctDnesZitra.Today
            i+=3
        } else if (lines[i].includes('Tomorrow,') && lines[i+1]=='1'){
            sDate = dctDnesZitra.Tomorrow
            i+=3
        } else if (reTime.test(lines[i]) && lines[i+1]==''){
            sTime = lines[i]
            sTs = createTimestamp(sDate, sTime)
        } else if (lines[i]!='' & lines[i]===lines[i+1] && lines[i+2]==='' && lines[i+3]==='–' && lines[i+4]===lines[i+5] &&
            isDecimalOdd(lines[i+7]) && isDecimalOdd(lines[i+9]) &&isDecimalOdd(lines[i+11])){
            let match = {};
            match.sSport = sSport;
            match.sCountry = sCountry;
            match.sLeague = sLeague;
            sKey = sCountry + '|' + sLeague
            match.sLeagueTS = dctTransLeagues[sKey]
            match.sDate = sDate
            match.sTime = sTime
            match.sTs = sTs
            match.sTeam1 = lines[i]
            match.sTeam2 = lines[i+4]
            match.sTeam1Id = dctTeamsId[match.sTeam1] || 'xx'
            match.sTeam2Id = dctTeamsId[match.sTeam2] || 'xx'
            match.sId = fGetDateFormatted(0,'yymmdd') + '-' + 
            match.sTeam1Id + '-' + match.sTeam2Id
        
            // match.team1TS = dctTransTeams[match.team1]
            // match.team2TS = dctTransTeams[match.team2]
            
            
            match.iMargin = 0
            if (lines[i+7]*lines[i+9]*lines[i+11]>0){
                match.iMargin = (1/lines[i+7] + 1/lines[i+9]+ 1/lines[i+11])
            }
            match.iOdd1 = lines[i+ 7]*match.iMargin
            match.iOddX = lines[i+ 9]*match.iMargin
            match.iOdd2 = lines[i+11]*match.iMargin

            // match.margin2 = (1/match.odd1 + 1/match.oddX+ 1/match.odd2)
            
            // match.odd1Frm = lines[i+7].replace('.', ',')
            // match.oddXFrm= lines[i+9].replace('.', ',')
            // match.odd2Frm = lines[i+11].replace('.', ',')

            lxd.push(match);
            i += 11;
        }
    }
    
    // if (lxd){
    //     fCreateCsv(lxd, 'oddsPortal.csv')
    // } else {
    //     alert('Nic se nepodarilo stahnout.')
    // }
    //renderResults(lxdMatches);
    return lxd
};
function processAllwyn() {
    rawText = localStorage.getItem('txtAllwyn');
    
    const lines = rawText
        .split('\n')
        .map(l => l.trim())
        .filter(l => l.length >= 0);

    const dctDnesZitra = {'Dnes': fGetDateFormatted(0), 'Zítra': fGetDateFormatted(1)}

    let lxd = []

    let lstDays=['Dnes | ', 'Zítra | ']
    
    for (let i = 0; i < lines.length; i++) {
        if  (lines[i].includes(' - ') && lstDays.some(word => lines[i+1].includes(word)) && 
            lines[i+3].startsWith('+') &&
            isDecimalOdd(lines[i+5]) && isDecimalOdd(lines[i+9]) &&isDecimalOdd(lines[i+13])) {
            let match = {};
            match.sSport = 'Fotbal';
            match.sTeam1_AW = lines[i].split(' - ')[0]
            match.sTeam2_AW = lines[i].split(' - ')[1]
            match.sDate = lines[i+1].split(' | ')[0]
            match.sTime = lines[i+1].split(' | ')[1]
            match.sDate = dctDnesZitra[match.sDate]
                        
            match.sTeam1_OP = dctTransTeams2[match.sTeam1_AW]
            match.sTeam2_OP = dctTransTeams2[match.sTeam2_AW]

            // if (!match.sTeam1_TS) match.sTeam1_TS = dctTransTeams[match.sTeam1_AW]
            // if (!match.sTeam2_TS) match.sTeam2_TS = dctTransTeams[match.sTeam2_AW]
            
            match.sTimestamp = createTimestamp(match.sDate, match.sTime)
            
            match.odd1_AW = Number(lines[i+5])
            match.oddX_AW= Number(lines[i+9])
            match.odd2_AW = Number(lines[i+13])

            lxd.push(match);
            i += 13;
        }
    }
    if (lxd.length>0){
       fCreateCsv(lxd, 'oddsPortal.csv')
    } else {
        alert('Nic se nepodarilo stahnout.')
    }

    return lxd
};

function secondsUntil(commenceTime) {
  const eventMs = new Date(commenceTime).getTime();
  const nowMs = Date.now();
  return Math.floor((eventMs - nowMs) / 1000);
}

let jsonTheOdds = ''

function processTheOdds() {
    jsonTheOdds = document.getElementById('txtInputTheOdds').value;
    let lxd = []
    try {
        lxd = JSON.parse(jsonTheOdds)    
    }
    catch (error) {
        alert("JSON is invalid:\n\n" +  error.message);
    }

    let lxdOutTheOdds = []

    lxd.forEach(match => {
        // if (true){
        if (match.sport_key.includes('soccer') && secondsUntil(match.commence_time)!=0){

            const sHomeTeam = match.home_team
            const sAwayTeam = match.away_team
            
            let dctOdds = {}
            dctOdds[sHomeTeam]=0
            dctOdds[sAwayTeam]=0
            dctOdds['Draw']=0
            
            if (match.bookmakers.length){
                match.bookmakers.forEach(bk => {
                    if (bk.markets[0].key === 'h2h'){
                        bk.markets[0].outcomes.forEach(out => {
                            dctOdds[out.name] += out.price
                        })
                    }
                })
                iAvgOdd1 = dctOdds[sHomeTeam]/match.bookmakers.length
                iAvgOddX = dctOdds['Draw']/match.bookmakers.length
                iAvgOdd2 = dctOdds[sAwayTeam]/match.bookmakers.length
                const iMargin = 1/iAvgOdd1 + 1/iAvgOddX + 1/iAvgOdd2
                iAvgOdd1 *= iMargin
                iAvgOddX *= iMargin
                iAvgOdd2 *= iMargin
                
                lxdOutTheOdds.push({
                    'sport_key': match.sport_key,
                    'sport_title': match.sport_title,
                    'commence_time': match.commence_time,
                    'home_team': match.home_team,
                    'away_team': match.away_team,
                    'odd1': iAvgOdd1.toString().replace('.', ','),
                    'oddX': iAvgOddX.toString().replace('.', ','),
                    'odd2': iAvgOdd2.toString().replace('.', ','),
                    'margin': Math.round((iMargin-1)*1000)
                })
            }
                
        }
    })
    fCreateCsv(lxdOutTheOdds, 'theOdds.csv')
    
    x=0
    //renderResults(lxdMatches);
};

function replaceDotToComma(str){
    if (!str) return ''
    if (typeof str != "number") return str
    return str.toString().replace('.',',')}
    // iCommas = str.length - str.replaceAll('.','').length
    // if (iCommas != 1) return(str)
    // return str.replace(/(\d+)\.(\d+)/g, '$1,$2')}

function fCreateCsv(data, filename='') {
  const headers = Object.keys(data[0]);

  const rows = data.map(obj =>
    headers.map(h => `"${replaceDotToComma(obj[h])}"`).join(';')
  );

  const csvContent = [headers.join(';'), ...rows].join('\n');

  const BOM = '\uFEFF';

  return (BOM + csvContent)
}

function fDownloadFile(sName, sFilename=''){
    const csvContent = localStorage.getItem(sName+'_Csv')
    sFilename = sFilename || sName + '.csv';
    if (!csvContent){

        alert(`Soubor ${sFilename} nebyl zatím vytvořen`)
        return
    }

    const blob = new Blob([csvContent], {
        type: 'text/csv;charset=utf-8;'
    });

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
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

function renderResults(matches) {

    const container = document.getElementById('output');
    container.innerHTML = '';

    if (matches.length === 0) {
        container.innerHTML = '<div class="alert alert-warning">No matches detected.</div>';
        return;
    }

    matches.forEach(m => {

        const card = document.createElement('div');
        card.className = 'card match-card';

        card.innerHTML = `
            <div class='card-body'>
                <h5 class='card-title'>${m.team1} - ${m.team2}</h5>
                <p class='text-muted'>${m.date} ${m.time}</p>

                
                <ul class='list-group'>
                    <li class='list-group-item'>${m.odd1Frm}</li>
                </ul>
            </div>
        `;

        container.appendChild(card);
    });
    x=0
    // ${m.odds.map(o => `<li class='list-group-item'>${o}</li>`).join('')}
}
