import postmark from "postmark";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcryptjs";
import * as configEnv from "./config.mjs";

const postmarkToken = configEnv.postmarkToken;
const fromEmail = configEnv.fromEmail;
const frontendBaseUrl = configEnv.frontendBaseUrl;
const confirmEmailID = configEnv.confirmEmailID;
const client = new postmark.ServerClient(postmarkToken);
const funnelAccountMinutes = configEnv.funnelAccountMinutes;

const sendTemplateEmailWithPostmark = async (
  toEmail,
  templateId,
  templateModel
) => {
  try {
    const response = await client.sendEmailWithTemplate({
      From: fromEmail,
      To: toEmail,
      TemplateId: templateId,
      TemplateModel: templateModel,
    });
    console.log("Email sent successfully:", response);
  } catch (error) {
    console.error("Failed to send email:", error);
    throw new Error("Failed to send email");
  }
};
export const addMoreMinutes = async (db, email, minutesToAdd) => {
  try {
    // Convert email to lowercase and encode password
    const lowercasedEmail = email.toLowerCase();
    const checkUserQuery = `SELECT id FROM users WHERE email = $1`;
    const userResult = await db.query(checkUserQuery, [lowercasedEmail]);
    if (userResult.rows.length > 0) {
      const uId = userResult.rows[0].id;
      console.log("User already exists with this email:", lowercasedEmail);
      // Update the user_minutes table
      const updateMinutesQuery = `
        UPDATE user_minutes 
        SET added_minutes = added_minutes + $2 
        WHERE user_id = $1
      `;
      await db.query(updateMinutesQuery, [uId, minutesToAdd]);

      console.log("Added 90 minutes to user with ID:", uId);
    }
  } catch (error) {
    console.error("Error in createUserAndSendEmail:", error);
    throw new Error("User creation or email sending failed");
  }
};

export const addInitMinutes = async (db, email, minutesToAdd) => {
  try {
    // Convert email to lowercase and encode password
    const lowercasedEmail = email.toLowerCase();
    const checkUserQuery = `SELECT id FROM users WHERE email = $1`;
    const userResult = await db.query(checkUserQuery, [lowercasedEmail]);
    if (userResult.rows.length > 0) {
      const uId = userResult.rows[0].id;
      console.log("User already exists with this email:", lowercasedEmail);
      // Update the user_minutes table
      const updateMinutesQuery = `
        UPDATE user_minutes 
        SET all_minutes = all_minutes + $2 
        WHERE user_id = $1
      `;
      await db.query(updateMinutesQuery, [uId, minutesToAdd]);

      console.log("Added 90 minutes to user with ID:", uId);
    }
  } catch (error) {
    console.error("Error in createUserAndSendEmail:", error);
    throw new Error("User creation or email sending failed");
  }
};

export const resetMinutes = async (db, email, initial_minutes) => {
  try {
    // Convert email to lowercase
    const lowercasedEmail = email.toLowerCase();
    const checkUserQuery = `SELECT id FROM users WHERE email = $1`;
    const userResult = await db.query(checkUserQuery, [lowercasedEmail]);
    console.log("userResult~~~", userResult);

    if (userResult.rows.length > 0) {
      const uId = userResult.rows[0].id;
      console.log("User exists with this email:", lowercasedEmail);
      if (initial_minutes === 0) {
        // Update the user_minutes table to set all_minutes to 0
        const resetMinutesQuery = `
        UPDATE user_minutes 
        SET all_minutes = $2 
        WHERE user_id = $1
        `;
        await db.query(resetMinutesQuery, [uId, initial_minutes]);
        console.log("Set all_minutes to 0 for user with ID:", uId);
      } else {
        const getUserMinutesQuery = `
          SELECT all_minutes, consumed_minutes, added_minutes 
          FROM user_minutes 
          WHERE user_id = $1
        `;
        const userMinutesResult = await db.query(getUserMinutesQuery, [uId]);

        if (userMinutesResult.rows.length > 0) {
          let { all_minutes, consumed_minutes, added_minutes } = userMinutesResult.rows[0];

          console.log("Current values - all_minutes:", all_minutes, "consumed_minutes:", consumed_minutes, "added_minutes:", added_minutes);

          // Case 1: all_minutes is greater than consumed_minutes
          if (all_minutes >= consumed_minutes) {
            added_minutes = added_minutes; // keep the same added minutes
            consumed_minutes = 0; // reset consumed minutes to 0
          }
          // Case 2: all_minutes is less than consumed_minutes
          else if (all_minutes < consumed_minutes) {
            // If all_minutes + added_minutes is greater than consumed_minutes
            if (all_minutes + added_minutes > consumed_minutes) {
              added_minutes = all_minutes + added_minutes - consumed_minutes; // update added_minutes
              consumed_minutes = 0; // reset consumed minutes to 0
            } else {
              // If all_minutes + added_minutes is less than consumed_minutes
              consumed_minutes = consumed_minutes - all_minutes - added_minutes; // update consumed_minutes
              added_minutes = 0; // set added_minutes to 0
            }
          }

          // Update the user_minutes table with the new values
          const updateMinutesQuery = `
            UPDATE user_minutes 
            SET all_minutes = $2, consumed_minutes = $3, added_minutes = $4 
            WHERE user_id = $1
          `;
          await db.query(updateMinutesQuery, [uId, initial_minutes, consumed_minutes, added_minutes]);

          console.log("Updated values - all_minutes:", initial_minutes, "consumed_minutes:", consumed_minutes, "added_minutes:", added_minutes);
        } else {
          console.log("No record found in user_minutes for user with ID:", uId);
        }
      }
      
      console.log("initial_minutes~~~", initial_minutes);
    } else {
      console.log("No user found with this email:", lowercasedEmail);
    }
  } catch (error) {
    console.error("Error in resetMinutes:", error);
    throw new Error("Failed to reset minutes");
  }
};

