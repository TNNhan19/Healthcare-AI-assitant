# Product Data Import Script

This script imports all JSON files from the root directory into MongoDB using the Product model.

## How to Use

1. Make sure your MongoDB database is running and accessible
2. Ensure your `.env` file contains the `MONGO_URL` variable with the correct connection string
3. Run the import script using npm:

```bash
npm run import-products
```

## What the Script Does

- Connects to MongoDB using the existing database configuration in `config/db.js`
- Finds all JSON files in the root directory
- Maps the JSON data to match the Product model schema
- Imports the data into the MongoDB collection

## Data Mapping

The script maps fields from the JSON files to the Product model schema as follows:

- `name` → `tenThuoc`
- `price` → `price` (converted to number)
- `brand` → `congTy`
- `image` → `imageUrl`
- `packaging` → `dongGoi`
- `manufacturer` → `congTySx`
- `country` → `quocGia`
- `dosageForm` → `dangBaoChe`
- `expiryDate` → `hanSuDung`
- `main_category` → `main_category`
- `sub_category` → `sub_category`
- `details` → `description` (converted to string)

## Notes

- The script generates a unique `soDangKy` field if not provided in the JSON data
- Only files with `.json` extension in the root directory are processed
- Files containing "package" in their name are ignored
- The script will skip any files that cause errors and continue with the rest