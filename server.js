import express from "express";
import cors from "cors";
import multer from "multer";
import fs from "fs";
import os from "os";
import dotenv from "dotenv";

dotenv.config();

/* =========================================
   ENVIRONMENT CHECK
========================================= */

console.log(
  "Groq key loaded:",
  Boolean(process.env.GROQ_API_KEY)
);

/* =========================================
   SERVER
========================================= */

const app = express();

const PORT = process.env.PORT || 3001;

app.use(
  cors({
    origin: true,
  })
);

app.use(
  express.json({
    limit: "2mb",
  })
);

/* =========================================
   TEMPORARY UPLOAD DIRECTORY

   Vercel serverless functions should use
   the system temporary directory.

   For normal local development, os.tmpdir()
   also works safely.
========================================= */

const uploadDirectory = os.tmpdir();

console.log(
  "Temporary upload directory:",
  uploadDirectory
);

/* =========================================
   MULTER

   Vercel has a request payload limit.

   Keep uploaded recordings below 4 MB for
   this deployment.
========================================= */

const upload = multer({
  dest: uploadDirectory,

  limits: {
    fileSize: 4 * 1024 * 1024,
  },
});

/* =========================================
   DRYVE ACCOUNTING STRUCTURE
========================================= */

const REVENUE_ACCOUNTS = [
  "Vehicle Sales",
  "Other Income",
];

const COST_OF_SALES_ACCOUNTS = [
  "Vehicle Acquisition Cost",
  "Reconditioning",
];

const OPERATING_EXPENSE_ACCOUNTS = [
  "Salaries and Commissions",
  "Transport and Fuel",
  "Rent and Utilities",
  "Marketing",
  "Office and Admin",
  "Miscellaneous",
];

const ALLOWED_ACCOUNTS = [
  ...REVENUE_ACCOUNTS,
  ...COST_OF_SALES_ACCOUNTS,
  ...OPERATING_EXPENSE_ACCOUNTS,
];

const ALLOWED_TYPES = [
  "Revenue",
  "Cost of Sales",
  "Operating Expense",
];

/* =========================================
   ACCOUNT → TYPE
========================================= */

function getExpectedType(account) {
  if (
    REVENUE_ACCOUNTS.includes(account)
  ) {
    return "Revenue";
  }

  if (
    COST_OF_SALES_ACCOUNTS.includes(
      account
    )
  ) {
    return "Cost of Sales";
  }

  return "Operating Expense";
}

/* =========================================
   TRANSCRIPT CURRENCY NORMALIZATION
========================================= */

function normalizeTranscriptCurrency(
  text = ""
) {
  return text

    /*
      If speech-to-text/API somehow
      produces a dollar symbol,
      Dryve accounting should use PHP.
    */

    .replace(/\$/g, "₱")

    /*
      Normalize explicit dollar wording
      because all Dryve accounting values
      are PHP for this prototype.
    */

    .replace(
      /\bUS dollars?\b/gi,
      "Philippine pesos"
    )

    .replace(
      /\bdollars?\b/gi,
      "pesos"
    )

    .trim();
}

/* =========================================
   AMOUNT NORMALIZATION
========================================= */

function normalizeAmount(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  if (
    typeof value === "number"
  ) {
    return Number.isFinite(value)
      ? value
      : null;
  }

  if (
    typeof value === "string"
  ) {
    const cleaned =
      value
        .replace(/[₱$,]/g, "")
        .trim();

    const numeric =
      Number(cleaned);

    return Number.isFinite(
      numeric
    )
      ? numeric
      : null;
  }

  return null;
}

/* =========================================
   ROOT
========================================= */

app.get(
  "/",
  (req, res) => {
    res.json({
      success: true,
      message:
        "Dryve PH Voice-to-Income API is running.",
      currency: "PHP",
    });
  }
);

/* =========================================
   HEALTH CHECK
========================================= */

app.get(
  "/api/health",
  (req, res) => {
    res.json({
      success: true,

      message:
        "Dryve transcription server is running.",

      currency: "PHP",
    });
  }
);

/* =========================================
   TRANSCRIPTION
========================================= */

