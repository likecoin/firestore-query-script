const fs = require("fs");
const { parse } = require("csv-parse/sync");
const { stringify } = require("csv-stringify/sync");
const admin = require("firebase-admin");

// Load environment variables
require("dotenv").config();

// -------- CONFIGURE FIREBASE ADMIN SDK --------
// Check if serviceAccountKey.json exists
const serviceAccountPath = "./serviceAccountKey.json";
if (!fs.existsSync(serviceAccountPath)) {
  console.error("❌ Error: serviceAccountKey.json not found");
  console.log("Please ensure you have:");
  console.log("1. Downloaded your Firebase service account key");
  console.log("2. Renamed it to 'serviceAccountKey.json'");
  console.log("3. Placed it in the project root directory");
  console.log("\nSee serviceAccountKey.sample.json for the expected format");
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccountPath),
});
const db = admin.firestore();

// Check if collection name is configured
if (!process.env.FIRESTORE_LIKER_ID_COLLECTION) {
  console.error(
    "❌ Error: FIRESTORE_LIKER_ID_COLLECTION not found in .env file"
  );
  console.log("Please ensure you have:");
  console.log("1. Created a .env file in the project root");
  console.log("2. Added: FIRESTORE_LIKER_ID_COLLECTION=your-collection-name");
  console.log("\nSee .env.sample for reference");
  process.exit(1);
}

const likerIdCollection = db.collection(
  process.env.FIRESTORE_LIKER_ID_COLLECTION
);
console.log(
  `🔥 Using Firestore collection: ${process.env.FIRESTORE_LIKER_ID_COLLECTION}`
);

// -------- FUNCTIONS --------
async function readCSV(filePath) {
  const fileContent = fs.readFileSync(filePath, "utf8");
  return parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
  });
}

async function writeCSV(data, filePath) {
  const csv = stringify(data, { header: true });
  fs.writeFileSync(filePath, csv, "utf8");
}

function normalizeDocData(doc) {
  const docData = doc ? doc.data() : {};
  return {
    likerId: doc ? doc.id : "",
    evmWallet: docData.evmWallet || "",
    likeWallet: docData.likeWallet || "",
  };
}

// Fetch doc by Liker ID
// async function fetchDocByLikerId(likerId) {
//   const snapshot = await likerIdCollection
//     .doc(likerId)
//     .get();

//   if (!snapshot.exists) {
//     return normalizeDocData({});
//   }

//   return normalizeDocData(snapshot);
// }

async function fetchDocByEmail(email) {
  const snapshot = await likerIdCollection
    .where("email", "==", email)
    .limit(1)
    .get();

  if (snapshot.empty) {
    return normalizeDocData();
  }

  const doc = snapshot.docs[0];
  return normalizeDocData(doc);
}

// -------- MAIN PROCESS --------
(async () => {
  try {
    // Get filename from command line arguments
    const inputFilename = process.argv[2];

    if (!inputFilename) {
      console.error("❌ Error: Please provide a filename as argument");
      console.log("Usage: node index.js <filename.csv>");
      process.exit(1);
    }

    // Check if file exists
    if (!fs.existsSync(inputFilename)) {
      console.error(`❌ Error: File "${inputFilename}" not found`);
      process.exit(1);
    }

    // Generate output filename with current ISO date and time (seconds precision)
    const now = new Date();
    const dateTime = now
      .toISOString()
      .slice(0, 19)
      .replace(/[:.]/g, "")
      .replace("T", "_");
    const fileExtension = inputFilename.split(".").pop();
    const baseFilename = inputFilename.replace(`.${fileExtension}`, "");
    const outputPath = `${baseFilename}_${dateTime}.${fileExtension}`;

    console.log(`📁 Input file: ${inputFilename}`);
    console.log(`📁 Output file: ${outputPath}`);

    const rows = await readCSV(inputFilename);
    const results = [];
    const totalRows = rows.length;

    console.log(`📊 Processing ${totalRows} records...\n`);

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const email = row.email.trim();
      const { likerId, evmWallet, likeWallet } = await fetchDocByEmail(email);
      results.push({
        email,
        likerId,
        evmWallet,
        likeWallet,
      });

      const progress = Math.round(((i + 1) / totalRows) * 100);
      const progressBar =
        "█".repeat(Math.floor(progress / 2)) +
        "░".repeat(50 - Math.floor(progress / 2));

      // Clear the entire line and write new progress
      const progressText = `[${progressBar}] ${progress}% (${
        i + 1
      }/${totalRows}) | ${email} -> ${likerId || "❌ Not found"}`;

      // Clear line completely and rewrite
      process.stdout.clearLine(0);
      process.stdout.cursorTo(0);
      process.stdout.write(progressText);
    }

    console.log("\n"); // New line after progress is complete

    await writeCSV(results, outputPath);
    console.log(`✅ Done! Output saved to ${outputPath}`);
  } catch (err) {
    console.error("❌ Error:", err);
  }
})();
