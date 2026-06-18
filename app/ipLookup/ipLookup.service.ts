import https from 'https';
import { IncomingMessage } from 'http';
import zlib from 'zlib';
import readline from 'readline';
import mongoose from 'mongoose';
import { IP_DB_AUTO_UPDATE } from '../../config/default';
import { logger } from '../../utils/logger';
import { ipToHex } from '../../utils/ip.utils';
import {
  IpLocationAModel,
  IpLocationBModel,
  IpRangeAModel,
  IpRangeBModel,
  IpMetadataModel,
} from './ipLookup.model';

/**
 * Parses a standard CSV line taking into account double quotes and commas inside them.
 */
export function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

/**
 * Recursively follows HTTP/HTTPS redirects up to maxRedirects.
 */
function fetchUrl(url: string, maxRedirects = 5): Promise<IncomingMessage> {
  return new Promise((resolve, reject) => {
    const request = https.get(url, (res) => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        if (maxRedirects <= 0) {
          reject(new Error('Too many redirects'));
          return;
        }
        resolve(fetchUrl(res.headers.location, maxRedirects - 1));
      } else {
        resolve(res);
      }
    });
    request.on('error', reject);
  });
}

/**
 * Calculates the previous YYYY-MM version string.
 */
function getPreviousYearMonth(yearMonthStr: string): string {
  const [year, month] = yearMonthStr.split('-').map(Number);
  let prevYear = year;
  let prevMonth = month - 1;
  if (prevMonth === 0) {
    prevMonth = 12;
    prevYear -= 1;
  }
  return `${prevYear}-${String(prevMonth).padStart(2, '0')}`;
}

/**
 * Downloads and updates the IP ranges database in MongoDB using flat A/B Range collections.
 */
