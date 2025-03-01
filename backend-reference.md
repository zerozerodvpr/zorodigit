# Zerodigit Backend API Reference

## Data Models (schema.ts)
```typescript
// User Model
interface User {
  id: number;
  username: string;
  password: string;
  isAdmin: boolean;
}

// Waitlist Entry Model
interface Waitlist {
  id: number;
  email: string;
  name: string;
  company?: string;
  createdAt: Date;
}

// File Folder Model
interface FileFolder {
  id: number;
  name: string;
  description?: string;
  parentId?: number;
  createdAt: Date;
}

// File Model
interface File {
  id: number;
  name: string;
  type: string;
  size: number;
  path: string;
  folderId: number | null;
  createdAt: Date;
  updatedAt: Date;
}
```

## API Endpoints

### Authentication
```typescript
// Login
POST /api/auth/login
Body: { username: string, password: string }
Response: { success: true }

// Logout
POST /api/auth/logout
Response: { success: true }
```

### Waitlist Management
```typescript
// Get all waitlist entries
GET /api/waitlist
Response: Waitlist[]

// Add new waitlist entry
POST /api/waitlist
Body: { email: string, name: string, company?: string }
Response: Waitlist

// Delete waitlist entry
DELETE /api/waitlist/:id
Response: { success: true }
```

### File Management

#### Folders
```typescript
// List folders
GET /api/folders?parentId={optional_parent_id}
Response: FileFolder[]

// Create folder
POST /api/folders
Body: { name: string, description?: string, parentId?: number }
Response: FileFolder

// Update folder
PATCH /api/folders/:id
Body: { name?: string, description?: string, parentId?: number }
Response: FileFolder

// Delete folder
DELETE /api/folders/:id
Response: { success: true }
```

#### Files
```typescript
// List files
GET /api/files?folderId={optional_folder_id}
Response: File[]

// Upload files (supports multiple files and folder structure)
POST /api/files
Body: FormData with:
  - files: File[] (The files to upload)
  - paths: string[] (The relative paths of the files)
  - folderId?: number (Optional folder ID)
Response: File[]

// Download single file
GET /api/files/:id/download
Response: File download

// Download all files
GET /api/files/download-all?folderId={optional_folder_id}
Response: ZIP file containing all files

// Delete file
DELETE /api/files/:id
Response: { success: true }
```

## Storage Interface (storage.ts)
```typescript
interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Waitlist methods
  getWaitlistEntries(): Promise<Waitlist[]>;
  createWaitlistEntry(entry: InsertWaitlist): Promise<Waitlist>;
  deleteWaitlistEntry(id: number): Promise<void>;

  // Folder methods
  createFolder(folder: InsertFileFolder): Promise<FileFolder>;
  getFolder(id: number): Promise<FileFolder | undefined>;
  getFolders(parentId?: number): Promise<FileFolder[]>;
  updateFolder(id: number, folder: Partial<InsertFileFolder>): Promise<FileFolder>;
  deleteFolder(id: number): Promise<void>;

  // File methods
  createFile(file: InsertFile): Promise<File>;
  getFile(id: number): Promise<File | undefined>;
  getFiles(folderId?: number | null): Promise<File[]>;
  updateFile(id: number, file: Partial<InsertFile>): Promise<File>;
  deleteFile(id: number): Promise<void>;
}
```

## Implementation Notes

1. Authentication is required for all admin endpoints (everything except POST /api/waitlist)
2. File uploads preserve folder structure when uploading directories
3. Files are physically stored in the ./uploads directory
4. The current implementation uses in-memory storage but follows the IStorage interface
5. All timestamps are in ISO format
6. File paths are relative to the uploads directory
7. Download-all endpoint creates a zip file containing all files in the specified folder and its subfolders

## Setup Requirements

1. Node.js environment
2. Required packages: express, multer, archiver
3. ./uploads directory for file storage
4. Default admin credentials: username="admin", password="admin123"
