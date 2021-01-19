const express = require("express");
const https = require("https");
const bodyParser = require("body-parser");
const app = express();

app.use(bodyParser.urlencoded({
  extended: false
}));
app.use(bodyParser.json());

app.get("/api/rates", function(req, res) {
  const base = req.query.base;
  const currency = req.query.currency;

  const url = `https://api.exchangeratesapi.io/latest?base=${base}&currency=${currency}`;

  https.get(url, async function(response) {
    const {
      statusCode
    } = response;
    const contentType = response.headers['content-type'];
    let error;
    if (statusCode !== 200) {
      error = new Error('Request Failed.\n' +
        `Status Code: ${statusCode}`);
    } else if (!/^application\/json/.test(contentType)) {
      error = new Error('Invalid content-type.\n' +
        `Expected application/json but received ${contentType}`);
    }
    if (error) {
      console.error(error.message);
      // Consume response data to free up memory
      response.resume();
      return;
    }

    let rawData = '';
    response.on('data', (chunk) => {
      rawData += chunk;
    });
    response.on('error', (e) => {
      console.error(`Got error: ${e.message}`);
    }).on('end', async () => {
      try {
        const parsedData = JSON.parse(rawData);
        const setObj = JSON.stringify({
          result: {
            base: parsedData.base,
            date: parsedData.date,
            rates: {
              EUR: parsedData.rates.EUR,
              GBP: parsedData.rates.GBP,
              USD: parsedData.rates.USD
            }
          }
        });

        await res.status(200).send(setObj)
      } catch (error) {
        console.error(error.message);
      };
    })
  });
})

app.listen(process.env.PORT || 3000, () => {
  console.log("Server is Running")
})
