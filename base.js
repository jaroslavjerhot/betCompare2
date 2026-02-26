const sTransTeams = 'https://raw.githubusercontent.com/jaroslavjerhot/betCompare2/main/data/transTeams.csv'



async function fLoadCsv(url) {
    url = url || sButtonsListUrl
        // const res = await fetch(url)
        // return await res.text()
    const resp = await fetch(url)
    const buffer = await resp.arrayBuffer()

    let text = new TextDecoder('utf-8').decode(buffer)
    text = text.replace(/^\uFEFF/, '')
    return text
}

function fCsvToLxd(csvText) {
  
  const lines = csvText
    .trim()
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean);

  if (lines.length < 2) return [];

  const headers = lines[0].split(';').map(h => h.trim());
  

  return lines.slice(1).map(line => {
    const values = line.split(';').map(v => fReplaceCommaToDot(v.replace(/^"(.*)"$/, '$1')));
    const obj = {};

    headers.forEach((header, i) => {
      obj[header] = values[i] ?? '';
    });

    return obj;
  });
}

function fReplaceDotToComma(str){
    if (!str) return ''
    if (typeof str != "number") return str
    return str.toString().replace('.',',')}

function fReplaceCommaToDot(str){
    if (!str) return ''
    const iStr = Number(str.replace(',','.'))
    if (iStr===iStr) return iStr
    return str.trim()}



function fCsvToGroupedLxd(csvText) {
    const lines = csvText.trim().split('\n')
    const sSep = ';'
    const headers = lines.shift().split(sSep)

    const result = {}

    for (const line of lines) {
        const values = line.split(sSep)
        const row = {}

        headers.forEach((h, i) => {
            row[h] = values[i]?.trim()
        })

        const group = row.sLxdName
        delete row.sLxdName

        if (!result[group]) result[group] = []
        result[group].push(row)
    }

    return result
}

function fGetIdsFromLxd(lxd) {
    const result = {}
    Object.entries(lxd).forEach(([group, lst]) => {
      i=0
      result[group]={}
      lxd[group].forEach((dct) => {
          result[group][dct.sId] = i
          i++
      })
    })
      
    return result
}

let dctStartForm = 
    {   sSearchText: 'Česko',
        bTranslate: false,
        btnCountry: 0,
        btnTime: 0,
        btnMedia: 0,
        btnOutput: 0,
    }

const dctFormKeys = Object.keys(dctStartForm);

function fGetDctFromLocStorage(lstKeys, btns) {
    const result = {}
    lstKeys.forEach(key => {
        const value = localStorage.getItem(key)
        if (value){
            result[key] = value
        }else if (key.slice(0,3) === 'btn'){
            result[key] = btns[key][dctStartForm[key]].sId
        }else{
            result[key] = dctStartForm[key]
        }
    })
    return result
}

function fSetDctToLocStorage(dct) {
    Object.entries(dct).forEach(([key, value]) => {
        localStorage.setItem(key, value)
    })
}

function fGetDctById(lxd, sId) {
    let dct = {}
    const lstId = sId.split('-')
    dct = lxd[lstId[0]].find(d => d.sId === sId)
    return dct
}

function getStoredList(sStorageKey) {
  return (localStorage.getItem(sStorageKey) || '')
    .split('|')
    .map(v => v.trim())
    .filter(Boolean)
}

function appendStoredList(sToAppend, sStorageKey) {
  const lst = getStoredList(sStorageKey)
  if (!lst.includes(sToAppend)) {
    lst.push(sToAppend)
    localStorage.setItem(sStorageKey, lst.join('|'))
  }
}

function clearStoredList(sStorageKey) {
  localStorage.removeItem(sStorageKey)
}

function getAllStored(sFilter = '') {
  const data = {};

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key.includes(sFilter)){
      const value = localStorage.getItem(key);

      try {
        data[key] = JSON.parse(value);
      } catch {
        data[key] = value;
      }
    }
  }

  return data;
}

function removeAllStored() {
  // Clear all localStorage
localStorage.clear();

// Reload the page
location.reload();

  // const len = localStorage.length;
  // for (let i = 0; i < len; i++) {
  //   localStorage.removeItem(localStorage.key(i));
  // }
}


function getLastWeekDay(iWeekDayNum) {
  const today = new Date();
  const day = today.getDay(); // 0 = Sunday

  const diff = day === 0 ? 7 : day;
  const lastWeekDay = new Date(today);
  lastWeekDay.setDate(today.getDate() - diff -7 + iWeekDayNum);

  return lastWeekDay;
}

function formatGoogleDate(date) {
  const m = date.getMonth() + 1;   // Months are 0-based
  const d = date.getDate();
  const y = date.getFullYear();

  return `${m}/${d}/${y}`;
}

function getUrlParams() {
    const params = {};
    const queryString = window.location.search.substring(1); // remove '?'
    if (!queryString) return {};
    queryString.split("&").forEach(pair => {
        const [key, value] = pair.split("=");
        if (key) {
            params[key] = decodeURIComponent(value.replace(/\+/g, " "));
            if (key === 'm') {
                params.mExt = params.m.split(".").pop().toLowerCase();
                switch(params.mExt) {
                  case 'cz': params.mLang = 'cs'; break;
                  case 'uk': params.mLang = 'en'; break;
                  default: params.mLang = params.mExt;
                }
              }
        }
    });
    return params;
}

function fConvertDMY(text) {
  // Remove any whitespace
  text = text.trim();

  // Split by dot
  const parts = text.split('.');
  if (parts.length !== 3) return null;

  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1; // JS months: 0 = Jan
  const year = parseInt(parts[2], 10);

  // Create date
  const date = new Date(year, month, day);

  // Validate
  if (date.getFullYear() === year &&
      date.getMonth() === month &&
      date.getDate() === day) {
    return date; // valid
  }

  return null; // invalid
}

function fGetValByKeyFromLxd(lxd, sKeyName, xKey, sValName='dct'){
  dct = lxd.find(c => c[sKeyName].trim() === xKey.trim())
  if (!dct) return null
  if (sValName === 'dct') return dct
  return dct[sValName]
}
