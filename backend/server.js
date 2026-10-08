import express from "express";
import cors from "cors";
import multer from "multer";
import dotenv from "dotenv";

dotenv.config();

/* =========================================
   APP
========================================= */

const app = express();
const PORT = process.env.PORT || 3001;

console.log(
  "Groq configured:",
  Boolean(process.env.GROQ_API_KEY)
);

/* =========================================
   MIDDLEWARE
========================================= */

app.use(
  cors({
    origin: true,
    methods: [
      "GET",
      "POST",
      "OPTIONS",
    ],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
    ],
  })
);

app.use(
  express.json({
    limit: "2mb",
  })
);

/* =========================================
   AUDIO UPLOAD

   Store the recording in memory instead
   of writing temporary files to disk.

   Maximum: 4 MB
========================================= */

const upload = multer({
  storage: multer.memoryStorage(),

  limits: {
    fileSize:
      4 * 1024 * 1024,
  },
});

/* =========================================
   DRYVE ACCOUNTS
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
   ACCOUNT TYPE
========================================= */

function getExpectedType(
  account
) {
  if (
    REVENUE_ACCOUNTS.includes(
      account
    )
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
   TRANSCRIPT NORMALIZATION
========================================= */

function normalizeTranscriptCurrency(
  text = ""
) {
  return text
    .replace(/\$/g, "₱")

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

function normalizeAmount(
  value
) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  if (
    typeof value ===
    "number"
  ) {
    return Number.isFinite(
      value
    )
      ? value
      : null;
  }

  if (
    typeof value ===
    "string"
  ) {
    const cleaned =
      value
        .replace(
          /[₱$,]/g,
          ""
        )
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
    return res.json({
      success: true,

      service:
        "Dryve PH Voice-to-Income API",

      message:
        "Dryve backend is running.",

      currency: "PHP",
    });
  }
);

/* =========================================
   HEALTH
========================================= */

app.get(
  "/api/health",
  (req, res) => {
    return res.json({
      success: true,

      message:
        "Dryve transcription server is running.",

      currency: "PHP",

      groqConfigured:
        Boolean(
          process.env
            .GROQ_API_KEY
        ),
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
    try {
      /* -----------------------------
         FILE VALIDATION
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

      console.log(
        "Audio received:",
        req.file.originalname
      );

      console.log(
        "Audio size:",
        req.file.size
      );

      /* -----------------------------
         CREATE GROQ FORM DATA
      ----------------------------- */

      const audioBlob =
        new Blob(
          [
            req.file.buffer,
          ],
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
        req.file.originalname ||
          "recording.mp3"
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

      /* -----------------------------
         GROQ WHISPER
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

      let transcription;

      try {
        transcription =
          JSON.parse(
            responseText
          );
      } catch {
        return res
          .status(502)
          .json({
            success: false,

            error:
              "Groq returned an invalid transcription response.",
          });
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
        "Transcription completed."
      );

      return res.json({
        success: true,

        currency: "PHP",

        transcript,
      });
    } catch (error) {
      console.error(
        "Transcription server error:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,

          error:
            "Unable to transcribe the recording.",

          details:
            error.message,
        });
    }
  }
);

/* =========================================
   EXTRACT TRANSACTIONS
========================================= */

app.post(
  "/api/extract-transactions",

  async (req, res) => {
    try {
      const transcript =
        String(
          req.body
            ?.transcript ||
            ""
        ).trim();

      if (!transcript) {
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
- multiple transactions

CURRENCY

All monetary amounts are Philippine Pesos (PHP).

Never interpret any amount as US Dollars.
Never convert PHP into USD.
Never return a dollar sign.

The amount field must contain only a numeric value or null.

Examples:

"485k" = 485000

"5k" = 5000

"12,500" = 12500

"1.15 million" = 1150000

"tig-4,500 each" for two units = 9000 total

ACCURACY RULES

1. Never invent an amount.
2. Never invent a person.
3. Never invent a vehicle.
4. Never invent a plate number.
5. Never invent a date.
6. Never infer a missing amount from prior transactions.

7. If an amount is missing:

"amount": null

and:

"needs_review": true

8. If information is unclear or incomplete:

"needs_review": true

9. If the speaker corrects an earlier value, use the FINAL corrected value.

Example:

"printer ink, 1,500... wait, 1,050"

Correct amount:

1050

10. Do not calculate Revenue totals, Gross Profit, Net Income, or income statement totals.

The application calculates those values.

ACCOUNTING STRUCTURE

Revenue:

Vehicle Sales
- sale of a vehicle

Other Income
- storage fees
- documentation fees
- other operating income

Cost of Sales:

Vehicle Acquisition Cost
- vehicle purchase/acquisition cost

Reconditioning
- repairs
- detailing
- vehicle parts
- vehicle preparation

Operating Expenses:

Salaries and Commissions
- employee salaries
- helper wages
- sales commissions

Transport and Fuel
- towing
- hauling
- transport
- fuel

Rent and Utilities
- rent
- electricity
- Meralco
- water

Marketing
- advertisements
- boosted posts
- signage

Office and Admin
- office supplies
- phone load
- printing
- printer ink

Miscellaneous
- expenses that clearly do not fit another category

VALID TYPES

Only use:

Revenue
Cost of Sales
Operating Expense

OUTPUT

Return JSON only.

Use:

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
`;

      /* =================================
         GROQ EXTRACTION
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

Currency is PHP.
Do not invent missing values.
Use final corrections.

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
      } catch {
        console.error(
          "Invalid Groq JSON:",
          content
        );

        throw new Error(
          "Groq did not return valid transaction JSON."
        );
      }

      /* =================================
         VALIDATE AI TRANSACTIONS
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

        currency: "PHP",

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
   MULTER / API ERROR HANDLER
========================================= */

app.use(
  (
    error,
    req,
    res,
    next
  ) => {
    if (
      error instanceof
      multer.MulterError
    ) {
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
        .status(400)
        .json({
          success: false,

          error:
            "Audio upload failed.",

          details:
            error.message,
        });
    }

    console.error(
      "Unhandled server error:",
      error
    );

    return res
      .status(500)
      .json({
        success: false,

        error:
          "Internal server error.",

        details:
          error.message,
      });
  }
);

/* =========================================
   JSON 404

   If you receive this JSON,
   Express is working.

   If you receive Vercel's white
   404_NOT_FOUND page instead,
   the request never reached Express.
========================================= */

app.use(
  (req, res) => {
    return res
      .status(404)
      .json({
        success: false,

        error:
          "Route not found.",

        path:
          req.originalUrl,
      });
  }
);

/* =========================================
   LOCAL DEVELOPMENT ONLY
========================================= */

if (!process.env.VERCEL) {
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