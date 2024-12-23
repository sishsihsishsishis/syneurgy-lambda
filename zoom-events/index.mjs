import * as configEnv from "./config.mjs";
import crypto from "crypto";
import * as utils from "./utils.mjs";
import * as queryFunction from "./query.mjs";

const zoomWebhookSecret = configEnv.zoomWebhookSecret;
export const handler = async (event) => {
  console.log("Received Zoom event:", JSON.stringify(event, null, 2));
  const client = utils.parseAndCheckHttpError(await utils.getDBInstance());
  try {
    // CORS Preflight
    if (event?.requestContext?.http?.method === "OPTIONS") {
      return {
        statusCode: 200,
        headers: configEnv.headers,
        body: "",
      };
    }

    // Parse the event body
    const body = JSON.parse(event.body);

    // Verify the Zoom Webhook signature
    const timestamp = event.headers["x-zm-request-timestamp"];
    const zoomSignature = event.headers["x-zm-signature"];

    if (!timestamp || !zoomSignature) {
      console.error("Missing Zoom signature or timestamp");
      return {
        statusCode: 400,
        headers: configEnv.headers,
        body: JSON.stringify({ message: "Invalid request" }),
      };
    }

    const message = `v0:${timestamp}:${JSON.stringify(body)}`;
    const computedSignature = `v0=${crypto
      .createHmac("sha256", zoomWebhookSecret)
      .update(message)
      .digest("hex")}`;

    if (zoomSignature !== computedSignature) {
      console.error("Signature verification failed");
      return {
        statusCode: 403,
        headers: configEnv.headers,
        body: JSON.stringify({ message: "Unauthorized" }),
      };
    }

    if (body?.event === "endpoint.url_validation") {
      console.log("Handling Zoom URL validation");

      const plainToken = body.payload.plainToken;
      const encryptedToken = crypto
        .createHmac("sha256", zoomWebhookSecret)
        .update(plainToken)
        .digest("hex");
      // Respond with the encrypted token
      return {
        statusCode: 200,
        body: JSON.stringify({
          plainToken: plainToken,
          encryptedToken: encryptedToken,
        }),
      };
    }

    // Check if the event is 'recording.completed'
    if (body.event === "recording.completed") {
      console.log("Processing Recording.Completed event");

      const hostEmail = body.payload.object.host_email;
      const zoomShareUrl = body.payload.object.share_url;

      const users = await queryFunction.users(client, {
        command: "get-users-by-zoom-email",
        filters: { email: hostEmail },
      });
      const userData = users?.rows[0];
      if (!userData) {
        console.log(`User with email '${hostEmail}' not found.`);

        return {
          statusCode: 404,
          headers: configEnv.headers,
          body: JSON.stringify({
            error: `User with email '${hostEmail}' not found.`,
          }),
        };
      }
      let teamId1 = 0;
      if (hostEmail === "erwin.valencia@gmail.com") {
        teamId1 = 35;
      } else {
        const teamIds = await queryFunction.teams(client, {
          command: "get-teamIds-by-id",
          filters: { user_id: userData.id },
        });
        const teamId = teamIds?.rows[0];
        console.log('teamId~~~', teamId);
        if (!teamId) {
          console.log(`there is no team with this userId ${userData.id}`);

          return {
            statusCode: 404,
            headers: configEnv.headers,
            body: JSON.stringify({
              error: `there is no team with this userId ${userData.id}`,
            }),
          };
        }

        console.log("teamId~~~", teamId);
        teamId1 = teamId;
      }

      const meetingName = body.payload.object.topic;
      const meetingType = "Creative";
      const timestamp = new Date(body.payload.object.start_time).getTime();
      try {
        const data = await axios.post(
          "http://18.144.11.243:8080/video/upload",
          {
            teamId: teamId1,
            meetingUrl: zoomShareUrl,
            meetingName: meetingName,
            meetingType: meetingType,
            videoCreationTime: timestamp,
          }
        );
        console.log("data~~~", data);
        console.log(`Successfully uploaded ${teamId1}`);
      } catch (error) {
        console.error(`Failed to upload ${teamId1}:`, error);
      }

      return {
        statusCode: 200,
        headers: configEnv.headers,
        body: JSON.stringify({ message: "Recording processed successfully" }),
      };
    }

    // Default response for unsupported events
    console.log("Unsupported Zoom event");
    return {
      statusCode: 400,
      headers: configEnv.headers,
      body: JSON.stringify({ message: "Unsupported event" }),
    };
  } catch (error) {
    console.error("Error processing Zoom event:", error);
    return {
      statusCode: 500,
      headers: configEnv.headers,
      body: JSON.stringify({ message: "Internal Server Error" }),
    };
  }
};
