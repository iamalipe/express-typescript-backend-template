export const mongoIdRegex = /^[0-9a-fA-F]{24}$/;

/**
 * The function `getObjectKeys` recursively retrieves all keys of an object, including nested keys with
 * dot notation.
 * @param obj - The `obj` parameter in the `getObjectKeys` function is an object with string keys and
 * values of any type.
 * @param [parentKey] - The `parentKey` parameter in the `getObjectKeys` function is used to keep track
 * of the parent keys as the function recursively traverses through nested objects. It is a string that
 * represents the key of the parent object in the current recursive call. If the current object being
 * processed is a nested object
 * @returns The `getObjectKeys` function returns an array of strings representing the keys of the input
 * object `obj`, including nested keys if the values are objects.
 */
export const getObjectKeys = (obj: { [key: string]: any }, parentKey = '') => {
  const keys: string[] = [];

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const fullKey = parentKey ? `${parentKey}.${key}` : key;

      if (
        typeof obj[key] === 'object' &&
        obj[key] !== null &&
        !Array.isArray(obj[key])
      ) {
        keys.push(...getObjectKeys(obj[key], fullKey));
      } else {
        keys.push(fullKey);
      }
    }
  }

  return keys;
};

/**
 * Generates a URL-friendly slug from a given string.
 *
 * A slug is a simplified, human-readable, URL-friendly version of a string,
 * typically used in web addresses. This function performs the following transformations:
 * 1. Converts the string to lowercase.
 * 2. Replaces any non-alphanumeric characters (excluding hyphens and spaces) with a single hyphen.
 * 3. Replaces spaces with hyphens.
 * 4. Trims leading/trailing hyphens.
 * 5. Replaces multiple consecutive hyphens with a single hyphen.
 *
 * @param {string} text The input string to convert into a slug.
 * @returns {string} The generated URL-friendly slug.
 */
export function generateSlug(text: string) {
  // 1. Convert the string to lowercase.
  let slug = text.toLowerCase();

  // 2. Replace any non-alphanumeric characters (excluding hyphens and spaces) with a single hyphen.
  //    [^\w\s-] matches any character that is NOT a word character (a-z, A-Z, 0-9, _),
  //    nor a whitespace character, nor a hyphen.
  slug = slug.replace(/[^\w\s-]/g, '-');

  // 3. Replace spaces with hyphens.
  slug = slug.replace(/\s+/g, '-');

  // 4. Replace multiple consecutive hyphens with a single hyphen.
  slug = slug.replace(/--+/g, '-');

  // 5. Trim leading and trailing hyphens.
  slug = slug.replace(/^-+|-+$/g, '');

  return slug;
}
