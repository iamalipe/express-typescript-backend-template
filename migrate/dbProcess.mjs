import mongoose, { Schema } from 'mongoose';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Get the directory name in an ES module environment
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATABASE_URL =
  'mongodb://alipe:password@62.171.152.50:27017/express-typescript-template?authSource=admin';
// Import necessary modules
import { readdir, readFile } from 'node:fs/promises';

const blogSchema = new Schema(
  {
    topic: {
      type: String,
      index: true,
    },
    content: {
      type: String,
    },
  },
  {
    timestamps: true,
    collection: 'Blog',
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

const BlogModel = mongoose.model('Blog', blogSchema);

export const dbConnect = async () => {
  // Create a Mongoose client with a MongoClientOptions object to set the Stable API version
  await mongoose.connect(DATABASE_URL, {
    serverApi: { version: '1', strict: true, deprecationErrors: true },
  });
  if (!mongoose.connection.db) {
    throw new Error('Database connection failed!');
  }
  await mongoose.connection.db.admin().command({ ping: 1 });
  console.log(`Successfully connected to Database.`);
};

export const dbDisconnect = async () => {
  // Close the Mongoose connection
  await mongoose.disconnect();
  console.log('Successfully disconnected from Database.');
};

export const processJsonChunks = async (directoryPath) => {
  console.log(`🚀 Starting to process chunks from: ${directoryPath}`);
  await dbConnect();
  try {
    // 1. Get a list of all files in the directory.
    const allFiles = await readdir(directoryPath);
    const jsonFiles = allFiles.filter((file) => path.extname(file) === '.json');
    console.log(`📂 Found ${jsonFiles.length} JSON files to process.`);

    if (jsonFiles.length === 0) {
      console.warn('⚠️ No JSON files found in the directory.');
      return;
    }

    // 2. Process each JSON file one by one using a for...of loop.
    // (A for...of loop works with await, unlike forEach).
    for (const fileName of jsonFiles) {
      const filePath = path.join(directoryPath, fileName);
      console.log(`\n📄 Reading file: ${fileName}...`);

      try {
        // 3. Read and parse the file content.
        const fileContent = await readFile(filePath, 'utf8');
        const records = JSON.parse(fileContent);

        if (!Array.isArray(records)) {
          console.error(
            `  ❌ Error: Content of ${fileName} is not a JSON array. Skipping.`,
          );
          continue; // Move to the next file
        }

        console.log(
          `  🔍 Found ${records.length} records. Starting database operations...`,
        );
        await BlogModel.insertMany(
          records?.map((e) => ({
            topic: e.topic,
            content: e.text,
            createdAt: e.createdAt,
            updatedAt: e.updatedAt,
          })),
        );
        console.log(`  ✅ Finished processing all records in ${fileName}.`);
      } catch (parseError) {
        console.error(
          `  ❌ Error parsing or processing ${fileName}:`,
          parseError.message,
        );
      }
    }

    console.log('\n🏁 All files have been processed successfully!');
  } catch (error) {
    console.error(`❌ A critical error occurred: ${error.message}`);
  }
};

const OUTPUT_DIR = path.join(__dirname, './blogtextData');
// Start the process
processJsonChunks(OUTPUT_DIR).finally(async () => {
  await dbDisconnect();
});
