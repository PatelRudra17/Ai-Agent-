const { google } = require('googleapis');

let oauth2Client;

const getOAuth2Client = () => {
  if (oauth2Client) return oauth2Client;

  oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  return oauth2Client;
};

// Generate auth URL for admin to authorize
const getAuthUrl = () => {
  const client = getOAuth2Client();
  return client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/calendar'],
  });
};

// Exchange code for tokens
const setTokensFromCode = async (code) => {
  const client = getOAuth2Client();
  const { tokens } = await client.getToken(code);
  client.setCredentials(tokens);
  return tokens;
};

// Set tokens directly
const setTokens = (tokens) => {
  const client = getOAuth2Client();
  client.setCredentials(tokens);
};

// Create calendar event
const createEvent = async ({ title, description, startTime, durationMinutes, attendeeEmails }) => {
  const client = getOAuth2Client();
  const calendar = google.calendar({ version: 'v3', auth: client });

  const startDate = new Date(startTime);
  const endDate = new Date(startDate.getTime() + durationMinutes * 60000);

  const event = {
    summary: title,
    description,
    start: { dateTime: startDate.toISOString(), timeZone: 'Asia/Kolkata' },
    end: { dateTime: endDate.toISOString(), timeZone: 'Asia/Kolkata' },
    attendees: attendeeEmails.map((email) => ({ email })),
    conferenceData: {
      createRequest: {
        requestId: `meet-${Date.now()}`,
        conferenceSolutionKey: { type: 'hangoutsMeet' },
      },
    },
  };

  try {
    const result = await calendar.events.insert({
      calendarId: 'primary',
      resource: event,
      conferenceDataVersion: 1,
      sendUpdates: 'all',
    });

    return {
      eventId: result.data.id,
      meetLink: result.data.hangoutLink || result.data.conferenceData?.entryPoints?.[0]?.uri,
      htmlLink: result.data.htmlLink,
    };
  } catch (error) {
    console.error('Google Calendar error:', error.message);
    // Return null if calendar not configured — meetings still work without it
    return null;
  }
};

// Delete calendar event
const deleteEvent = async (eventId) => {
  try {
    const client = getOAuth2Client();
    const calendar = google.calendar({ version: 'v3', auth: client });
    await calendar.events.delete({ calendarId: 'primary', eventId });
  } catch (error) {
    console.error('Failed to delete calendar event:', error.message);
  }
};

// Update calendar event
const updateEvent = async (eventId, { title, startTime, durationMinutes }) => {
  try {
    const client = getOAuth2Client();
    const calendar = google.calendar({ version: 'v3', auth: client });

    const startDate = new Date(startTime);
    const endDate = new Date(startDate.getTime() + durationMinutes * 60000);

    await calendar.events.patch({
      calendarId: 'primary',
      eventId,
      resource: {
        summary: title,
        start: { dateTime: startDate.toISOString(), timeZone: 'Asia/Kolkata' },
        end: { dateTime: endDate.toISOString(), timeZone: 'Asia/Kolkata' },
      },
      sendUpdates: 'all',
    });
  } catch (error) {
    console.error('Failed to update calendar event:', error.message);
  }
};

module.exports = {
  getAuthUrl,
  setTokensFromCode,
  setTokens,
  createEvent,
  deleteEvent,
  updateEvent,
};