app.post(
  "/api/transcribe",

  upload.single("audio"),

  async (req, res) => {
    let uploadedPath = null;

    try {
      /* -----------------------------
         VALIDATE FILE
      ----------------------------- */

      if (!req.file) {
        return res
          .status(400)
          .json({
            success: false,

            error:
              "No audio file received.",
          });
      }

      if (
        !process.env
          .GROQ_API_KEY
      ) {
        return res
          .status(500)
          .json({
            success: false,

            error:
              "Groq API key is missing.",
          });
      }

      uploadedPath =
        req.file.path;

      console.log(
        `Transcribing: ${req.file.originalname}`
      );

      console.log(
        `Audio size: ${req.file.size} bytes`
      );

      /* -----------------------------
         READ AUDIO
      ----------------------------- */

      const audioBuffer =
        fs.readFileSync(
          uploadedPath
        );

      const audioBlob =
        new Blob(
          [audioBuffer],
          {
            type:
              req.file
                .mimetype ||
              "audio/mpeg",
          }
        );

      const formData =
        new FormData();

      formData.append(
        "file",
        audioBlob,
        req.file.originalname
      );

      formData.append(
        "model",
        "whisper-large-v3-turbo"
      );

      formData.append(
        "response_format",
        "json"
      );

      formData.append(
        "temperature",
        "0"
      );

      /*
        Do not force English.

        Dryve recaps can be:
        - English
        - Tagalog
        - Taglish
      */

      /* -----------------------------
         GROQ WHISPER REQUEST
      ----------------------------- */

      const groqResponse =
        await fetch(
          "https://api.groq.com/openai/v1/audio/transcriptions",
          {
            method: "POST",

            headers: {
              Authorization:
                `Bearer ${process.env.GROQ_API_KEY}`,
            },

            body: formData,
          }
        );

      const responseText =
        await groqResponse.text();

      /* -----------------------------
         API ERROR
      ----------------------------- */

      if (
        !groqResponse.ok
      ) {
        console.error(
          "Groq transcription error:",
          responseText
        );

        return res
          .status(
            groqResponse.status
          )
          .json({
            success: false,

            error:
              "Groq transcription failed.",

            details:
              responseText,
          });
      }

      /* -----------------------------
         PARSE RESULT
      ----------------------------- */

      let transcription;

      try {
        transcription =
          JSON.parse(
            responseText
          );
      } catch {
        throw new Error(
          "Unable to parse transcription response."
        );
      }

      const transcript =
        normalizeTranscriptCurrency(
          transcription.text ||
            ""
        );

      if (!transcript) {
        return res
          .status(422)
          .json({
            success: false,

            error:
              "No transcript was generated from the recording.",
          });
      }

      console.log(
        "Transcription complete."
      );

      return res.json({
        success: true,

        currency: "PHP",

        transcript,
      });
    } catch (error) {
      console.error(
        "Server transcription error:",
        error
      );

      /*
        Multer error for files that
        exceed the configured size.
      */

      if (
        error.code ===
        "LIMIT_FILE_SIZE"
      ) {
        return res
          .status(413)
          .json({
            success: false,

            error:
              "Audio recording is too large.",

            details:
              "Please upload an audio file smaller than 4 MB.",
          });
      }

      return res
        .status(500)
        .json({
          success: false,

          error:
            "Unable to transcribe the recording.",

          details:
            error.message,
        });
    } finally {
      /* -----------------------------
         DELETE TEMP AUDIO
      ----------------------------- */

      if (
        uploadedPath &&
        fs.existsSync(
          uploadedPath
        )
      ) {
        try {
          fs.unlinkSync(
            uploadedPath
          );

          console.log(
            "Temporary audio file deleted."
          );
        } catch (
          cleanupError
        ) {
          console.warn(
            "Temporary file cleanup failed:",
            cleanupError.message
          );
        }
      }
    }
  }
);

/* =========================================
   TRANSACTION EXTRACTION
========================================= */

