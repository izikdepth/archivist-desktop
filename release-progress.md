# Release Progress - v0.1.1

## Issue: Sync Folder Not Working (v0.1.0)

### Problem Description

The sync folder feature in Archivist Desktop v0.1.0 was failing silently - files added to watched folders were not being uploaded to the archivist-node.

### Root Cause Analysis

**Date Investigated:** January 5, 2026

The `upload_file` function in `src-tauri/src/node_api.rs` was using `multipart/form-data` encoding to upload files, but the archivist-node API expects:

1. **Raw binary data** in the request body (not multipart)
2. **Content-Type header** set to the file's MIME type (e.g., `text/plain`, `application/octet-stream`)
3. **Content-Disposition header** with the filename (format: `attachment; filename="example.txt"`)

The archivist-node was returning HTTP 422 Unprocessable Entity with the error:
```
The MIME type 'multipart/form-data; boundary=...' is not valid.
```

### Evidence

Testing with curl confirmed the correct upload format:

```bash
# This FAILED (multipart/form-data):
curl -X POST http://127.0.0.1:8080/api/archivist/v1/data \
  -F "file=@test.txt"
# Error: HTTP 422 - The MIME type 'multipart/form-data...' is not valid.

# This WORKS (raw binary):
curl -X POST http://127.0.0.1:8080/api/archivist/v1/data \
  -H "Content-Type: text/plain" \
  -H "Content-Disposition: attachment; filename=\"test.txt\"" \
  --data-binary @test.txt
# Returns: CID (e.g., zDvZRwzm1V1ta9MffvDeR8X8e7szxhVkFA7NBMyEiht7WNM897Se)
```

### Fix Applied

**File:** `src-tauri/src/node_api.rs`

**Changes:**
1. Replaced `reqwest::multipart` import with `reqwest::header`
2. Changed `upload_file` function to send raw binary data with proper headers
3. Updated response parsing - archivist-node returns CID as plain text, not JSON

**Diff summary:**
- Removed: `multipart::Form` and `multipart::Part` usage
- Added: `header::CONTENT_TYPE` and `header::CONTENT_DISPOSITION` headers
- Changed: `.multipart(form)` to `.body(contents)` with headers
- Fixed: Response parsing from `.json()` to `.text()` (CID is plain text)

### Testing Checklist

- [ ] Build compiles successfully (`cargo check`)
- [ ] Manual test: Add folder to sync, verify files upload
- [ ] Verify uploaded files appear in Files page with correct filenames
- [ ] Test with various file types (txt, png, pdf)
- [ ] Test with files containing spaces in filename

### Related Information

**Node API Details:**
- Base URL: `http://127.0.0.1:8080`
- Upload endpoint: `POST /api/archivist/v1/data`
- List data endpoint: `GET /api/archivist/v1/data`
- Node info endpoint: `GET /api/archivist/v1/debug/info`

**Running Node (v0.1.0):**
```
/usr/bin/archivist --data-dir=/home/anon/.local/share/archivist/node --api-port=8080 --disc-port=8090
```

### Next Steps

1. Test the fix thoroughly with the desktop app
2. Bump version to 0.1.1
3. Update changelog
4. Create release build
