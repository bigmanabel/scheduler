require('dotenv').config();
const https = require("https");

const params = JSON.stringify({
  name: "Monthly Retainer",

  interval: "monthly",

  amount: 500000,
});

const options = {
  hostname: "api.paystack.co",

  port: 443,

  path: "/plan",

  method: "POST",

  headers: {
    Authorization: `Bearer sk_test_b0a90f910f4f2f2a0cdea7b8f7ed96bb6c5e1ff6',

    "Content-Type": "application/json",
  },
};

const req = https
  .request(options, (res) => {
    let data = "";

    res.on("data", (chunk) => {
      data += chunk;
    });

    res.on("end", () => {
      console.log(JSON.parse(data));
    });
  })
  .on("error", (error) => {
    console.error(error);
  });

req.write(params);

req.end();
