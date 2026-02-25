// betstack.js
// import fetch from 'node-fetch';
const fetch = require('node-fetch'); // use require instead of import
const fs = require('fs');

const API_KEY = '919fefe26c35d8dce8c089643b696f017f9b77ada14f8a348d18c31128f231ab'; // replace with your BetStack API key
const BASE_URL = 'https://api.betstack.dev/api/v1/events';

async function getBetstackOdds(league) {
  const url = `${BASE_URL}?league=${league}`;
  const response = await fetch(url, { headers: { 'X-API-Key': API_KEY } });
  const data = await response.json();
  return data;
}

(async () => {
  const odds = await getBetstackOdds('soccer_epl');
  console.log(JSON.stringify(odds, null, 2));
})();
