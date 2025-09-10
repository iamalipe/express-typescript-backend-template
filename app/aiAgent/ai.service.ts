import { GoogleGenerativeAI } from '@google/generative-ai';
import { z } from 'zod';

// Zod Schemas for validating the AI's output
const productEntitiesSchema = z
  .object({
    name: z.string().optional(),
    price: z.number().optional(),
    category: z
      .enum([
        'Electronics',
        'Clothing',
        'Books',
        'Home & Garden',
        'Sports',
        'Beauty',
        'Automotive',
        'Toys',
        'Food & Beverage',
        'Health',
      ])
      .optional(),
    description: z.string().optional(),
  })
  .loose(); // Allows other properties

const productFiltersSchema = z
  .object({
    name: z.string().optional(),
    price: z
      .union([
        z.number(),
        z.object({
          $lt: z.number().optional(),
          $gt: z.number().optional(),
          $lte: z.number().optional(),
          $gte: z.number().optional(),
        }),
      ])
      .optional(),
    category: z.string().optional(),
  })
  .loose(); // Allows other properties

const intentSchema = z.object({
  intent: z.enum([
    'CREATE_PRODUCT',
    'FIND_PRODUCT',
    'UPDATE_PRODUCT',
    'DELETE_PRODUCT',
    'ANALYZE_DATA',
    'UNKNOWN',
  ]),
  entities: productEntitiesSchema,
  filters: productFiltersSchema,
  query_summary: z.string(),
  analysis_type: z.string().optional(),
});

// Initialize the Google Generative AI client
const genAI = new GoogleGenerativeAI(
  process.env.GOOGLE_GEMINI_API_KEY as string,
);

async function getIntentAndEntities(userQuery: string) {
  // For text-only input, use the gemini-2.5-flash-preview-05-20 model
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash-preview-05-20',
  });

  const systemPrompt = `
    You are an intelligent database assistant for an e-commerce platform.
    Your task is to understand a user's request and convert it into a structured JSON object. Your output MUST be a valid JSON object and nothing else.

    The user will interact with a "Product" collection with the following schema:
    - name: string (You must identify this for updates/deletes)
    - category: 'Electronics' | 'Clothing' | 'Books' | 'Home & Garden' | 'Sports' | 'Beauty' | 'Automotive' | 'Toys' | 'Food & Beverage' | 'Health'
    - price: number
    - description: string

    Based on the user's query, determine the intent and extract entities.

    Possible intents are: 'CREATE_PRODUCT', 'FIND_PRODUCT', 'UPDATE_PRODUCT', 'DELETE_PRODUCT', 'ANALYZE_DATA', 'UNKNOWN'.

    JSON Output Structure:
    {
      "intent": "INTENT_NAME",
      "entities": {
        // key-value pairs of extracted data for creation or updates
      },
      "filters": {
        // for FIND, UPDATE, DELETE queries (e.g., price: { "$lt": 20 }, name: "Laptop")
      },
      "query_summary": "A brief summary of what the user wants to do."
    }

    Examples:
    - User: "add a new gaming laptop for $1500 in electronics. description is: high performance laptop"
      JSON: { "intent": "CREATE_PRODUCT", "entities": { "name": "gaming laptop", "price": 1500, "category": "Electronics", "description": "high performance laptop" }, "filters": {}, "query_summary": "Create a new product." }
    - User: "find all books cheaper than $20"
      JSON: { "intent": "FIND_PRODUCT", "entities": {}, "filters": { "category": "Books", "price": { "$lt": 20 } }, "query_summary": "Find books with price less than 20." }
    - User: "update the price of the 'gaming laptop' to 1450"
      JSON: { "intent": "UPDATE_PRODUCT", "entities": { "price": 1450 }, "filters": { "name": "gaming laptop" }, "query_summary": "Update product price." }
    - User: "how many products are in the clothing category?"
      JSON: { "intent": "ANALYZE_DATA", "entities": {}, "filters": { "category": "Clothing"}, "analysis_type": "count", "query_summary": "Count products in a category." }
    - User: "what's the weather like?"
      JSON: { "intent": "UNKNOWN", "entities": {}, "filters": {}, "query_summary": "User asked an unrelated question." }
  `;

  try {
    const result = await model.generateContent([systemPrompt, userQuery]);
    const response = result.response;
    const jsonString = response
      .text()
      .replace(/```json|```/g, '')
      .trim();

    const parsedJson = JSON.parse(jsonString);

    // Validate the JSON object against our Zod schema
    const validatedData = intentSchema.parse(parsedJson);

    return validatedData;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Zod validation error:', error);
      throw new Error('The AI returned data in an unexpected format.');
    }
    console.error(
      'Error communicating with or parsing from Gemini API:',
      error,
    );
    throw new Error('Failed to understand the query.');
  }
}

// Encapsulate NLU logic into an exportable object
export const NLU = {
  getIntentAndEntities,
};
