const fs = require("fs").promises;
const path = require("path");
const process = require("process");
const { authenticate } = require("@google-cloud/local-auth");
const { google } = require("googleapis");

// If modifying these scopes, delete token.json.
const SCOPES = [
  "https://www.googleapis.com/auth/calendar.readonly",
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/calendar.events.readonly",
  "https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/calendar.settings.readonly",
//   "https://www.googleapis.com/auth/calendar.settings",
];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = path.join(process.cwd(), "token.json");
const CREDENTIALS_PATH = path.join(process.cwd(), "credentials.json");

/**
 * Reads previously authorized credentials from the save file.
 *
 * @return {Promise<OAuth2Client|null>}
 */
async function loadSavedCredentialsIfExist() {
  try {
    const content = await fs.readFile(TOKEN_PATH);
    const credentials = JSON.parse(content);
    return google.auth.fromJSON(credentials);
  } catch (err) {
    return null;
  }
}

/**
 * Serializes credentials to a file compatible with GoogleAUth.fromJSON.
 *
 * @param {OAuth2Client} client
 * @return {Promise<void>}
 */
async function saveCredentials(client) {
  const content = await fs.readFile(CREDENTIALS_PATH);
  const keys = JSON.parse(content);
  const key = keys.installed || keys.web;
  const payload = JSON.stringify({
    type: "authorized_user",
    client_id: key.client_id,
    client_secret: key.client_secret,
    refresh_token: client.credentials.refresh_token,
  });
  await fs.writeFile(TOKEN_PATH, payload);
}

/**
 * Load or request or authorization to call APIs.
 *
 */
async function authorize() {
  let client = await loadSavedCredentialsIfExist();
  if (client) {
    return client;
  }
  client = await authenticate({
    scopes: SCOPES,
    keyfilePath: CREDENTIALS_PATH,
  });
  if (client.credentials) {
    await saveCredentials(client);
  }
  return client;
}

/**
 * Lists the next 10 events on the user's primary calendar.
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
// async function listEvents(auth) {
//   const calendar = google.calendar({ version: "v3", auth });
//   const res = await calendar.events.list({
//     calendarId: "primary",
//     timeMin: new Date().toISOString(),
//     maxResults: 10,
//     singleEvents: true,
//     orderBy: "startTime",
//   });
//   const events = res.data.items;
//   if (!events || events.length === 0) {
//     console.log("No upcoming events found.");
//     return;
//   }
//   console.log("Upcoming 10 events:");
//   events.map((event, i) => {
//     const start = event.start.dateTime || event.start.date;
//     console.log(`${start} - ${event.summary}`);
//   });
// }

// authorize().then(listEvents).catch(console.error);


/**
 * Create a new event with a Google Meet link.
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
// async function createMeetingEvent(auth) {
//   const calendar = google.calendar({ version: "v3", auth });

//   const eventStartTime = new Date();
//   eventStartTime.setMinutes(eventStartTime.getMinutes() + 30); // Schedule the meeting 30 minutes from now
//   const eventEndTime = new Date(eventStartTime.getTime() + 60 * 60 * 1000); // Meeting duration: 1 hour

//   const event = {
//     summary: "Google Meet Event",
//     description: "Meeting description here",
//     start: {
//       dateTime: eventStartTime.toISOString(),
//       timeZone: "UTC", // Adjust this based on your timezone
//     },
//     end: {
//       dateTime: eventEndTime.toISOString(),
//       timeZone: "UTC", // Adjust this based on your timezone
//     },
//     conferenceData: {
//       createRequest: {
//         requestId: Math.random().toString(), // Generate a unique request ID
//       },
//     },
//   };

//   try {
//     const res = await calendar.events.insert({
//       calendarId: "primary",
//       conferenceDataVersion: 1,
//       resource: event,
//     });

//     console.log("Meeting created:", res.data.htmlLink);
//     if (res.data.conferenceData && res.data.conferenceData.entryPoints) {
//       console.log(
//         "Google Meet link:",
//         res.data.conferenceData.entryPoints[0].uri
//       );
//     }
//   } catch (error) {
//     console.error("Error creating meeting:", error.message);
//   }
// }

// Call the createMeetingEvent function after authorization
// authorize().then(createMeetingEvent).catch(console.error);

/**
 * Create a new event with Google Meet details and invitees.
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
async function createMeetingEvent(auth) {
  const calendar = google.calendar({ version: 'v3', auth });

  const eventStartTime = new Date();
  eventStartTime.setMinutes(eventStartTime.getMinutes() + 30); // Schedule the meeting 30 minutes from now
  const eventEndTime = new Date(eventStartTime.getTime() + 60 * 60 * 1000); // Meeting duration: 1 hour

  const event = {
    summary: 'Meeting with Google Meet',
    description: 'Meeting description here',
    start: {
      dateTime: eventStartTime.toISOString(),
      timeZone: 'UTC', // Adjust this based on your timezone
    },
    end: {
      dateTime: eventEndTime.toISOString(),
      timeZone: 'UTC', // Adjust this based on your timezone
    },
    conferenceData: {
      createRequest: {
        requestId: Math.random().toString(), // Generate a unique request ID
      },
    },
    attendees: [
      { email: 'barnabassampawin@gmail.com' }, // Add your invitees' email addresses
      { email: 'a81703478@gmail.com' },
    ],
  };

  try {
    const res = await calendar.events.insert({
      calendarId: 'primary',
      conferenceDataVersion: 1,
      sendNotifications: true, // Sends out email notifications to attendees
      resource: event,
    });

    console.log('Meeting created:', res.data.htmlLink);
    if (res.data.conferenceData && res.data.conferenceData.entryPoints) {
      console.log('Google Meet link:', res.data.conferenceData.entryPoints[0].uri);
    }
  } catch (error) {
    console.error('Error creating meeting:', error.message);
  }
}

// Call the createMeetingEvent function after authorization
authorize().then(createMeetingEvent).catch(console.error);
