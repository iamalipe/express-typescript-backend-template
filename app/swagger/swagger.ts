export const swaggerSpec = {
  openapi: '3.0.0',
  info: {
    title: 'Express TypeScript Backend API',
    version: '1.0.0',
    description:
      'Modern full-stack TypeScript template API documentation powered by Scalar.',
    contact: {
      name: 'API Support',
      email: 'Abhiseck@outlook.com',
    },
  },
  servers: [
    {
      url: 'http://localhost:3000',
      description: 'Local Development Server',
    },
  ],
  tags: [
    { name: 'Auth', description: 'Authentication and Passkey management' },
    { name: 'Product', description: 'Product catalog operations' },
    {
      name: 'General',
      description: 'Utility, changelog, and metadata operations',
    },
  ],
  security: [
    {
      bearerAuth: [],
    },
  ],
  paths: {
    '/': {
      get: {
        summary: 'Root check',
        description: 'Verify if the API server is up and reachable.',
        tags: ['General'],
        responses: {
          200: {
            description: 'Welcome message from the API',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: {
                      type: 'string',
                      example: 'Welcome to Express TypeScript Template API!',
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/healthcheck': {
      get: {
        summary: 'Health check',
        description:
          'Get health check status of the application, database, and cache connections.',
        tags: ['General'],
        responses: {
          200: {
            description: 'System is healthy',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    uptime: { type: 'number', example: 124.5 },
                    timestamp: {
                      type: 'string',
                      example: '2026-06-28T18:15:00.000Z',
                    },
                    message: { type: 'string', example: 'success' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/auth/register': {
      post: {
        summary: 'Register User',
        description:
          'Create a new user account with email, name, and password.',
        tags: ['Auth'],
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'name', 'password'],
                properties: {
                  email: {
                    type: 'string',
                    format: 'email',
                    example: 'user@example.com',
                  },
                  name: { type: 'string', minLength: 2, example: 'John Doe' },
                  password: {
                    type: 'string',
                    minLength: 6,
                    example: 'password123',
                  },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'User registered successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/User' },
                    message: { type: 'string', example: 'success' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/auth/login': {
      post: {
        summary: 'Login User',
        description:
          'Authenticate user with email and password to receive access cookies/tokens.',
        tags: ['Auth'],
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: {
                    type: 'string',
                    format: 'email',
                    example: 'user@example.com',
                  },
                  password: { type: 'string', example: 'password123' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Login successful',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/User' },
                    message: { type: 'string', example: 'success' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/auth/me': {
      get: {
        summary: 'Get Current User Profile',
        description: 'Retrieve details of the currently logged-in user.',
        tags: ['Auth'],
        responses: {
          200: {
            description: 'Current user data',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/User' },
                    message: { type: 'string', example: 'success' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/auth/logout': {
      get: {
        summary: 'Logout User',
        description: 'Clear authentication cookies and terminate session.',
        tags: ['Auth'],
        responses: {
          200: {
            description: 'Logout successful',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'success' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/auth/profile-image': {
      put: {
        summary: 'Update Profile Image',
        description: 'Upload a new profile image (PNG/JPEG) to S3.',
        tags: ['Auth'],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['profileImage'],
                properties: {
                  profileImage: {
                    type: 'string',
                    format: 'binary',
                    description: 'Image file to upload (JPEG or PNG, max 10MB)',
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Image uploaded successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        imageUrl: {
                          type: 'string',
                          example:
                            'https://s3.amazonaws.com/bucket/profile-image/123.jpg',
                        },
                      },
                    },
                    message: { type: 'string', example: 'success' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/product': {
      post: {
        summary: 'Create Product',
        description: 'Create a new product listing.',
        tags: ['Product'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'description', 'category', 'price'],
                properties: {
                  name: {
                    type: 'string',
                    example: 'Premium Mechanical Keyboard',
                  },
                  description: {
                    type: 'string',
                    example: 'Tactile switches with RGB backlight.',
                  },
                  category: { type: 'string', example: 'Electronics' },
                  price: { type: 'number', example: 129.99 },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Product created successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/Product' },
                    message: { type: 'string', example: 'success' },
                  },
                },
              },
            },
          },
        },
      },
      get: {
        summary: 'Get All Products',
        description:
          'Retrieve a paginated, sorted, and searchable list of products.',
        tags: ['Product'],
        parameters: [
          {
            name: 'page',
            in: 'query',
            required: false,
            schema: { type: 'string', default: '1' },
          },
          {
            name: 'limit',
            in: 'query',
            required: false,
            schema: { type: 'string', default: '10' },
          },
          {
            name: 'order',
            in: 'query',
            required: false,
            schema: { type: 'string', enum: ['asc', 'desc'], default: 'desc' },
          },
          {
            name: 'orderBy',
            in: 'query',
            required: false,
            schema: { type: 'string', default: 'createdAt' },
          },
          {
            name: 'search',
            in: 'query',
            required: false,
            schema: { type: 'string' },
          },
        ],
        responses: {
          200: {
            description: 'List of products',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Product' },
                    },
                    sort: { type: 'object' },
                    pagination: { type: 'object' },
                    message: { type: 'string', example: 'success' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/product/many': {
      post: {
        summary: 'Bulk Create Products',
        description: 'Create multiple product listings in a single payload.',
        tags: ['Product'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  type: 'object',
                  required: ['name', 'description', 'category', 'price'],
                  properties: {
                    name: { type: 'string', example: 'Product A' },
                    description: {
                      type: 'string',
                      example: 'Description of A',
                    },
                    category: { type: 'string', example: 'Category X' },
                    price: { type: 'number', example: 10.99 },
                  },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Bulk creation results',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        success: { type: 'array', items: { type: 'object' } },
                        failed: { type: 'array', items: { type: 'object' } },
                      },
                    },
                    message: { type: 'string', example: 'success' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/product/{id}': {
      get: {
        summary: 'Get Product By ID',
        description: 'Retrieve a single product details.',
        tags: ['Product'],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          200: {
            description: 'Product details',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/Product' },
                    message: { type: 'string', example: 'success' },
                  },
                },
              },
            },
          },
        },
      },
      put: {
        summary: 'Update Product',
        description: 'Update selective properties of a product.',
        tags: ['Product'],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  description: { type: 'string' },
                  category: { type: 'string' },
                  price: { type: 'number' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Product updated successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/Product' },
                    message: { type: 'string', example: 'success' },
                  },
                },
              },
            },
          },
        },
      },
      delete: {
        summary: 'Delete Product',
        description: 'Remove a product listing by ID.',
        tags: ['Product'],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          200: {
            description: 'Product deleted successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'success' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/change-log': {
      get: {
        summary: 'Get Changelogs',
        description: 'Retrieve a list of change log entries.',
        tags: ['General'],
        security: [],
        parameters: [
          {
            name: 'page',
            in: 'query',
            required: false,
            schema: { type: 'string', default: '1' },
          },
          {
            name: 'limit',
            in: 'query',
            required: false,
            schema: { type: 'string', default: '10' },
          },
        ],
        responses: {
          200: {
            description: 'List of changelogs',
          },
        },
      },
    },
    '/api/change-log/{id}': {
      get: {
        summary: 'Get Changelog By ID',
        description: 'Retrieve detail of a specific changelog entry.',
        tags: ['General'],
        security: [],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          200: {
            description: 'Changelog details',
          },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description:
          'Enter your JWT authorization token (exclude the Bearer prefix).',
      },
    },
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', example: '60c72b2f9b1d8e001c888888' },
          email: {
            type: 'string',
            format: 'email',
            example: 'user@example.com',
          },
          name: { type: 'string', example: 'John Doe' },
          profileImage: {
            type: 'string',
            example: 'https://s3.amazonaws.com/bucket/profile-image/123.jpg',
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            example: '2026-06-28T18:15:00.000Z',
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            example: '2026-06-28T18:15:00.000Z',
          },
        },
      },
      Product: {
        type: 'object',
        properties: {
          id: { type: 'string', example: '60c72b2f9b1d8e001c888889' },
          name: { type: 'string', example: 'Premium Mechanical Keyboard' },
          description: {
            type: 'string',
            example: 'Tactile switches with RGB backlight.',
          },
          category: { type: 'string', example: 'Electronics' },
          price: { type: 'number', example: 129.99 },
          userId: { type: 'string', example: '60c72b2f9b1d8e001c888888' },
          createdAt: {
            type: 'string',
            format: 'date-time',
            example: '2026-06-28T18:15:00.000Z',
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            example: '2026-06-28T18:15:00.000Z',
          },
        },
      },
    },
  },
};
