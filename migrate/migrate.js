console.log('STARTING MIGRATION');
// Import necessary modules
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const dayjs = require('dayjs');
// --- CONFIGURATION ---
const INPUT_CSV_PATH = path.join(__dirname, './blogtext.csv');
const OUTPUT_DIR = path.join(__dirname, './blogtextData');
// The maximum number of JSON objects per output file.
const CHUNK_SIZE = 10000;

// --- SCRIPT LOGIC ---
// Helper function to write a chunk of data to a JSON file.
const writeChunkToFile = (data, fileIndex) => {
  const filePath = path.join(OUTPUT_DIR, `data_chunk_${fileIndex}.json`);
  // The 'null, 2' arguments format the JSON for better readability.
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  console.log(`✅ Chunk ${fileIndex} written successfully to ${filePath}`);
};

const formatData = (data) => {
  try {
    const dateDD = dayjs(data['date']).isValid()
      ? dayjs(data['date']).toISOString()
      : getRandomDate(dayjs('2000-01-01'), dayjs('2025-12-31'));

    const formattedData = {
      createdAt: dateDD,
      updatedAt: dateDD,
      text: data['text']?.trim() || '',
      topic: data['topic']?.trim() || '',
    };

    return formattedData;
  } catch {
    return null;
  }
};

// Main function to process the CSV stream.
const processCSV = async () => {
  console.log('🚀 Starting CSV processing...');

  // 1. Ensure the output directory exists. If not, create it.
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    console.log(`📂 Created output directory at: ${OUTPUT_DIR}`);
  }

  let recordsChunk = []; // Holds the records for the current chunk.
  let fileCounter = 1; // Counter for naming the output files.

  // 2. Create a readable stream from the CSV file.
  const fileStream = fs.createReadStream(INPUT_CSV_PATH);

  // 3. Create a promise to know when the processing is finished.
  const processingPromise = new Promise((resolve, reject) => {
    fileStream
      .pipe(csv()) // Pipe the stream to the csv-parser.
      .on('data', (row) => {
        // This 'data' event is triggered for each row in the CSV.
        const fRow = formatData(row);
        if (fRow) {
          recordsChunk.push(fRow);
        }

        // 4. When the chunk reaches the desired size, write it to a file.
        if (recordsChunk.length >= CHUNK_SIZE) {
          writeChunkToFile(recordsChunk, fileCounter);
          // Reset the chunk and increment the file counter for the next batch.
          recordsChunk = [];
          fileCounter++;
        }
      })
      .on('end', () => {
        // 5. The 'end' event is triggered when the entire file has been read.
        // Write any remaining records that didn't make a full chunk.
        if (recordsChunk.length > 0) {
          writeChunkToFile(recordsChunk, fileCounter);
        }
        console.log('\n🏁 CSV file processing complete.');
        resolve();
      })
      .on('error', (error) => {
        // Handle any errors during the stream processing.
        console.error('❌ An error occurred:', error.message);
        reject(error);
      });
  });

  await processingPromise;
};

function getRandomDate(start, end) {
  // 1. Get the Unix timestamps (in milliseconds).
  const startTime = start.valueOf();
  const endTime = end.valueOf();

  // 2. Generate a random timestamp within the range.
  const randomTime = Math.random() * (endTime - startTime) + startTime;

  // 3. Create a new Day.js object from the random timestamp.
  return dayjs(randomTime).toISOString();
}

// Execute the main function.
processCSV().then(() => {
  console.log('END MIGRATION');
});
