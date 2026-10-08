import { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  FileAudio,
  LoaderCircle,
  Upload,
  X,
} from "lucide-react";

import AppHeader from "../components/AppHeader";
import BottomNav from "../components/BottomNav";

const MAX_FILE_SIZE = 4 * 1024 * 1024;

const ACCEPTED_AUDIO_TYPES = [
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/x-wav",
  "audio/mp4",
  "audio/m4a",
  "audio/x-m4a",
  "audio/webm",
  "audio/ogg",
  "video/mp4",
];

/*
  PRODUCTION:
  VITE_API_BASE_URL=https://your-backend.vercel.app

  LOCAL:
  Leave empty and use the Vite /api proxy.
*/

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || ""
).replace(/\/$/, "");

function buildApiUrl(path) {
  return `${API_BASE_URL}${path}`;
}

function getTodayDate() {
  const now = new Date();

  const year = now.getFullYear();

  const month = String(
    now.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    now.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatFileSize(bytes) {
  if (!bytes) {
    return "0 KB";
  }

  if (bytes < 1024 * 1024) {
    return `${(
      bytes / 1024
    ).toFixed(1)} KB`;
  }

  return `${(
    bytes /
    (1024 * 1024)
  ).toFixed(2)} MB`;
}

async function readApiResponse(
  response
) {
  const contentType =
    response.headers.get(
      "content-type"
    ) || "";

  if (
    contentType.includes(
      "application/json"
    )
  ) {
    return response.json();
  }

  const responseText =
    await response.text();

  console.error(
    "Unexpected server response:",
    {
      status:
        response.status,
      url:
        response.url,
      body:
        responseText,
    }
  );

  if (
    response.status === 404
  ) {
    throw new Error(
      "Transcription API endpoint was not found. Check the deployed backend URL."
    );
  }

  throw new Error(
    `Server returned an unexpected response (${response.status}).`
  );
}

export default function RecapScreen({
  onContinue,
  onNavigate,
}) {
  const fileInputRef =
    useRef(null);

  const [
    businessDate,
    setBusinessDate,
  ] = useState(
    getTodayDate()
  );

  const [
    audioFile,
    setAudioFile,
  ] = useState(null);

  const [
    audioUrl,
    setAudioUrl,
  ] = useState("");

  const [
    isProcessing,
    setIsProcessing,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    successMessage,
    setSuccessMessage,
  ] = useState("");

  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(
          audioUrl
        );
      }
    };
  }, [audioUrl]);

  function clearMessages() {
    setError("");
    setSuccessMessage("");
  }

  function resetAudio() {
    clearMessages();

    if (audioUrl) {
      URL.revokeObjectURL(
        audioUrl
      );
    }

    setAudioFile(null);
    setAudioUrl("");

    if (
      fileInputRef.current
    ) {
      fileInputRef.current.value =
        "";
    }
  }

  function validateAudioFile(
    file
  ) {
    if (!file) {
      return "Please select an audio recording.";
    }

    if (
      file.size >
      MAX_FILE_SIZE
    ) {
      return `The selected recording is ${formatFileSize(
        file.size
      )}. Please upload a recording smaller than 4 MB.`;
    }

    const extension =
      file.name
        .split(".")
        .pop()
        ?.toLowerCase() ||
      "";

    const allowedExtensions =
      [
        "mp3",
        "wav",
        "m4a",
        "mp4",
        "webm",
        "ogg",
      ];

    const typeAllowed =
      !file.type ||
      ACCEPTED_AUDIO_TYPES.includes(
        file.type
      ) ||
      file.type.startsWith(
        "audio/"
      );

    const extensionAllowed =
      allowedExtensions.includes(
        extension
      );

    if (
      !typeAllowed &&
      !extensionAllowed
    ) {
      return "Unsupported audio format. Please upload MP3, WAV, M4A, MP4, WebM, or OGG.";
    }

    return null;
  }

  function handleFileChange(
    event
  ) {
    clearMessages();

    const file =
      event.target
        .files?.[0];

    if (!file) {
      return;
    }

    const validationError =
      validateAudioFile(
        file
      );

    if (
      validationError
    ) {
      setError(
        validationError
      );

      event.target.value =
        "";

      return;
    }

    if (audioUrl) {
      URL.revokeObjectURL(
        audioUrl
      );
    }

    const objectUrl =
      URL.createObjectURL(
        file
      );

    setAudioFile(file);
    setAudioUrl(objectUrl);
  }

  async function handleProcessRecording() {
    clearMessages();

    const validationError =
      validateAudioFile(
        audioFile
      );

    if (
      validationError
    ) {
      setError(
        validationError
      );

      return;
    }

    setIsProcessing(true);

    try {
      const formData =
        new FormData();

      /*
        Must match:

        upload.single("audio")

        inside Express server.
      */

      formData.append(
        "audio",
        audioFile
      );

      const endpoint =
        buildApiUrl(
          "/api/transcribe"
        );

      console.log(
        "Calling transcription API:",
        endpoint
      );

      const response =
        await fetch(
          endpoint,
          {
            method:
              "POST",

            body:
              formData,
          }
        );

      const data =
        await readApiResponse(
          response
        );

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.error ||
            data.details ||
            "Unable to transcribe the recording."
        );
      }

      const transcript =
        String(
          data.transcript ||
            ""
        ).trim();

      if (!transcript) {
        throw new Error(
          "The transcription service returned an empty transcript."
        );
      }

      sessionStorage.setItem(
        "dryveTranscript",
        transcript
      );

      sessionStorage.setItem(
        "dryveBusinessDate",
        businessDate
      );

      setSuccessMessage(
        "Transcription completed successfully."
      );

      onContinue?.({
        date:
          businessDate,

        businessDate,

        currency:
          "PHP",

        audioFile,

        audioUrl,

        transcript,
      });
    } catch (
      requestError
    ) {
      console.error(
        "Transcription request failed:",
        requestError
      );

      setError(
        requestError?.message ||
          "Unable to connect to the transcription service."
      );
    } finally {
      setIsProcessing(
        false
      );
    }
  }

  function handleBottomNavigation(
    tab
  ) {
    if (onNavigate) {
      onNavigate(tab);
    }
  }

  return (
    <div className="app-shell">
      <AppHeader />

      <main className="screen-content recap-screen">
        <section className="page-heading">
          <div>
            <p className="eyebrow">
              DAILY RECAP
            </p>

            <h1>
              Upload Voice
              Recording
            </h1>

            <p className="page-description">
              Upload the
              manager&apos;s daily
              voice recap. The
              recording will be
              transcribed and
              reviewed before
              accounting
              transactions are
              created.
            </p>
          </div>
        </section>

        <section className="recap-card">
          <div className="section-heading-row">
            <div>
              <h2>
                Business Date
              </h2>

              <p>
                Select the date
                the transactions
                belong to.
              </p>
            </div>

            <CalendarDays
              size={22}
              aria-hidden="true"
            />
          </div>

          <label
            className="field-label"
            htmlFor="business-date"
          >
            Business Date
          </label>

          <input
            id="business-date"
            className="business-date-input"
            type="date"
            value={
              businessDate
            }
            disabled={
              isProcessing
            }
            onChange={(
              event
            ) => {
              clearMessages();

              setBusinessDate(
                event.target
                  .value
              );
            }}
          />
        </section>

        <section className="recap-card">
          <div className="section-heading-row">
            <div>
              <h2>
                Audio Recording
              </h2>

              <p>
                MP3, WAV, M4A,
                MP4, WebM or OGG.
              </p>
            </div>

            <FileAudio
              size={22}
              aria-hidden="true"
            />
          </div>

          <input
            ref={
              fileInputRef
            }
            type="file"
            accept=".mp3,.wav,.m4a,.mp4,.webm,.ogg,audio/*"
            hidden
            disabled={
              isProcessing
            }
            onChange={
              handleFileChange
            }
          />

          {!audioFile ? (
            <button
              type="button"
              className="audio-upload-area"
              disabled={
                isProcessing
              }
              onClick={() =>
                fileInputRef
                  .current
                  ?.click()
              }
            >
              <div className="upload-icon">
                <Upload
                  size={26}
                  aria-hidden="true"
                />
              </div>

              <strong>
                Choose Audio
                Recording
              </strong>

              <span>
                Maximum file
                size: 4 MB
              </span>
            </button>
          ) : (
            <div className="selected-audio-card">
              <div className="selected-audio-main">
                <div className="selected-audio-icon">
                  <FileAudio
                    size={24}
                    aria-hidden="true"
                  />
                </div>

                <div className="selected-audio-info">
                  <strong>
                    {
                      audioFile.name
                    }
                  </strong>

                  <span>
                    {formatFileSize(
                      audioFile.size
                    )}
                  </span>
                </div>

                <button
                  type="button"
                  className="icon-button"
                  aria-label="Remove selected recording"
                  disabled={
                    isProcessing
                  }
                  onClick={
                    resetAudio
                  }
                >
                  <X
                    size={20}
                    aria-hidden="true"
                  />
                </button>
              </div>

              {audioUrl && (
                <audio
                  className="audio-preview"
                  controls
                  src={
                    audioUrl
                  }
                >
                  Your browser
                  does not
                  support audio
                  playback.
                </audio>
              )}

              <button
                type="button"
                className="secondary-button"
                disabled={
                  isProcessing
                }
                onClick={() =>
                  fileInputRef
                    .current
                    ?.click()
                }
              >
                Choose Different
                Recording
              </button>
            </div>
          )}
        </section>

        {error && (
          <div
            className="status-message error-message"
            role="alert"
          >
            <AlertTriangle
              size={20}
              aria-hidden="true"
            />

            <div>
              <strong>
                Unable to process
                recording
              </strong>

              <p>
                {error}
              </p>
            </div>
          </div>
        )}

        {successMessage && (
          <div
            className="status-message success-message"
            role="status"
          >
            <CheckCircle2
              size={20}
              aria-hidden="true"
            />

            <div>
              <strong>
                Transcription
                ready
              </strong>

              <p>
                {
                  successMessage
                }
              </p>
            </div>
          </div>
        )}

        <button
          type="button"
          className="primary-button full-width-button"
          disabled={
            !audioFile ||
            !businessDate ||
            isProcessing
          }
          onClick={
            handleProcessRecording
          }
        >
          {isProcessing ? (
            <>
              <LoaderCircle
                className="spin"
                size={19}
                aria-hidden="true"
              />

              Transcribing
              Recording...
            </>
          ) : (
            <>
              <Upload
                size={19}
                aria-hidden="true"
              />

              Process Recording
            </>
          )}
        </button>

        <div className="privacy-note">
          <CheckCircle2
            size={17}
            aria-hidden="true"
          />

          <span>
            Uploaded audio is
            used temporarily for
            transcription and is
            deleted by the
            backend after
            processing.
          </span>
        </div>
      </main>

      <BottomNav
        activeTab="recap"
        onNavigate={
          handleBottomNavigation
        }
      />
    </div>
  );
}