export const createUserAndSendEmail = async (db, email, paidStatus) => {
  try {
    // Convert email to lowercase and encode password
    const lowercasedEmail = email.toLowerCase();
    const checkUserQuery = `SELECT id FROM users WHERE email = $1`;
    const userResult = await db.query(checkUserQuery, [lowercasedEmail]);

    if (userResult.rows.length > 0) {
      const uId = userResult.rows[0].id;
      console.log("User already exists with this email:", lowercasedEmail);

      // Check the user's roles
      const checkUserRoleQuery = `SELECT role_id FROM user_roles WHERE user_id = $1`;
      const roleResult = await db.query(checkUserRoleQuery, [uId]);

      // Update the role to ROLE_ADMIN (id = 3) if the user's role is not 3 or 4
      const existingRoles = roleResult.rows.map((row) => row.role_id);
      if (!existingRoles.includes(3) && !existingRoles.includes(4)) {
        const roleQuery = `SELECT id FROM roles WHERE name = 'ROLE_ADMIN'`;
        const roleResult = await db.query(roleQuery);
        if (roleResult.rows.length === 0) {
          throw new Error("ROLE_ADMIN not found.");
        }
        const roleId = roleResult.rows[0].id;

        // Update the user role to ROLE_ADMIN where user_id matches
        const updateUserRoleQuery = `
                    UPDATE user_roles
                    SET role_id = $2
                    WHERE user_id = $1;
                `;
        await db.query(updateUserRoleQuery, [uId, roleId]);
        console.log(`User role updated to ROLE_ADMIN for user: ${uId}`);
      }
      await addInitMinutes(db, lowercasedEmail, funnelAccountMinutes);
      return 0; // Return 0 if the user already exists
    }
    const secureRandomPassword = generateRandomPassword(12);
    const hashedPassword = await bcrypt.hash(secureRandomPassword, 10); // Consider generating a secure random password
    const invitationToken = uuidv4();
    const tokenForEmail = uuidv4();

    // Determine the paidStatus based on your specific conditions
    const statusToSet = typeof paidStatus === "number" ? paidStatus : 0;

    const insertUserQuery = `
            INSERT INTO users (email, username, password, invitation_token, token_for_email, created_date, paid_status, step)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING id;
        `;
    const result = await db.query(insertUserQuery, [
      lowercasedEmail,
      lowercasedEmail,
      hashedPassword,
      invitationToken,
      tokenForEmail,
      new Date().toISOString(),
      statusToSet,
      0,
    ]);
    const userId = result.rows[0].id;

    const roleQuery = `SELECT id FROM roles WHERE name = 'ROLE_ADMIN'`;
    const roleResult = await db.query(roleQuery);
    if (roleResult.rows.length === 0) {
      throw new Error("Role is not found.");
    }

    const roleId = roleResult.rows[0].id;

    // Assign the role to the user
    const assignRoleQuery = `
            INSERT INTO user_roles (user_id, role_id)
            VALUES ($1, $2);
        `;
    await db.query(assignRoleQuery, [userId, roleId]);

    const insertMinutesQuery = `
      INSERT INTO user_minutes (user_id, all_minutes, consumed_minutes)
      VALUES ($1, $2, $3);
    `;
    console.log("funnelAccountMinutes~~~", funnelAccountMinutes);

    await db.query(insertMinutesQuery, [userId, funnelAccountMinutes, 0]);

    console.log(
      `User minutes initialized with 120 minutes for user: ${userId}`
    );

    const model = {
      invite_receiver_email: email,
      action_url: `${frontendBaseUrl}/confirm-invitation?token=${invitationToken}`,
    };

    await sendTemplateEmailWithPostmark(email, confirmEmailID, model);

    return userId;
  } catch (error) {
    console.error("Error in createUserAndSendEmail:", error);
    throw new Error("User creation or email sending failed");
  }
};
const generateRandomPassword = (length = 12) => {
  const charset =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+~`|}{[]:;?><,./-=";
  let password = "";
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }
  return password;
};
