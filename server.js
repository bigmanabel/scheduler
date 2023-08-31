require('dotenv').config();
const express = require('express');
const path = require('path');
const https = require('https');
const app = express();
const { authenticate } = require('@google-cloud/local-auth');
const { google } = require('googleapis');

const SCOPES = ['https://www.googleapis.com/auth/calendar'];
const CREDENTIALS_PATH = path.join(__dirname, 'credentials.json');

app.use(express.json());

async function createMeetingEvent(auth, eventData) {
  const calendar = google.calendar({ version: 'v3', auth });

  const eventStartTime = new Date(eventData.start);
  const eventEndTime = new Date(eventData.end);

  const event = {
    summary: eventData.summary,
    description: eventData.description,
    start: {
      dateTime: eventStartTime.toISOString(),
      timeZone: 'UTC',
    },
    end: {
      dateTime: eventEndTime.toISOString(),
      timeZone: 'UTC',
    },
    conferenceData: {
      createRequest: {
        requestId: Math.random().toString(),
      },
    },
    attendees: eventData.attendees || [],
    transparency: 'transparent',
  };

  try {
    const res = await calendar.events.insert({
      calendarId: 'primary',
      conferenceDataVersion: 1,
      sendNotifications: true,
      resource: event,
    });

    if (res.data.conferenceData && res.data.conferenceData.entryPoints) {
      console.log('Google Meet link:', res.data.conferenceData.entryPoints[0].uri);
    }
  } catch (error) {
    console.error('Error creating meeting:', error.message);
  }
}

app.post('/create-meeting', async (req, res) => {

  const {summary, description, start, end, attendees} = req.body;

  try {
    const eventData = {
      summary,
      description,
      start,
      end,
      attendees: attendees.map(email => ({ email }))
    }

    const client = await authenticate({
      scopes: SCOPES,
      keyfilePath: CREDENTIALS_PATH,
    });
    await createMeetingEvent(client, eventData);

    return res.status(200).json({ 
      status: 200,
      message: 'Meeting created successfully.'
    });
  } catch (error) {
    console.error('Error:', error.message);
    return res.status(500).json({ 
      status: 500,
      error: 'An error occurred while creating the meeting.'
    });
  }
});

const PAYSTACK_SECRET_KEY = process.env.SECRET;

// Create a new subscription plan
app.post('/create-plan', async (req, res) => {
    const { name, amount, interval } = req.body;

    const params = JSON.stringify({
      name,
      interval,
      amount,
    });
  
    const options = {
      hostname: "api.paystack.co",
      port: 443,
      path: "/plan",
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.SECRET}`,
        "Content-Type": "application/json",
      },
    };
  
    const paystackRequest = https.request(options, paystackRes => {
      let data = '';
  
      paystackRes.on('data', (chunk) => {
        data += chunk;
      });
  
      paystackRes.on('end', () => {
        const responseData = JSON.parse(data);
        res.json(responseData);
      });
    }).on('error', error => {
      console.error(error);
      res.status(500).json({ error: 'An error occurred' });
    });
  
    paystackRequest.write(params);
    paystackRequest.end();
});

// Initiate payment for a subscription plan
app.post('/initiate-payment', async (req, res) => {
    const { email, plan, amount } = req.body;

    const requestData = {
      email,
      amount,
      plan
    };
  
    const params = JSON.stringify(requestData);
  
    const options = {
      hostname: 'api.paystack.co',
      port: 443,
      path: '/transaction/initialize',
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.SECRET}`,
        'Content-Type': 'application/json'
      }
    };
  
    const paystackRequest = https.request(options, paystackRes => {
      let data = '';
  
      paystackRes.on('data', (chunk) => {
        data += chunk;
      });
  
      paystackRes.on('end', () => {
        const responseData = JSON.parse(data);
        res.json(responseData);
      });
    }).on('error', error => {
      console.error(error);
      res.status(500).json({ error: 'An error occurred' });
    });
  
    paystackRequest.write(params);
    paystackRequest.end();
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
