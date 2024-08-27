import postmark from "postmark";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcryptjs";
import * as configEnv from "./config.mjs";

const postmarkToken = configEnv.postmarkToken;
const fromEmail = configEnv.fromEmail;
const frontendBaseUrl = configEnv.frontendBaseUrl;
const confirmEmailID = configEnv.confirmEmailID;
const client = new postmark.ServerClient(postmarkToken);

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