export async function updateDatabase(yearMonth?: string): Promise<string> {
  let ym = yearMonth;
  if (!ym) {
    const now = new Date();
    ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  logger.info(`Starting IP Database update for version ${ym}...`);

  let response: IncomingMessage;
  let attemptYm = ym;
  let fallbackCount = 0;

  while (true) {
    const url = `https://download.db-ip.com/free/dbip-city-lite-${attemptYm}.csv.gz`;
    logger.info(`Attempting to download DB-IP Lite from ${url}...`);
    try {
      response = await fetchUrl(url);
      if (response.statusCode === 200) {
        break; // Found and opened stream
      }
      if (response.statusCode === 404) {
        if (fallbackCount >= 3) {
          throw new Error('Failed to locate a database file after multiple fallbacks.');
        }
        logger.warn(`Database for ${attemptYm} not found (404). Falling back to previous month...`);
        attemptYm = getPreviousYearMonth(attemptYm);
        fallbackCount++;
        continue;
      }
      throw new Error(`Failed to download database. Status Code: ${response.statusCode}`);
    } catch (err: any) {
      if (err.message && err.message.includes('404')) {
        if (fallbackCount >= 3) {
          throw new Error('Failed to locate a database file after multiple fallbacks.');
        }
        logger.warn(`Database for ${attemptYm} not found (404). Falling back to previous month...`);
        attemptYm = getPreviousYearMonth(attemptYm);
        fallbackCount++;
        continue;
      }
      throw err;
    }
  }

  logger.info(`Successfully connected to stream for ${attemptYm}. Processing IP ranges...`);

  const db = mongoose.connection.db;
  if (!db) {
    throw new Error('Database connection is not active.');
  }

  // Determine current and target collection sets
  const activeMeta = await IpMetadataModel.findOne({ key: 'ip_db_active_set' });
  const currentSet = activeMeta?.dbYearMonth === 'b' ? 'b' : 'a';
  const targetSet = currentSet === 'a' ? 'b' : 'a';

  logger.info(`Current active collection set is '${currentSet}'. Targeting set '${targetSet}'...`);

  const targetRangesCol = db.collection(targetSet === 'a' ? 'ip_ranges_a' : 'ip_ranges_b');
  const targetLocCol = db.collection(targetSet === 'a' ? 'ip_locations_a' : 'ip_locations_b');

  // Clear target collections first
  logger.info(`Clearing target set collections 'ip_ranges_${targetSet}' and 'ip_locations_${targetSet}'...`);
  await targetRangesCol.deleteMany({});
  await targetLocCol.deleteMany({});

  const gunzip = zlib.createGunzip();
  const rl = readline.createInterface({
    input: response.pipe(gunzip),
    crlfDelay: Infinity,
  });

  // Location mapping structures to deduplicate locations in memory
  const locationMap = new Map<string, number>();
  let nextLocationId = 1;

  let batchLocations: any[] = [];
  let batchRanges: any[] = [];
  
  let totalProcessed = 0;
  let totalSavedByMerging = 0;
  const BATCH_SIZE = 5000;

  // Active range tracking for sequential range merging
  let currentRange: { s: string; e: string; l: number; type: 'ipv4' | 'ipv6' } | null = null;

  try {
    for await (const line of rl) {
      if (!line || line.trim() === '') continue;

      const fields = parseCsvLine(line);
      if (fields.length < 8) {
        continue; // Skip invalid columns
      }

      const [ipStart, ipEnd, continent, country, stateprov, city] = fields;

      // Filter: only keep India and United States
      const normCountry = country ? country.toUpperCase().trim() : '';
      if (normCountry !== 'IN' && normCountry !== 'US') {
        continue;
      }

      try {
        const startInfo = ipToHex(ipStart);
        const endInfo = ipToHex(ipEnd);

        if (startInfo.type !== endInfo.type) {
          continue; // Mismatched IP types
        }

        // Deduplicate location details
        const locKey = `${country || ''}|${stateprov || ''}|${city || ''}`;
        let locId = locationMap.get(locKey);

        if (locId === undefined) {
          locId = nextLocationId++;
          locationMap.set(locKey, locId);

          const locDoc = {
            _id: locId,
            country,
            stateprov: stateprov || undefined,
            city: city || undefined,
          };
          batchLocations.push(locDoc);

          if (batchLocations.length >= BATCH_SIZE) {
            await targetLocCol.insertMany(batchLocations, { ordered: false });
            batchLocations = [];
          }
        }

        // Merge contiguous blocks
        const startHex = startInfo.hex;
        const endHex = endInfo.hex;
        const type = startInfo.type;

        if (currentRange === null) {
          currentRange = { s: startHex, e: endHex, l: locId, type };
        } else {
          // Check if contiguous and same type and location
          let isContiguous = false;
          if (currentRange.type === type && currentRange.l === locId) {
            try {
              const prevEndNum = BigInt('0x' + currentRange.e);
              const nextStartNum = BigInt('0x' + startHex);
              if (prevEndNum + BigInt(1) === nextStartNum) {
                isContiguous = true;
              }
            } catch {
              // safe fallback if hex arithmetic fails
            }
          }

          if (isContiguous) {
            // Update end boundary of the merged range
            currentRange.e = endHex;
            totalSavedByMerging++;
          } else {
            // Push previous range to batch
            batchRanges.push({
              t: currentRange.type,
              s: currentRange.s,
              e: currentRange.e,
              l: currentRange.l,
            });

            if (batchRanges.length >= BATCH_SIZE) {
              await targetRangesCol.insertMany(batchRanges, { ordered: false });
              batchRanges = [];
            }

            // Set new active range block
            currentRange = { s: startHex, e: endHex, l: locId, type };
          }
        }

        totalProcessed++;
        if (totalProcessed % 500000 === 0) {
          logger.info(`IP DB Processing: ${totalProcessed} rows parsed. Saved by merging: ${totalSavedByMerging} blocks.`);
        }
      } catch (err) {
        logger.error(`Error parsing IP range row: ${line}. Message: ${err}`);
      }
    }

    // Flush last active range block
    if (currentRange) {
      batchRanges.push({
        t: currentRange.type,
        s: currentRange.s,
        e: currentRange.e,
        l: currentRange.l,
      });
    }

    // Insert residual records in buffers
    if (batchLocations.length > 0) {
      await targetLocCol.insertMany(batchLocations, { ordered: false });
    }
    if (batchRanges.length > 0) {
      await targetRangesCol.insertMany(batchRanges, { ordered: false });
    }

    logger.info(`Import complete. Total original IP ranges: ${totalProcessed}. Unique locations: ${locationMap.size}. Saved ${totalSavedByMerging} records via merging.`);

    logger.info(`Building/ensuring indexes on collections 'ip_ranges_${targetSet}'...`);
    await targetRangesCol.createIndex({ t: 1, e: 1 });

    logger.info(`Performing atomic active set swap in metadata: switching to set '${targetSet}'...`);
    await IpMetadataModel.updateOne(
      { key: 'ip_db_active_set' },
      {
        $set: {
          updatedAt: new Date(),
          dbYearMonth: targetSet,
        },
      },
      { upsert: true }
    );

    logger.info('Updating synchronization version metadata...');
    await IpMetadataModel.updateOne(
      { key: 'ip_db_last_updated' },
      {
        $set: {
          updatedAt: new Date(),
          dbYearMonth: attemptYm,
        },
      },
      { upsert: true }
    );

    logger.info(`IP Geolocation Database updated successfully to version ${attemptYm}!`);
    return attemptYm;
  } catch (error) {
    logger.error(`Error during IP database update: ${error}`);
    // Clear the aborted target set to not leave stale partial data
    await targetRangesCol.deleteMany({}).catch(() => {});
    await targetLocCol.deleteMany({}).catch(() => {});
    throw error;
  }
}

/**
 * Resolves geolocation details for the given IP address string.
 */
export async function lookupIp(ip: string) {
  const { type, hex } = ipToHex(ip);

  // Determine active collection set from metadata
  const activeMeta = await IpMetadataModel.findOne({ key: 'ip_db_active_set' }).lean();
  const activeSet = activeMeta?.dbYearMonth === 'b' ? 'b' : 'a';

  const rangeModel = activeSet === 'a' ? IpRangeAModel : IpRangeBModel;
  const locationModel = activeSet === 'a' ? IpLocationAModel : IpLocationBModel;

  // Find the matching range in the active flat range collection
  const range = await rangeModel.findOne({
    t: type,
    e: { $gte: hex },
  })
    .sort({ e: 1 })
    .lean();

  if (!range || range.s > hex) {
    return null;
  }

  // Resolve matching location from active location collection
  const loc = await locationModel.findById(range.l).lean();
  if (!loc) {
    return null;
  }

  return {
    ip,
    ipType: type,
    country: loc.country,
    state: loc.stateprov || '',
    city: loc.city || '',
  };
}

/**
 * Checks metadata status and downloads the database if it doesn't exist or is out of date.
 */
export async function checkForUpdate(): Promise<void> {
  logger.info('Checking if IP database needs synchronization...');
  try {
    const metadata = await IpMetadataModel.findOne({ key: 'ip_db_last_updated' });
    const countA = await IpLocationAModel.countDocuments();
    const countB = await IpLocationBModel.countDocuments();
    const count = countA + countB;

    const now = new Date();
    const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    if (!metadata || count === 0 || metadata.dbYearMonth !== currentYearMonth) {
      logger.info(`Synchronization required. DB Locations: ${count}, Last Version: ${metadata ? metadata.dbYearMonth : 'None'}, Target: ${currentYearMonth}`);
      updateDatabase().catch((err) => {
        logger.error(`Automated IP database update failed: ${err.message}`);
      });
    } else {
      logger.info(`IP Database is up to date (version: ${metadata.dbYearMonth}).`);
    }
  } catch (err: any) {
    logger.error(`Failed to execute IP database update check: ${err.message}`);
  }
}

let schedulerInterval: NodeJS.Timeout | null = null;

/**
 * Initializes the periodic check scheduler.
 */
export function initScheduler(): void {
  if (!IP_DB_AUTO_UPDATE) {
    logger.info('IP Geolocation database update scheduler is disabled via config.');
    return;
  }

  // Check immediately on startup
  checkForUpdate();

  // Schedule to recheck every 24 hours
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
  }

  schedulerInterval = setInterval(() => {
    checkForUpdate();
  }, 24 * 60 * 60 * 1000);

  logger.info('Monthly IP database update scheduler started.');
}
