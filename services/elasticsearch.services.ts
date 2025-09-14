import { Client } from '@elastic/elasticsearch';
import { IProduct } from '../app/product/product.model';
import {
  ELASTIC_HOST,
  ELASTIC_PASSWORD,
  ELASTIC_USERNAME,
} from '../config/default';
import { logger } from '../utils/logger';

export const esClient = new Client({
  node: ELASTIC_HOST,
  auth: {
    username: ELASTIC_USERNAME, // only if security is enabled
    password: ELASTIC_PASSWORD,
  },
});

// Product index name
export const ES_PRODUCT_INDEX = 'products';

// Initialize product index if it doesn't exist
export const initProductIndex = async () => {
  const indexExists = await esClient.indices.exists({
    index: ES_PRODUCT_INDEX,
  });
  if (indexExists) {
    logger.info(`ES : Index ${ES_PRODUCT_INDEX} already exists`);
    return;
  }

  await esClient.indices.create({
    index: ES_PRODUCT_INDEX,
    body: {
      mappings: {
        properties: {
          name: {
            type: 'text',
            analyzer: 'standard',
            fields: { keyword: { type: 'keyword' } },
          },
          description: { type: 'text', analyzer: 'standard' },
          category: {
            type: 'text',
            analyzer: 'standard',
            fields: { keyword: { type: 'keyword' } },
          },
          price: { type: 'float' },
          userId: { type: 'keyword' },
          createdAt: { type: 'date' },
          updatedAt: { type: 'date' },
        },
      },
    },
  });
  logger.info(`ES : Created index: ${ES_PRODUCT_INDEX}`);
};

export const initElasticsearch = async () => {
  await initProductIndex();
};

// Index a single product
export const indexProduct = async (product: IProduct) => {
  const productDoc = {
    id: product.id,
    name: product.name,
    description: product.description,
    category: product.category,
    price: product.price,
    userId: product.userId,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };

  await esClient.index({
    index: ES_PRODUCT_INDEX,
    id: product.id,
    document: productDoc,
    refresh: true, // Make the document immediately searchable
  });

  return productDoc;
};

// Bulk index multiple products
export const bulkIndexProducts = async (_products: IProduct[]) => {
  const jsonData = JSON.stringify(_products);
  const products = JSON.parse(jsonData) as IProduct[];

  if (products.length === 0) return [];

  const operations = products.flatMap((product) => [
    { index: { _index: ES_PRODUCT_INDEX, _id: product._id } },
    {
      id: product._id,
      name: product.name,
      description: product.description,
      category: product.category,
      price: product.price,
      userId: product.userId,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    },
  ]);

  const response = await esClient.bulk({ operations, refresh: true });
  return response;
};

// Update a product in the index
export const updateIndexedProduct = async (
  productId: string,
  updates: Partial<IProduct>,
) => {
  await esClient.update({
    index: ES_PRODUCT_INDEX,
    id: productId,
    doc: updates,
    refresh: true,
  });
};

// Delete a product from the index
export const deleteIndexedProduct = async (productId: string) => {
  await esClient.delete({
    index: ES_PRODUCT_INDEX,
    id: productId,
    refresh: true,
  });
};

// Search products
export const searchProducts = async (
  query: string,
  options: {
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    userId?: string;
    page?: number;
    limit?: number;
    sortField?: string;
    sortOrder?: 'asc' | 'desc';
  },
) => {
  const {
    category,
    minPrice,
    maxPrice,
    userId,
    page = 1,
    limit = 10,
    sortField = 'createdAt',
    sortOrder = 'desc',
  } = options;

  const must: any[] = [];

  // Add text search if query is provided
  if (query) {
    must.push({
      multi_match: {
        query,
        fields: ['name^3', 'description', 'category^2'],
        fuzziness: 'AUTO',
      },
    });
  }

  // Add filters
  const filter: any[] = [];

  if (category) {
    filter.push({ term: { 'category.keyword': category } });
  }

  if (userId) {
    filter.push({ term: { userId } });
  }

  // Price range filter
  if (minPrice !== undefined || maxPrice !== undefined) {
    const range: any = { price: {} };
    if (minPrice !== undefined) range.price.gte = minPrice;
    if (maxPrice !== undefined) range.price.lte = maxPrice;
    filter.push({ range });
  }

  const searchBody: any = {
    from: (page - 1) * limit,
    size: limit,
    sort: [{ [sortField]: { order: sortOrder } }],
    query: {
      bool: {
        must,
        filter,
      },
    },
  };

  const response = await esClient.search({
    index: ES_PRODUCT_INDEX,
    body: searchBody,
  });

  const hits = response.hits.hits;
  const total = response.hits.total as { value: number };

  return {
    products: hits.map((hit) => hit._source),
    pagination: {
      total: total.value,
      page,
      limit,
      pages: Math.ceil(total.value / limit),
    },
  };
};
