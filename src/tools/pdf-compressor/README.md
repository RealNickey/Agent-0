# PDF Compressor Tool

A client-side PDF compression tool integrated with the Gemini Live API assistant.

## Features

- 🔒 **Client-side compression** - All processing happens in the browser, no server upload required
- 📁 **Easy file upload** - Drag-and-drop or click to upload PDF files
- 📊 **Compression statistics** - Shows original size, compressed size, and savings percentage
- 🚀 **Automatic download** - Compressed PDF is automatically downloaded with "_compressed.pdf" suffix
- ✅ **File validation** - Only accepts PDF files

## How to Use

1. Ask the assistant to compress a PDF (e.g., "compress my PDF", "help me compress a PDF file")
2. The file upload interface will appear on the canvas
3. Upload a PDF file by dragging it or clicking to browse
4. Wait for compression to complete
5. The compressed file will automatically download

## Technical Details

- Uses `pdf-lib` for client-side PDF compression
- Implements object streams compression for optimal size reduction
- Integrated with the existing LiveAPI tool system
- Follows the same pattern as TMDb and Altair tools

## Component Structure

```
src/tools/pdf-compressor/
├── pdf-compressor-tool.tsx  # Main component with compression logic
├── index.tsx                # Export file
└── README.md               # This file
```

## Integration Points

- **Function Declaration**: `compress_pdf` added to tool registry in `tmdb-tool.tsx`
- **System Instruction**: Updated to include PDF compression capability
- **UI Canvas**: Renders within the existing tool canvas alongside movie and chart tools
