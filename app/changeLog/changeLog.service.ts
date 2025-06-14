import { db } from '../../services/db.services';

export type ChangeLogEntry = {
  keys: string[];
  module: string;
  title: string;
  newValue?: {
    [key: string]: any;
  };
  oldValue?: {
    [key: string]: any;
  };
  referenceId?: string;
  referenceModel?: string;
  description?: string;
  quitIfNoKeys?: boolean;
};

const formatKeyToHumanReadable = (key: string): string => {
  return key
    .split('.')
    .map(
      (part) =>
        part
          .replace(/([a-z])([A-Z])/g, '$1 $2') // Insert space between camelCase words
          .replace(/(^\w|\s\w)/g, (match) => match.toUpperCase()), // Capitalize first letters
    )
    .join(' ');
};

/**
 * Extracts values from an object based on dot-separated keys.
 */
const extractValuesByKeys = (
  obj: { [key: string]: any },
  keys: string[],
): { [key: string]: any } => {
  const result: { [key: string]: any } = {};
  keys.forEach((key) => {
    const parts = key.split('.');
    let value: any = obj;
    for (const part of parts) {
      if (value && typeof value === 'object') {
        value = value[part];
      } else {
        value = 'N/A';
        break;
      }
    }
    result[key] = value;
  });
  return result;
};

/**
 * Formats an object into a human-readable string.
 * Example: { 'user.name': 'John Doe' } => "'User Name - John Doe'"
 */
const formatValuesToHumanReadableString = (values: {
  [key: string]: any;
}): string => {
  return Object.entries(values)
    .map(
      ([key, value]) =>
        `'${formatKeyToHumanReadable(key)} - ${value ?? 'N/A'}'`,
    )
    .join(', ');
};

/**
 * Adds a change log entry with the provided data.
 */
export const addChangeLogEntry = async (data: ChangeLogEntry) => {
  const module = data.module;
  const title = data.title;
  const newValue = data.newValue || {};
  const oldValue = data.oldValue || {};
  const referenceId = data.referenceId;
  const referenceModel = data.referenceModel;
  const description = data.description;
  const keys = data.keys;
  const quitIfNoKeys = data.quitIfNoKeys ?? true;

  if (quitIfNoKeys && keys.length === 0) return;

  // If there are no keys, create the change log entry.
  if (keys.length === 0) {
    await db.changeLog.create({
      module,
      title,
      newValue,
      oldValue,
      referenceId,
      description,
      referenceModel,
    });
    return;
  }

  // Step 01 - Create a new/old value object with the keys.
  const filteredNewValue = extractValuesByKeys(newValue, keys);
  const filteredOldValue = extractValuesByKeys(oldValue, keys);

  // Step 02 - Create a formatted string.
  const newValueFormatted = formatValuesToHumanReadableString(filteredNewValue);
  const oldValueFormatted = formatValuesToHumanReadableString(filteredOldValue);

  // Create a change log entry.
  await db.changeLog.create({
    module,
    title,
    newValue: filteredNewValue,
    oldValue: filteredOldValue,
    formattedNewValue: newValueFormatted,
    formattedOldValue: oldValueFormatted,
    referenceId,
    referenceModel,
    description: description,
  });
};
