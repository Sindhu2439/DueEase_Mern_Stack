const express = require("express");
const multer = require("multer");
const Tesseract = require("tesseract.js");

const router = express.Router();

// Store uploaded image temporarily in memory
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
  },
});

// POST /api/receipts/scan
router.post("/scan", upload.single("receipt"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "Please upload a receipt image",
      });
    }

    console.log("Starting OCR...");

    const { data } = await Tesseract.recognize(
      req.file.buffer,
      "eng",
      {
        logger: (info) => {
          if (info.status === "recognizing text") {
            console.log(
              `OCR Progress: ${Math.round(info.progress * 100)}%`
            );
          }
        },
      }
    );

    const extractedText = data.text.trim();

    if (!extractedText) {
      return res.status(400).json({
        message: "Could not extract text from the receipt",
      });
    }

    res.status(200).json({
      message: "Receipt scanned successfully",
      text: extractedText,
    });
  } catch (error) {
    console.error("OCR Error:", error);

    res.status(500).json({
      message: "Failed to scan receipt",
      error: error.message,
    });
  }
});

module.exports = router;