app.post(
  "/api/extract-transactions",

  async (req, res) => {
    try {
      const {
        transcript,
      } = req.body;

      /* -----------------------------
         VALIDATION
      ----------------------------- */

      if (
        !transcript ||
        !transcript.trim()
      ) {
        return res
          .status(400)
          .json({
            success: false,

            error:
              "Transcript is required.",
          });
      }

      if (
        !process.env
          .GROQ_API_KEY
      ) {
        return res
          .status(500)
          .json({
            success: false,

            error:
              "Groq API key is missing.",
          });
      }

      /* =================================
         EXTRACTION PROMPT
      ================================= */

      const systemPrompt = `
You are an accounting transaction extraction assistant for Dryve PH, a vehicle dealership in the Philippines.

Your task is to convert a manager's daily voice recap transcript into structured accounting transactions.

The transcript may contain:

- English
- Tagalog
- Taglish
- speech-to-text mistakes
- abbreviations
- shorthand
- self-corrections
- incomplete information
- multiple transactions in one recap

==================================================
CURRENCY
==================================================

ALL monetary amounts are Philippine Pesos (PHP).

Never interpret any amount as US Dollars.

Never convert PHP into USD.

Never return a dollar sign.

The amount field must contain ONLY a numeric value or null.

Examples:

"485k"
means:
485000

"5k"
means:
5000

"12,500"
means:
12500

"1.15 million"
means:
1150000

"tig-4,500 each" for two units
means:
9000 total

Do not include "₱", "PHP", "$", commas, or other text inside the amount value.

Correct:

"amount": 485000

Wrong:

"amount": "$485,000"

Wrong:

"amount": "₱485,000"

==================================================
ACCURACY RULES
==================================================

1. Never invent an amount.

2. Never invent a person.

3. Never invent a vehicle.

4. Never invent a plate number.

5. Never invent a date.

6. Never infer a missing amount from prior transactions.

7. If an amount is missing, return:

"amount": null

and:

"needs_review": true

8. If information is unclear or incomplete, set:

"needs_review": true

9. When the speaker corrects themselves, use the FINAL corrected value.

Example:

"printer ink, 1,500... wait, 1,050"

Correct amount:

1050

Do not return 1500.

10. Do not calculate Revenue, Gross Profit, Net Income, or other statement totals.

The application will calculate those values.

==================================================
ACCOUNTING STRUCTURE
==================================================

Revenue:

1. Vehicle Sales
   - sale of a vehicle to a buyer

2. Other Income
   - storage fees
   - documentation fees
   - other operating income

Cost of Sales:

3. Vehicle Acquisition Cost
   - acquisition or purchase cost of a vehicle

4. Reconditioning
   - repairs
   - detailing
   - vehicle parts
   - vehicle preparation

Operating Expenses:

5. Salaries and Commissions
   - employee salaries
   - helper wages
   - sales commissions

6. Transport and Fuel
   - towing
   - hauling
   - vehicle transport
   - fuel

7. Rent and Utilities
   - rent
   - electricity
   - Meralco
   - water

8. Marketing
   - advertisements
   - boosted social posts
   - signage

9. Office and Admin
   - office supplies
   - phone load
   - printing
   - printer ink

10. Miscellaneous
   - expenses that clearly do not belong to another available category

==================================================
VALID TYPES
==================================================

Only use these transaction types:

Revenue

Cost of Sales

Operating Expense

==================================================
OUTPUT
==================================================

Return JSON only.

Use exactly this structure:

{
  "transactions": [
    {
      "type": "Revenue",
      "account": "Vehicle Sales",
      "description": "2019 Toyota Vios",
      "amount": 485000,
      "needs_review": false,
      "review_reason": null
    }
  ]
}

Example with missing information:

{
  "transactions": [
    {
      "type": "Operating Expense",
      "account": "Rent and Utilities",
      "description": "Meralco warehouse electricity bill",
      "amount": null,
      "needs_review": true,
      "review_reason": "Amount was not provided"
    }
  ]
}
`;

      console.log(
        "Sending transcript to Groq for transaction extraction..."
      );

      /* =================================
         GROQ REQUEST
      ================================= */

      const groqResponse =
        await fetch(
          "https://api.groq.com/openai/v1/chat/completions",
          {
            method: "POST",

            headers: {
              Authorization:
                `Bearer ${process.env.GROQ_API_KEY}`,

              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                model:
                  "openai/gpt-oss-120b",

                temperature: 0,

                response_format: {
                  type:
                    "json_object",
                },

                messages: [
                  {
                    role:
                      "system",

                    content:
                      systemPrompt,
                  },

                  {
                    role:
                      "user",

                    content: `
Extract all accounting transactions from this Dryve PH daily recap.

Remember:

- Currency is Philippine Pesos (PHP).
- Never use dollars.
- Never invent missing values.
- Use final corrections when the speaker corrects an earlier amount.

Transcript:

${transcript}
`,
                  },
                ],
              }),
          }
        );

      const responseText =
        await groqResponse.text();

      /* =================================
         GROQ ERROR
      ================================= */

      if (
        !groqResponse.ok
      ) {
        console.error(
          "Groq extraction error:",
          responseText
        );

        return res
          .status(
            groqResponse.status
          )
          .json({
            success: false,

            error:
              "Transaction extraction failed.",

            details:
              responseText,
          });
      }

      /* =================================
         PARSE GROQ
      ================================= */

      let groqData;

      try {
        groqData =
          JSON.parse(
            responseText
          );
      } catch {
        throw new Error(
          "Unable to parse Groq API response."
        );
      }

      const content =
        groqData
          .choices?.[0]
          ?.message
          ?.content;

      if (!content) {
        throw new Error(
          "Groq returned an empty transaction extraction."
        );
      }

      let parsed;

      try {
        parsed =
          JSON.parse(
            content
          );
      } catch (
        parseError
      ) {
        console.error(
          "Invalid Groq JSON:",
          content
        );

        throw new Error(
          "Groq did not return valid transaction JSON."
        );
      }

      /* =================================
         SERVER VALIDATION
      ================================= */

      const rawTransactions =
        Array.isArray(
          parsed.transactions
        )
          ? parsed.transactions
          : [];

      const transactions =
        rawTransactions.map(
          (
            transaction,
            index
          ) => {
            const originalAccount =
              transaction.account;

            const accountValid =
              ALLOWED_ACCOUNTS.includes(
                originalAccount
              );

            /*
              Do NOT silently trust an
              invalid account.

              We use Miscellaneous as
              temporary fallback and flag
              it for human review.
            */

            const account =
              accountValid
                ? originalAccount
                : "Miscellaneous";

            const expectedType =
              getExpectedType(
                account
              );

            const suppliedTypeValid =
              ALLOWED_TYPES.includes(
                transaction.type
              );

            const typeMismatch =
              suppliedTypeValid &&
              transaction.type !==
                expectedType;

            const amount =
              normalizeAmount(
                transaction.amount
              );

            const amountMissing =
              amount === null;

            let reviewReason =
              transaction.review_reason ||
              null;

            if (
              !accountValid
            ) {
              reviewReason =
                reviewReason ||
                "AI returned an unsupported account classification.";
            }

            if (
              typeMismatch
            ) {
              reviewReason =
                reviewReason ||
                "Transaction type did not match the account classification.";
            }

            if (
              amountMissing
            ) {
              reviewReason =
                reviewReason ||
                "Amount is missing.";
            }

            return {
              id:
                index + 1,

              currency:
                "PHP",

              type:
                expectedType,

              account,

              description:
                String(
                  transaction.description ||
                  "Unspecified transaction"
                ).trim(),

              amount,

              needs_review:
                Boolean(
                  transaction.needs_review
                ) ||
                !accountValid ||
                typeMismatch ||
                amountMissing,

              review_reason:
                reviewReason,
            };
          }
        );

      console.log(
        `Extracted ${transactions.length} transaction(s).`
      );

      return res.json({
        success: true,

        currency:
          "PHP",

        transactions,
      });
    } catch (error) {
      console.error(
        "Extraction server error:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,

          error:
            "Unable to extract transactions.",

          details:
            error.message,
        });
    }
  }
);

/* =========================================
   404
========================================= */

app.use(
  (req, res) => {
    res.status(404).json({
      success: false,

      error:
        "Route not found.",
    });
  }
);

/* =========================================
   LOCAL DEVELOPMENT

   Vercel imports this Express app instead
   of opening its own port.

   When server.js is executed directly with
   npm start, it still runs on port 3001.
========================================= */

if (require.main === module) {
  app.listen(
    PORT,
    "0.0.0.0",
    () => {
      console.log(
        `Dryve backend running at http://localhost:${PORT}`
      );

      console.log(
        `Health check: http://localhost:${PORT}/api/health`
      );
    }
  );
}

/* =========================================
   VERCEL EXPORT
========================================= */

export default app;