// Make sure you have this model file created with the schema you provided
import { Request, Response } from 'express';
import { db } from '../../services/db.services';
import { NLU } from './ai.service';
/**
 * Handles the main logic for the agent:
 * 1. Receives the query.
 * 2. Sends it to the NLU service.
 * 3. Executes the determined action.
 * 4. Returns a natural language response.
 */
export async function handleAgentQuery(req: Request, res: Response) {
  const { query } = req.body;

  if (!query) {
    return res.status(400).json({ error: 'Query and userId are required.' });
  }

  try {
    // 1. Get structured intent and entities from the AI
    const structuredIntent = await NLU.getIntentAndEntities(query);
    console.log('NLU Response:', structuredIntent); // For debugging

    // 2. Execute the corresponding database action
    const result = await executeAction(structuredIntent, req.user.id);

    // 3. Send back a user-friendly response
    res.json({ response: result });
  } catch (error) {
    console.error('Agent Error:', error);
    res.status(500).json({
      response:
        "I'm sorry, I encountered an error and couldn't complete your request.",
    });
  }
}

async function executeAction(structuredIntent: any, userId: string) {
  const { intent, entities, filters } = structuredIntent;

  // Always scope actions by the logged-in user for security
  const baseFilters = { ...filters, userId };

  try {
    switch (intent) {
      case 'CREATE_PRODUCT':
        if (!entities.name || !entities.price || !entities.category) {
          return 'To create a product, I need at least a name, price, and category. Please provide the missing details.';
        }
        const newProduct = await db.product.create({ ...entities, userId });
        return `Successfully created the new product: "${newProduct.name}".`;

      case 'FIND_PRODUCT':
        const products = await db.product.find(baseFilters).limit(20); // Add a limit to avoid huge responses
        if (products.length === 0) {
          return "I couldn't find any products matching your criteria.";
        }
        const productNames = products.map((p) => p.name).join(', ');
        return `I found ${products.length} products: ${productNames}.`;

      case 'UPDATE_PRODUCT':
        if (!filters || Object.keys(filters).length === 0) {
          return 'I need to know which product to update. Please specify a name or another unique identifier in your query.';
        }
        const updateResult = await db.product.updateMany(baseFilters, {
          $set: entities,
        });
        if (updateResult.matchedCount === 0) {
          return "I couldn't find any products to update with that criteria.";
        }
        return `Successfully updated ${updateResult.modifiedCount} product(s).`;

      case 'DELETE_PRODUCT':
        if (!filters || Object.keys(filters).length === 0) {
          return "Please specify which product(s) you'd like to delete.";
        }
        const deleteResult = await db.product.deleteMany(baseFilters);
        if (deleteResult.deletedCount === 0) {
          return "I couldn't find any products to delete with that criteria.";
        }
        return `Deleted ${deleteResult.deletedCount} product(s).`;

      case 'ANALYZE_DATA':
        const count = await db.product.countDocuments(baseFilters);
        return `There are ${count} products matching your criteria.`;

      case 'UNKNOWN':
        return "I'm sorry, I'm designed to manage products. I can't help with that request.";

      default:
        return "I'm not sure how to handle that. Please try rephrasing your request.";
    }
  } catch (error: any) {
    // Catch Mongoose validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors)
        .map((e: any) => e.message)
        .join(' ');
      return `There was a problem with the data you provided: ${messages}`;
    }
    console.error('Database action error:', error);
    throw error; // Re-throw to be caught by the main try-catch block
  }
}
