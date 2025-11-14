import * as fs from 'fs';
import * as path from 'path';

const API_BASE_URL = 'https://api.library.manabi.uz/api/v1';

interface CSVBook {
  ID: string;
  Name: string;
  Author: string;
  Category: string;
  Language: string;
}

interface Category {
  id: string;
  name: string;
}

interface Book {
  id: string;
  title: string;
  author: string;
  categoryId: string;
}

async function login(email: string, password: string): Promise<string> {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    throw new Error(`Login failed: ${response.statusText}`);
  }

  const data = await response.json();
  return data.data.token;
}

async function getCategories(token: string): Promise<Category[]> {
  const response = await fetch(`${API_BASE_URL}/categories`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch categories: ${response.statusText}`);
  }

  return await response.json();
}

async function createCategory(
  token: string,
  name: string
): Promise<Category> {
  const response = await fetch(`${API_BASE_URL}/categories`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name }),
  });

  if (!response.ok) {
    throw new Error(`Failed to create category: ${response.statusText}`);
  }

  const data = await response.json();
  return data.data || data;
}

async function createBookWithCopies(
  token: string,
  title: string,
  author: string,
  categoryId: string,
  barcodes: string[]
): Promise<Book> {
  const response = await fetch(`${API_BASE_URL}/books`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ 
      title, 
      author, 
      categoryId,
      copies: barcodes.map(barcode => ({ barcode }))
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to create book: ${response.statusText} - ${errorText}`);
  }

  const data = await response.json();
  return data.data || data;
}

function parseCSV(filePath: string): CSVBook[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.trim().split('\n');
  const books: CSVBook[] = [];

  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(',');
    if (parts.length >= 5) {
      books.push({
        ID: parts[0].trim(),
        Name: parts[1].trim(),
        Author: parts[2].trim(),
        Category: parts[3].trim(),
        Language: parts[4].trim(),
      });
    }
  }

  return books;
}

async function main() {
  console.log('=== JDU Library Book Import Script ===\n');

  const token = process.env.AUTH_TOKEN || process.argv[2];

  if (!token) {
    console.error('Usage: bun run import-books.ts <auth-token>');
    console.error('Or set AUTH_TOKEN env var');
    process.exit(1);
  }

  console.log('✅ Using provided auth token\n');

  const csvPath = path.join(__dirname, 'merged_books.csv');
  console.log('📖 Reading CSV file...');
  const csvBooks = parseCSV(csvPath);
  console.log(`✅ Found ${csvBooks.length} book entries\n`);

  console.log('📂 Fetching existing categories...');
  let categories = await getCategories(token);
  console.log(`✅ Found ${categories.length} existing categories\n`);

  const categoryMap = new Map<string, string>();
  categories.forEach((cat) => categoryMap.set(cat.name, cat.id));

  const uniqueCategories = new Set(csvBooks.map((b) => b.Category));
  console.log(`📝 Creating missing categories...`);
  for (const categoryName of uniqueCategories) {
    if (!categoryMap.has(categoryName)) {
      try {
        const newCategory = await createCategory(token, categoryName);
        categoryMap.set(newCategory.name, newCategory.id);
        console.log(`  ✅ Created: ${categoryName}`);
      } catch (error) {
        console.error(`  ❌ Failed to create ${categoryName}:`, error);
      }
    }
  }
  console.log('');

  const bookMap = new Map<string, string>();
  const booksByKey = new Map<string, CSVBook[]>();

  csvBooks.forEach((book) => {
    const key = `${book.Name}|||${book.Author}`;
    if (!booksByKey.has(key)) {
      booksByKey.set(key, []);
    }
    booksByKey.get(key)!.push(book);
  });

  console.log(`📚 Found ${booksByKey.size} unique books\n`);
  console.log('🚀 Starting import...\n');

  let bookCount = 0;
  let copyCount = 0;
  let errorCount = 0;

  for (const [key, copies] of booksByKey) {
    const firstBook = copies[0];
    const categoryId = categoryMap.get(firstBook.Category);

    if (!categoryId) {
      console.error(`❌ No category ID for: ${firstBook.Category}`);
      errorCount++;
      continue;
    }

    try {
      const barcodes = copies.map(c => c.ID);
      console.log(`📖 Creating book: ${firstBook.Name} by ${firstBook.Author} (${barcodes.length} copies)`);
      
      const book = await createBookWithCopies(
        token,
        firstBook.Name,
        firstBook.Author,
        categoryId,
        barcodes
      );
      
      bookMap.set(key, book.id);
      bookCount++;
      copyCount += barcodes.length;
      console.log(`  ✅ Book created with ${barcodes.length} copies (ID: ${book.id})`);

      await new Promise((resolve) => setTimeout(resolve, 100));
    } catch (error: any) {
      console.error(`  ❌ Failed to create book:`, error.message);
      errorCount++;
    }

    console.log('');
  }

  console.log('=== Import Complete ===');
  console.log(`✅ Books created: ${bookCount}`);
  console.log(`✅ Copies created: ${copyCount}`);
  console.log(`❌ Errors: ${errorCount}`);
}

main().catch(console.error);
