export const swaggerSpec = {
  openapi: '3.0.0',
  info: {
    title: 'Express TypeScript Backend API',
    version: '1.0.0',
    description: 'Modern full-stack TypeScript template API documentation powered by Scalar.',
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
    { name: 'CopyMe', description: 'Copy-Me reference template operations' },
    { name: 'Chat', description: 'AI assistant chat streams' },
    { name: 'General', description: 'Utility, changelog, and metadata operations' },
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
                    message: { type: 'string', example: 'Welcome to Express TypeScript Template API!' },
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
        description: 'Get health check status of the application, database, and cache connections.',
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
                    timestamp: { type: 'string', example: '2026-06-28T18:15:00.000Z' },
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
        description: 'Create a new user account with email, name, and password.',
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
                  email: { type: 'string', format: 'email', example: 'user@example.com' },
                  name: { type: 'string', minLength: 2, example: 'John Doe' },
                  password: { type: 'string', minLength: 6, example: 'password123' },
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
        description: 'Authenticate user with email and password to receive access cookies/tokens.',
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
                  email: { type: 'string', format: 'email', example: 'user@example.com' },
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
                        imageUrl: { type: 'string', example: 'https://s3.amazonaws.com/bucket/profile-image/123.jpg' },
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
    '/api/auth/passkey/register': {
      post: {
        summary: 'Register Passkey Option',
        description: 'Generate registration options for adding a WebAuthn passkey.',
        tags: ['Auth'],
        responses: {
          200: {
            description: 'Passkey registration options',
          },
        },
      },
    },
    '/api/auth/passkey/register-verify': {
      post: {
        summary: 'Verify Passkey Registration',
        description: 'Verify the credentials payload sent by the WebAuthn client registration flow.',
        tags: ['Auth'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Passkey registered successfully',
          },
        },
      },
    },
    '/api/auth/passkey/login': {
      post: {
        summary: 'Initiate Passkey Login',
        description: 'Generate WebAuthn assertion authentication options for passkey sign-in.',
        tags: ['Auth'],
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email'],
                properties: {
                  email: { type: 'string', format: 'email', example: 'user@example.com' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Passkey assertion options generated',
          },
        },
      },
    },
    '/api/auth/passkey/login-verify': {
      post: {
        summary: 'Verify Passkey Login',
        description: 'Verify the credentials payload sent by the WebAuthn client login flow.',
        tags: ['Auth'],
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'body'],
                properties: {
                  email: { type: 'string', format: 'email', example: 'user@example.com' },
                  body: { type: 'object' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Passkey login successful',
          },
        },
      },
    },
    '/api/copy-me': {
      post: {
        summary: 'Create CopyMe Record',
        description: 'Create a new copy-me mock record.',
        tags: ['CopyMe'],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['stringRequired', 'stringTextarea', 'numberDecimal', 'numberInt', 'numberSlider', 'dateOnly', 'dateTime'],
                properties: {
                  stringRequired: { type: 'string', example: 'Ref string' },
                  stringTextarea: { type: 'string', example: 'A long multiline textarea text' },
                  stringOptional: { type: 'string', example: 'Optional value' },
                  stringTextareaOptional: { type: 'string', example: 'Optional textarea value' },
                  numberDecimal: { type: 'number', example: 12.34 },
                  numberInt: { type: 'integer', example: 42 },
                  numberSlider: { type: 'integer', minimum: 0, maximum: 100, example: 50 },
                  dateOnly: { type: 'string', format: 'date', example: '2026-07-10' },
                  dateTime: { type: 'string', format: 'date-time', example: '2026-07-10T15:30:00Z' },
                  dateRangeStart: { type: 'string', format: 'date', example: '2026-07-10' },
                  dateRangeEnd: { type: 'string', format: 'date', example: '2026-07-12' },
                  dateTimeRangeStart: { type: 'string', format: 'date-time', example: '2026-07-10T10:00:00Z' },
                  dateTimeRangeEnd: { type: 'string', format: 'date-time', example: '2026-07-10T12:00:00Z' },
                  booleanSwitch: { type: 'boolean', example: true },
                  enumString: { type: 'string', enum: ['Active', 'Inactive', 'Block', 'Pending'], example: 'Pending' },
                  customOptionalString: { type: 'string', example: 'P1' },
                  fileImage: { type: 'string', format: 'binary' },
                  fileDoc: { type: 'string', format: 'binary' },
                  singleArray: { type: 'array', items: { type: 'string' }, example: ['tag1', 'tag2'] },
                  arrayObject: { type: 'array', items: { type: 'object' }, example: [{ label: 'Key', value: 'Val' }] },
                  twoDArray: { type: 'array', items: { type: 'array', items: { type: 'number' } }, example: [[1, 2], [3, 4]] },
                  nestedObject: { type: 'object', properties: { title: { type: 'string' }, priority: { type: 'integer' } }, example: { title: 'Nested', priority: 1 } },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Record created successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/CopyMe' },
                    message: { type: 'string', example: 'success' },
                  },
                },
              },
            },
          },
        },
      },
      get: {
        summary: 'Get All CopyMe Records',
        description: 'Retrieve a paginated, sorted, and searchable list of copy-me records.',
        tags: ['CopyMe'],
        parameters: [
          { name: 'page', in: 'query', required: false, schema: { type: 'string', default: '1' } },
          { name: 'limit', in: 'query', required: false, schema: { type: 'string', default: '10' } },
          { name: 'order', in: 'query', required: false, schema: { type: 'string', enum: ['asc', 'desc'], default: 'desc' } },
          { name: 'orderBy', in: 'query', required: false, schema: { type: 'string', default: 'createdAt' } },
          { name: 'search', in: 'query', required: false, schema: { type: 'string' } },
        ],
        responses: {
          200: {
            description: 'List of records',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { type: 'array', items: { $ref: '#/components/schemas/CopyMe' } },
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
    '/api/copy-me/many': {
      post: {
        summary: 'Bulk Create CopyMe Records',
        description: 'Create multiple copy-me records in a single payload.',
        tags: ['CopyMe'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  type: 'object',
                  required: ['stringRequired', 'stringTextarea'],
                  properties: {
                    stringRequired: { type: 'string', example: 'Record A' },
                    stringTextarea: { type: 'string', example: 'Text area content' },
                  },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Records created successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { type: 'object' },
                    message: { type: 'string', example: 'success' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/copy-me/{id}': {
      get: {
        summary: 'Get CopyMe Record By ID',
        description: 'Retrieve a single copy-me record details.',
        tags: ['CopyMe'],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: {
            description: 'Record details',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/CopyMe' },
                    message: { type: 'string', example: 'success' },
                  },
                },
              },
            },
          },
        },
      },
      put: {
        summary: 'Update CopyMe Record',
        description: 'Update selective properties of a copy-me record.',
        tags: ['CopyMe'],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  stringRequired: { type: 'string' },
                  stringTextarea: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Record updated successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/CopyMe' },
                    message: { type: 'string', example: 'success' },
                  },
                },
              },
            },
          },
        },
      },
      delete: {
        summary: 'Delete CopyMe Record',
        description: 'Remove a copy-me record by ID.',
        tags: ['CopyMe'],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: {
            description: 'Record deleted successfully',
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
          { name: 'page', in: 'query', required: false, schema: { type: 'string', default: '1' } },
          { name: 'limit', in: 'query', required: false, schema: { type: 'string', default: '10' } },
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
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: {
            description: 'Changelog details',
          },
        },
      },
    },
    '/api/ip/lookup': {
      get: {
        summary: 'IP Geolocation Lookup',
        description: 'Look up geographical and ISP information for a specific IP address.',
        tags: ['General'],
        security: [],
        parameters: [
          { name: 'ip', in: 'query', required: true, schema: { type: 'string' }, example: '8.8.8.8' },
        ],
        responses: {
          200: {
            description: 'IP geolocation info',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        ip: { type: 'string', example: '8.8.8.8' },
                        country: { type: 'string', example: 'United States' },
                        city: { type: 'string', example: 'Mountain View' },
                        isp: { type: 'string', example: 'Google LLC' },
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
    '/api/ip/update': {
      post: {
        summary: 'Update Geolocation Database',
        description: 'Manually trigger a download of the latest MaxMind IP database.',
        tags: ['General'],
        responses: {
          200: {
            description: 'Database download triggered',
          },
        },
      },
    },
    '/api/chat/temp': {
      post: {
        summary: 'Create Temporary Chat Stream',
        description: 'Create an anonymous, non-persisted AI chat session. Responds using SSE.',
        tags: ['Chat'],
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['messages'],
                properties: {
                  messages: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        role: { type: 'string', enum: ['user', 'assistant'] },
                        content: { type: 'string' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'SSE response stream',
          },
        },
      },
    },
    '/api/chat/new': {
      post: {
        summary: 'Create Authenticated Chat Stream',
        description: 'Start a new persisted chat thread and receive SSE stream responses.',
        tags: ['Chat'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['messages'],
                properties: {
                  messages: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        role: { type: 'string', enum: ['user', 'assistant'] },
                        content: { type: 'string' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'SSE response stream',
          },
        },
      },
    },
    '/api/chat/{id}': {
      post: {
        summary: 'Continue Chat Stream',
        description: 'Post a new user message to an existing persisted chat thread. Returns SSE responses.',
        tags: ['Chat'],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['messages'],
                properties: {
                  messages: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        role: { type: 'string', enum: ['user', 'assistant'] },
                        content: { type: 'string' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'SSE response stream',
          },
        },
      },
      get: {
        summary: 'Get Chat History Detail',
        description: 'Retrieve all messages in an existing chat thread.',
        tags: ['Chat'],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: {
            description: 'Chat details and message array',
          },
        },
      },
      put: {
        summary: 'Rename Chat Thread',
        description: 'Change the title of an existing chat thread.',
        tags: ['Chat'],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['title'],
                properties: {
                  title: { type: 'string', example: 'New Chat Title' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Chat updated successfully',
          },
        },
      },
      delete: {
        summary: 'Delete Chat Thread',
        description: 'Delete a chat thread and all associated messages.',
        tags: ['Chat'],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: {
            description: 'Chat thread deleted successfully',
          },
        },
      },
    },
    '/api/chat': {
      get: {
        summary: 'List Chat Threads',
        description: 'Retrieve a list of chat threads created by the logged-in user.',
        tags: ['Chat'],
        parameters: [
          { name: 'page', in: 'query', required: false, schema: { type: 'string', default: '1' } },
          { name: 'limit', in: 'query', required: false, schema: { type: 'string', default: '10' } },
        ],
        responses: {
          200: {
            description: 'List of chat threads',
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
        description: 'Enter your JWT authorization token (exclude the Bearer prefix).',
      },
    },
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', example: '60c72b2f9b1d8e001c888888' },
          email: { type: 'string', format: 'email', example: 'user@example.com' },
          name: { type: 'string', example: 'John Doe' },
          profileImage: { type: 'string', example: 'https://s3.amazonaws.com/bucket/profile-image/123.jpg' },
          createdAt: { type: 'string', format: 'date-time', example: '2026-06-28T18:15:00.000Z' },
          updatedAt: { type: 'string', format: 'date-time', example: '2026-06-28T18:15:00.000Z' },
        },
      },
      CopyMe: {
        type: 'object',
        properties: {
          id: { type: 'string', example: '60c72b2f9b1d8e001c888889' },
          stringRequired: { type: 'string', example: 'Ref string' },
          stringTextarea: { type: 'string', example: 'Multiline content' },
          numberDecimal: { type: 'number', example: 12.34 },
          numberInt: { type: 'integer', example: 42 },
          numberSlider: { type: 'integer', example: 50 },
          dateOnly: { type: 'string', format: 'date', example: '2026-07-10' },
          dateTime: { type: 'string', format: 'date-time', example: '2026-07-10T15:30:00Z' },
          booleanSwitch: { type: 'boolean', example: true },
          enumString: { type: 'string', example: 'Pending' },
          userId: { type: 'string', example: '60c72b2f9b1d8e001c888888' },
          createdAt: { type: 'string', format: 'date-time', example: '2026-06-28T18:15:00.000Z' },
          updatedAt: { type: 'string', format: 'date-time', example: '2026-06-28T18:15:00.000Z' },
        },
      },
    },
  },
};
