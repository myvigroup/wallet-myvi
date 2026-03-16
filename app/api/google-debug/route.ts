import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export async function GET() {
  try {
    const issuerId = process.env.GOOGLE_WALLET_ISSUER_ID!;
    const serviceAccountEmail = process.env.GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL!;
    const privateKey = Buffer.from(
      process.env.GOOGLE_WALLET_PRIVATE_KEY!,
      "base64"
    ).toString("utf-8");

    // 1. Get access token via service account JWT
    const now = Math.floor(Date.now() / 1000);
    const authJwt = jwt.sign(
      {
        iss: serviceAccountEmail,
        scope: "https://www.googleapis.com/auth/wallet_object.issuer",
        aud: "https://oauth2.googleapis.com/token",
        iat: now,
        exp: now + 3600,
      },
      privateKey,
      { algorithm: "RS256" }
    );

    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${authJwt}`,
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok) {
      return NextResponse.json({ step: "auth", error: tokenData }, { status: 500 });
    }

    const accessToken = tokenData.access_token;

    // 2. Try to create a test class via REST API
    const classId = `${issuerId}.myvi-visitenkarte`;
    const classPayload = {
      id: classId,
      issuerName: "MYVI Group",
      multipleDevicesAndHoldersAllowedStatus: "MULTIPLE_HOLDERS",
    };

    const classRes = await fetch(
      `https://walletobjects.googleapis.com/walletobjects/v1/genericClass`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(classPayload),
      }
    );

    const classData = await classRes.json();

    // 3. Try to create a test object
    const objectId = `${issuerId}.test_debug_object`;
    const objectPayload = {
      id: objectId,
      classId,
      state: "ACTIVE",
      cardTitle: {
        defaultValue: { language: "de", value: "MYVI Group" },
      },
      header: {
        defaultValue: { language: "de", value: "Test User" },
      },
    };

    const objectRes = await fetch(
      `https://walletobjects.googleapis.com/walletobjects/v1/genericObject`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(objectPayload),
      }
    );

    const objectData = await objectRes.json();

    return NextResponse.json({
      auth: "OK",
      class: { status: classRes.status, data: classData },
      object: { status: objectRes.status, data: objectData },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
