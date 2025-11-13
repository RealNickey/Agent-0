/**
 * PDF Compressor Tool for AI SDK Integration
 * Provides PDF compression functionality with file upload UI
 */

import React, { useEffect, useState } from "react";
import { useLiveAPIContext } from "../../contexts/LiveAPIContext";
import { toolToasts, showToast } from "../../lib/toast";
import {
  FunctionDeclaration,
  LiveServerToolCall,
  Type,
} from "@google/genai";
import { motion } from "framer-motion";
import { FileUpload } from "../../components/ui/file-upload";
import { PDFDocument } from "pdf-lib";

// Tool declaration for PDF compression
const pdfCompressDeclaration: FunctionDeclaration = {
  name: "compress_pdf",
  description: "Open a file upload interface for the user to upload a PDF file for compression. Call this when the user asks to compress a PDF or needs help with PDF compression.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      open_upload: {
        type: Type.BOOLEAN,
        description: "Set to true to open the file upload interface",
        default: true,
      },
    },
    required: [],
  },
};

interface PDFCompressorToolResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export function PDFCompressorTool() {
  const [showUpload, setShowUpload] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionStatus, setCompressionStatus] = useState<string>("");
  const { client, setToolUIActive, toolUIActive } = useLiveAPIContext();

  // Compress PDF using pdf-lib
  const compressPDF = async (file: File): Promise<void> => {
    setIsCompressing(true);
    setCompressionStatus("Reading PDF...");
    
    try {
      // Read the uploaded PDF
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      
      setCompressionStatus("Compressing PDF...");
      
      // Save with compression options
      const compressedPdfBytes = await pdfDoc.save({
        useObjectStreams: true,
        addDefaultPage: false,
      });
      
      const originalSize = file.size;
      const compressedSize = compressedPdfBytes.length;
      const savings = ((originalSize - compressedSize) / originalSize * 100).toFixed(1);
      
      setCompressionStatus(`Compressed! Saved ${savings}% (${(originalSize / 1024 / 1024).toFixed(2)}MB → ${(compressedSize / 1024 / 1024).toFixed(2)}MB)`);
      
      // Create download link
      const blob = new Blob([compressedPdfBytes as BlobPart], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name.replace(".pdf", "_compressed.pdf");
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      showToast.success("PDF Compressor", `PDF compressed successfully! Saved ${savings}%`);
      
      // Clear upload after a delay
      setTimeout(() => {
        setShowUpload(false);
        setCompressionStatus("");
        setToolUIActive(false);
      }, 3000);
      
    } catch (error) {
      console.error("Compression error:", error);
      const errorMsg = error instanceof Error ? error.message : "Unknown error occurred";
      setCompressionStatus(`Error: ${errorMsg}`);
      toolToasts.apiError("PDF Compressor", errorMsg);
    } finally {
      setIsCompressing(false);
    }
  };

  const handleFileChange = (files: File[]) => {
    if (files.length > 0) {
      const file = files[0];
      
      // Validate that it's a PDF
      if (file.type !== "application/pdf") {
        toolToasts.apiError("PDF Compressor", "Please upload a PDF file");
        return;
      }
      
      compressPDF(file);
    }
  };

  useEffect(() => {
    const onToolCall = async (toolCall: LiveServerToolCall) => {
      if (!toolCall.functionCalls) {
        return;
      }

      const responses: Array<{
        response: { output: PDFCompressorToolResponse };
        id: string;
        name: string;
      }> = [];

      for (const fc of toolCall.functionCalls) {
        let result: PDFCompressorToolResponse;

        switch (fc.name) {
          case "compress_pdf":
            // Open the file upload UI
            setShowUpload(true);
            setToolUIActive(true);
            setCompressionStatus("");
            
            result = {
              success: true,
              message: "File upload interface opened. Waiting for user to upload a PDF file.",
            };
            
            showToast.success("PDF Compressor", "Please upload a PDF file to compress");
            break;

          default:
            result = {
              success: false,
              error: `Unknown function: ${fc.name}`,
            };
        }

        responses.push({
          response: { output: result },
          id: fc.id || "",
          name: fc.name || "",
        });
      }

      // Send tool responses back to the AI
      setTimeout(() => {
        client.sendToolResponse({
          functionResponses: responses,
        });
      }, 100);
    };

    const onClose = () => {
      // Clear state when call ends
      setShowUpload(false);
      setCompressionStatus("");
      setToolUIActive(false);
    };

    client.on("toolcall", onToolCall);
    client.on("close", onClose);
    return () => {
      client.off("toolcall", onToolCall);
      client.off("close", onClose);
    };
  }, [client, setToolUIActive]);

  // Only render when showUpload is true
  if (!showUpload) {
    return null;
  }

  return (
    <motion.div
      className="pdf-compressor-container h-full w-full flex items-center justify-center"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
    >
      <div className="max-w-2xl w-full mx-auto p-8">
        <div className="bg-card border border-border rounded-2xl shadow-lg overflow-hidden p-8">
          <h2 className="text-2xl font-bold text-foreground mb-4 text-center">
            PDF Compressor
          </h2>
          <p className="text-muted-foreground mb-6 text-center">
            Upload a PDF file to compress it and reduce its size
          </p>
          
          <FileUpload onChange={handleFileChange} />
          
          {isCompressing && (
            <motion.div
              className="mt-6 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-foreground">{compressionStatus}</p>
              </div>
            </motion.div>
          )}
          
          {compressionStatus && !isCompressing && (
            <motion.div
              className="mt-6 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <p className="text-foreground font-medium">{compressionStatus}</p>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export { pdfCompressDeclaration };
