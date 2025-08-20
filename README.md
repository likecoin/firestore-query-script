# Firestore Query Script

A sample Node.js script that queries Firebase Firestore to match email addresses with user data (likerId, evmWallet, likeWallet) from CSV files.

## Prerequisites

- Node.js (version 18+ recommended)

## Installation

1. Clone or download this project
2. Install dependencies:
   ```bash
   npm install
   ```

## Setup

### 1. Firebase Service Account Key

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Project Settings** (gear icon)
4. Click **Service accounts** tab
5. Click **Generate new private key**
6. Download the JSON file and rename it to `serviceAccountKey.json`
7. Place it in the project root directory

### 2. Environment Configuration

1. Copy the sample environment file:
   ```bash
   cp .env.sample .env
   ```

2. Edit `.env` and configure your settings:
   ```env
   # Firebase Configuration
   FIRESTORE_LIKER_ID_COLLECTION=liker-id-collection-name
   ```

### 3. Input CSV Format

Your input CSV file must have an `email` column header:

```csv
email
user1@example.com
user2@example.com
user3@example.com
```

## Usage

Run the script with your CSV file as an argument:

```bash
node index.js your-file.csv
```

### Example

```bash
node index.js customer_emails.csv
```

## Output Format

The output CSV contains:

| Column | Description |
|--------|-------------|
| email | Original email address |
| likerId | User's Liker ID (or empty if not found) |
| evmWallet | User's EVM wallet address |
| likeWallet | User's Like wallet address |

## Security Notes

- ⚠️ Never commit `serviceAccountKey.json` to version control
- ⚠️ Never commit `.env` files with real credentials
- ⚠️ CSV files are automatically ignored by git to protect data
- ✅ Use the provided `.env.sample` and `serviceAccountKey.sample.json` as templates

## Troubleshooting

### "serviceAccountKey.json not found"
- Ensure you've downloaded and renamed your Firebase service account key
- Place it in the project root directory

### "FIRESTORE_LIKER_ID_COLLECTION not found"
- Create a `.env` file from `.env.sample`
- Set the correct Firestore collection name

### "File not found"
- Check the CSV file path and name
- Ensure the file exists in the specified location

### Firebase connection errors
- Verify your service account key is valid
- Check your Firebase project permissions
- Ensure Firestore is enabled in your Firebase project
