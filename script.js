const API_KEY = '8b0f80809ec7a6601c08c5e47abd7eef'; // replace with your key

document.getElementById('loadBtn').addEventListener('click', async () => {
const url = `https://api.the-odds-api.com/v4/sports/upcoming/odds/?regions=eu&markets=h2h&apiKey=${API_KEY}`
//const url = `https://api.the-odds-api.com/v4/sports/soccer_epl/odds/?apiKey=${API_KEY}&regions=eu&markets=h2h&oddsFormat=decimal&dateFormat=iso`;
  try {
    const res = await fetch(url);
    const data = await res.json();

    console.log(data); // inspect JSON in console

    const output = document.getElementById('output');
    output.innerHTML = data.map(event => {
      const teams = `${event.home_team} vs ${event.away_team}`;
      const date = new Date(event.commence_time).toLocaleString();
      let oddsText = '';
      event.bookmakers.forEach(book => {
        oddsText += `${book.title}: `;
        book.markets[0].outcomes.forEach(o => {
          oddsText += `${o.name} ${o.price} `;
        });
        oddsText += '\n';
      });
      return `${teams} | ${date}\n${oddsText}`;
    }).join('\n\n');

  } catch (err) {
    console.error(err);
    alert('Failed to fetch data');
  }
});
