/**
 * Login Flow Debug Test
 * Run with: npx ts-node --esm scripts/test-login.ts
 */

const BASE_URL = "http://localhost:3000";
const TEAM_ID = "TEAM-05";
const ACCESS_CODE = "5555";

async function testLoginFlow() {
  console.log("=".repeat(60));
  console.log("LOGIN FLOW DEBUG TEST");
  console.log("=".repeat(60));
  console.log(`Team ID: ${TEAM_ID}`);
  console.log(`Access Code: ${ACCESS_CODE}`);
  console.log("");

  // Step 1: Test POST /api/team/join
  console.log("STEP 1: POST /api/team/join");
  console.log("-".repeat(40));

  let loginCookie = "";

  try {
    const loginRes = await fetch(`${BASE_URL}/api/team/join`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teamId: TEAM_ID, accessCode: ACCESS_CODE }),
    });

    console.log(`Status: ${loginRes.status} ${loginRes.statusText}`);

    // Check for Set-Cookie header
    const setCookie = loginRes.headers.get("set-cookie");
    console.log(`Set-Cookie header: ${setCookie ? "YES" : "NO"}`);

    if (setCookie) {
      console.log(`Cookie value: ${setCookie.substring(0, 100)}...`);
      // Extract cookie for next request
      const match = setCookie.match(/team_session=([^;]+)/);
      if (match) {
        loginCookie = match[1];
        console.log(`Extracted token: ${loginCookie.substring(0, 50)}...`);
      }
    } else {
      console.log("ERROR: No Set-Cookie header in response!");
    }

    const loginData = await loginRes.json();
    console.log(`Response body:`, JSON.stringify(loginData, null, 2));

  } catch (err) {
    console.log(`ERROR: ${err}`);
  }

  console.log("");

  // Step 2: Test GET /api/team/me without cookie
  console.log("STEP 2: GET /api/team/me (WITHOUT cookie)");
  console.log("-".repeat(40));

  try {
    const meRes1 = await fetch(`${BASE_URL}/api/team/me`);
    console.log(`Status: ${meRes1.status}`);
    const meData1 = await meRes1.json();
    console.log(`Response:`, JSON.stringify(meData1, null, 2));
    console.log(`Has team: ${meData1.team ? "YES" : "NO"}`);
  } catch (err) {
    console.log(`ERROR: ${err}`);
  }

  console.log("");

  // Step 3: Test GET /api/team/me WITH cookie
  console.log("STEP 3: GET /api/team/me (WITH cookie)");
  console.log("-".repeat(40));

  if (!loginCookie) {
    console.log("SKIPPED: No cookie from login step");
  } else {
    try {
      const meRes2 = await fetch(`${BASE_URL}/api/team/me`, {
        headers: { Cookie: `team_session=${loginCookie}` },
      });
      console.log(`Status: ${meRes2.status}`);
      const meData2 = await meRes2.json();
      console.log(`Response:`, JSON.stringify(meData2, null, 2));
      console.log(`Has team: ${meData2.team ? "YES" : "NO"}`);

      if (meData2.team) {
        console.log("");
        console.log("SUCCESS: Cookie works correctly!");
      } else {
        console.log("");
        console.log("ERROR: Cookie sent but team is null - session verification failed!");
      }
    } catch (err) {
      console.log(`ERROR: ${err}`);
    }
  }

  console.log("");
  console.log("=".repeat(60));
  console.log("TEST COMPLETE");
  console.log("=".repeat(60));
}

testLoginFlow();
