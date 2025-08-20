import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'University Library API',
      version: '1.0.0',
      description: 'Universitet kutubxonasi uchun REST API dokumentatsiyasi',
      contact: {
        name: 'API Support',
        email: 'support@university.com',
      },
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        // Auth Schemas
        CreateUserInput: {
          type: 'object',
          required: ['firstName', 'lastName', 'email', 'password'],
          properties: {
            firstName: {
              type: 'string',
              example: 'John',
              description: 'Foydalanuvchining ismi',
            },
            lastName: {
              type: 'string',
              example: 'Doe',
              description: 'Foydalanuvchining familiyasi',
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'johndoe@example.com',
              description: 'Foydalanuvchining email manzili',
            },
            password: {
              type: 'string',
              example: 'strongpassword123',
              description: 'Foydalanuvchining paroli (minimal 6 ta belgi)',
            },
            role: {
              type: 'string',
              enum: ['USER', 'LIBRARIAN'],
              default: 'USER',
              description: 'Foydalanuvchining roli',
            },
          },
        },
        LoginInput: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              example: 'librarian@university.com',
              description: 'Foydalanuvchining email manzili',
            },
            password: {
              type: 'string',
              example: 'SuperStrongPassword123',
              description: 'Foydalanuvchining paroli',
            },
          },
        },
        ChangePasswordInput: {
          type: 'object',
          required: ['currentPassword', 'newPassword', 'confirmNewPassword'],
          properties: {
            currentPassword: {
              type: 'string',
              example: 'oldpassword123',
              description: 'Joriy parol',
            },
            newPassword: {
              type: 'string',
              example: 'newpassword123',
              description: 'Yangi parol (minimal 6 ta belgi)',
              minLength: 6,
            },
            confirmNewPassword: {
              type: 'string',
              example: 'newpassword123',
              description: 'Yangi parolni tasdiqlash',
            },
          },
        },
        // Category Schemas
        CreateCategoryInput: {
          type: 'object',
          required: ['name'],
          properties: {
            name: {
              type: 'string',
              example: 'Badiiy Adabiyot',
              description: 'Kategoriya nomi',
            },
            description: {
              type: 'string',
              example: 'Jahon adabiyoti durdonalari',
              description: "Kategoriya haqida qisqacha ma'lumot",
            },
          },
        },
        UpdateCategoryInput: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Kategoriya nomi',
            },
            description: {
              type: 'string',
              description: "Kategoriya haqida qisqacha ma'lumot",
            },
          },
        },
        // Book Schemas
        CreateCommentInput: {
          type: 'object',
          required: ['comment'],
          properties: {
            comment: {
              type: 'string',
              example: 'Ajoyib kitob!',
              description: 'Kitob haqida izoh',
            },
            rating: {
              type: 'integer',
              minimum: 1,
              maximum: 5,
              example: 5,
              description: 'Kitobga baho (1 dan 5 gacha)',
            },
          },
        },
        // Loan Schemas
        CreateLoanInput: {
          type: 'object',
          required: ['bookId', 'userId'],
          properties: {
            bookId: {
              type: 'string',
              format: 'uuid',
              description: 'Kitobning unikal identifikatori',
            },
            userId: {
              type: 'string',
              format: 'uuid',
              description: 'Foydalanuvchining unikal identifikatori',
            },
          },
        },
        // Suggestion Schemas
        CreateSuggestionInput: {
          type: 'object',
          required: ['title'],
          properties: {
            title: {
              type: 'string',
              example: 'Sapiens: A Brief History of Humankind',
              description: 'Taklif qilinayotgan kitob nomi',
            },
            author: {
              type: 'string',
              example: 'Yuval Noah Harari',
              description: 'Kitob muallifi',
            },
            note: {
              type: 'string',
              description: "Qo'shimcha izohlar",
            },
          },
        },
        UpdateSuggestionStatusInput: {
          type: 'object',
          required: ['status'],
          properties: {
            status: {
              type: 'string',
              enum: ['PENDING', 'APPROVED', 'REJECTED'],
              example: 'APPROVED',
              description: 'Taklif holati',
            },
          },
        },
        // Fine Schemas
        Fine: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Jarimaning unikal IDsi',
            },
            amount: {
              type: 'number',
              format: 'decimal',
              description: 'Jarima miqdori',
            },
            reason: {
              type: 'string',
              description: 'Jarima sababi',
            },
            isPaid: {
              type: 'boolean',
              description: "To'langan holati",
            },
            paidAt: {
              type: 'string',
              format: 'date-time',
              description: "To'langan vaqti",
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Yaratilgan vaqt',
            },
            user: {
              type: 'object',
              properties: {
                id: {
                  type: 'string',
                  format: 'uuid',
                },
                firstName: {
                  type: 'string',
                },
                lastName: {
                  type: 'string',
                },
              },
              description: "Foydalanuvchi ma'lumotlari",
            },
            loan: {
              type: 'object',
              properties: {
                id: {
                  type: 'string',
                  format: 'uuid',
                },
                book: {
                  type: 'object',
                  properties: {
                    id: {
                      type: 'string',
                      format: 'uuid',
                    },
                    title: {
                      type: 'string',
                    },
                  },
                },
              },
              description: "Ijara ma'lumotlari",
            },
          },
        },
        // Error Schema
        Error: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              description: 'Xatolik haqida xabar',
            },
            statusCode: {
              type: 'integer',
              description: 'HTTP status kod',
            },
          },
        },
      },
      parameters: {
        loanId: {
          in: 'path',
          name: 'id',
          required: true,
          schema: { type: 'string', format: 'uuid' },
          description: 'Iajaraning unikal IDsi',
        },
        bookId: {
          in: 'path',
          name: 'id',
          required: true,
          schema: { type: 'string', format: 'uuid' },
          description: 'Kitobning unikal IDsi',
        },
        fineId: {
          in: 'path',
          name: 'id',
          required: true,
          schema: { type: 'string', format: 'uuid' },
          description: 'Jarimaning unikal IDsi',
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./src/api/**/*.ts'],
};

export const swaggerSpecs = swaggerJsdoc(options);
