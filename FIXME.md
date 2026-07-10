# 🛠️ Backend Issues & Refactoring Requirements (FIXME)

This document outlines the security vulnerabilities, bugs, and design/performance inefficiencies identified in the **Product** backend module.

---

## 🚨 1. Security Vulnerabilities (IDOR & Tenant Isolation)

### A. Broken Object-Level Authorization (IDOR)
*   **Location**: [product.service.ts](file:///Users/abhiseck/Documents/Dev_Files/MyGithub/TEMPLATE/full-stack-typescript-template/express-typescript-backend-template/app/product/product.service.ts)
*   **Functions**: `updateOne`, `deleteOne`, `getOne`
*   **Description**: The requesting user's `userId` is passed from the controller into the service but is completely ignored. Any authenticated user can view, edit, or delete products belonging to other users simply by supplying the corresponding product `ObjectId` in the URL params.
*   **Fix**:
    Validate that the `userId` of the retrieved product document matches the `userId` of the requesting user before performing any read or write operations:
    ```typescript
    if (findResult.userId.toString() !== userId) {
      throw new AppError('Unauthorized', { status: 403 });
    }
    ```

### B. Missing Isolation in Listing Products
*   **Location**: `getAll` in [product.service.ts](file:///Users/abhiseck/Documents/Dev_Files/MyGithub/TEMPLATE/full-stack-typescript-template/express-typescript-backend-template/app/product/product.service.ts#L185)
*   **Description**: The filter block for `userId` is commented out. Consequently, calling `GET /api/product` returns products for all users.
*   **Fix**:
    Uncomment the query check to apply user isolation:
    ```typescript
    if (query.userId) {
      matchFilter.userId = new Types.ObjectId(query.userId);
    }
    ```

---

## 🔍 2. Search Discrepancies & Database Inefficiencies

### A. Bypassed Text Search Index
*   **Location**: [product.model.ts](file:///Users/abhiseck/Documents/Dev_Files/MyGithub/TEMPLATE/full-stack-typescript-template/express-typescript-backend-template/app/product/product.model.ts#L43-L47) vs. [product.service.ts](file:///Users/abhiseck/Documents/Dev_Files/MyGithub/TEMPLATE/full-stack-typescript-template/express-typescript-backend-template/app/product/product.service.ts#L201-L203)
*   **Description**: The model defines a text search index on `name`, `description`, and `category`. However, the service implements a regex-based match solely on the `name` field. This ignores the index, fails to search `description`/`category` fields (contrary to the query schema description), and triggers collection scans.
*   **Fix**:
    Refactor query filter to utilize MongoDB text search:
    ```typescript
    if (query.search) {
      matchFilter.$text = { $search: query.search };
    }
    ```

### B. Missing Mongoose Level Constraints
*   **Location**: [product.model.ts](file:///Users/abhiseck/Documents/Dev_Files/MyGithub/TEMPLATE/full-stack-typescript-template/express-typescript-backend-template/app/product/product.model.ts#L13-L41)
*   **Description**: Key fields (`name`, `description`, `category`, `price`) are not defined as `required: true` at the Mongoose level. 
*   **Fix**:
    Add `required: true` schema attributes to ensure database integrity if writes bypass Zod validation:
    ```typescript
    name: {
      type: String,
      required: true
    }
    ```

### C. Missing Supporting Query Indexes
*   **Location**: [product.model.ts](file:///Users/abhiseck/Documents/Dev_Files/MyGithub/TEMPLATE/full-stack-typescript-template/express-typescript-backend-template/app/product/product.model.ts)
*   **Description**: Operations checking uniqueness (e.g. on `createOne`/`createMany`) perform filtering on name, category, and userId.
*   **Fix**:
    Create a compound index such as `{ userId: 1, name: 1, category: 1 }` to speed up these queries.

### D. Suboptimal Aggregation Usage
*   **Location**: `getOne` in [product.service.ts](file:///Users/abhiseck/Documents/Dev_Files/MyGithub/TEMPLATE/full-stack-typescript-template/express-typescript-backend-template/app/product/product.service.ts#L168)
*   **Description**: The function makes a full single `$match` stage aggregation query which is less efficient and less readable than a direct lookup.
*   **Fix**:
    Replace with standard Mongoose `db.product.findById(id)`.

---

## 🤖 3. AI Tools Implementation Issues

### A. Hardcoded `userId`
*   **Location**: AI tools in [product.service.ts](file:///Users/abhiseck/Documents/Dev_Files/MyGithub/TEMPLATE/full-stack-typescript-template/express-typescript-backend-template/app/product/product.service.ts#L240)
*   **Description**: AI tools (e.g., `createOneProductAITool`) declare `const userId: any = ''` with a `// FIXME later` comment. Running these tools fails or creates invalid orphaned entries.
*   **Fix**: Ensure `userId` is supplied or retrieved contextually.

### B. HTTP Schema Leakage in AI Tools
*   **Location**: AI tools in [product.service.ts](file:///Users/abhiseck/Documents/Dev_Files/MyGithub/TEMPLATE/full-stack-typescript-template/express-typescript-backend-template/app/product/product.service.ts#L240)
*   **Description**: Reusing raw Express query/body Zod validators for AI tool schemas forces the model to construct redundant nested request shapes (e.g., `{ body: { ... } }`).
*   **Fix**: Define flat schemas specifically tailored for AI tools parameters.
