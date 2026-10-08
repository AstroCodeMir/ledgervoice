import { useRef, useState } from "react";
import {
  CalendarDays,
  Upload,
  Mic,
  FileAudio,
  CheckCircle2,
  AlertTriangle,
  LoaderCircle,
} from "lucide-react";

import AppHeader from "../components/AppHeader";
import BottomNav from "../components/BottomNav";

const FALLBACK_TRANSCRIPT =
  "Okay so, sold the Innova, the 2017, plate NBC 4521, for 690k. " +
  "Buyer paid 600 cash then the rest... ah no, full na pala, bank transfer yung balance. " +
  "Also collected storage fee from the BDO units, 8,000. Then load for the office phones, 1,000.";

function RecapScreen({ onContinueToExtraction }) {
  const fileInputRef = useRef(null);

  const [selectedFile, setSelectedFile] = useState(null);
  const [audioUrl, setAudioUrl] = useState("");

  const [isProcessing, setIsProcessing] = useState(false);

  const [error, setError] = useState("");
  const [transcript, setTranscript] = useState("");

  const handleSelectFile = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    setError("");
    setTranscript("");

    const allowedTypes = [
      "audio/mpeg",
      "audio/mp4",
      "audio/wav",
      "audio/x-wav",
      "audio/webm",
      "audio/ogg",
      "audio/m4a",
    ];

    const extensionAllowed =
      /\.(mp3|wav|m4a|mp4|webm|ogg)$/i.test(file.name);

    if (
      !allowedTypes.includes(file.type) &&
      !extensionAllowed
    ) {
      setError(
        "Please choose an audio file such as MP3, WAV, M4A, or WebM."
      );

      return;
    }

    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }

    setSelectedFile(file);
    setAudioUrl(URL.createObjectURL(file));
  };

  const transcribeAudio = async () => {
    if (!selectedFile) {
      setError("Please choose an audio recording first.");
      return;
    }

    setIsProcessing(true);
    setError("");

    try {
      const formData = new FormData();

      formData.append("audio", selectedFile);

      const response = await fetch(
        "/api/transcribe",
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error("Transcription service unavailable.");
      }

      const result = await response.json();

      const transcriptText =
        result.transcript?.trim() || FALLBACK_TRANSCRIPT;

      setTranscript(transcriptText);

      sessionStorage.setItem(
        "dryveTranscript",
        transcriptText
      );
    } catch (err) {
      console.error(err);

      /*
        Temporary fallback while the transcription
        backend is still being connected.
      */
      setTranscript(FALLBACK_TRANSCRIPT);

      sessionStorage.setItem(
        "dryveTranscript",
        FALLBACK_TRANSCRIPT
      );

      setError(
        "Transcription service is not connected yet. Demo transcript was loaded instead."
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleContinue = () => {
    if (!transcript) {
      setError("Process the recording before continuing.");
      return;
    }

    onContinueToExtraction?.({
      audioFile: selectedFile,
      audioUrl,
      transcript,
    });
  };

  return (
    <div className="app-shell">
      <main className="phone-app">
        <AppHeader />

        <section className="content recap-upload-content">
          <div className="page-heading">
            <h1>Daily Recap</h1>

            <div className="recording-date">
              <CalendarDays size={20} />

              <span>October 7, 2026</span>
            </div>
          </div>

          <section className="upload-intro">
            <div className="upload-icon-large">
              <FileAudio size={34} />
            </div>

            <h2>Upload Daily Recording</h2>

            <p>
              Choose a manager's daily voice recap and the
              system will convert it into structured transactions.
            </p>
          </section>

          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*,.m4a,.mp3,.wav,.webm,.ogg"
            onChange={handleSelectFile}
            hidden
          />

          <button
            type="button"
            className="choose-recording-button"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload size={20} />

            {selectedFile
              ? "Choose Another Recording"
              : "Choose Audio Recording"}
          </button>

          {selectedFile && (
            <section className="selected-audio-card">
              <div className="selected-file-icon">
                <FileAudio size={22} />
              </div>

              <div className="selected-file-info">
                <strong>{selectedFile.name}</strong>

                <span>
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </span>
              </div>

              <CheckCircle2
                size={20}
                className="selected-check"
              />
            </section>
          )}

          {audioUrl && (
            <audio
              className="uploaded-audio-player"
              controls
              src={audioUrl}
            />
          )}

          <button
            type="button"
            className="process-recording-button"
            onClick={transcribeAudio}
            disabled={!selectedFile || isProcessing}
          >
            {isProcessing ? (
              <>
                <LoaderCircle
                  size={20}
                  className="processing-spinner"
                />

                Transcribing Recording...
              </>
            ) : (
              <>
                <Mic size={20} />

                Process Recording
              </>
            )}
          </button>

          <div className="upload-divider">
            <span>OR</span>
          </div>

          <button
            type="button"
            className="optional-record-button"
            onClick={() =>
              alert(
                "Live recording is optional for this prototype. Uploading recordings is the primary demo flow."
              )
            }
          >
            <Mic size={19} />

            Record Voice
            <span>Optional</span>
          </button>

          {error && (
            <div className="upload-warning">
              <AlertTriangle size={19} />

              <span>{error}</span>
            </div>
          )}

          {transcript && (
            <section className="transcription-ready-card">
              <CheckCircle2 size={21} />

              <div>
                <strong>Transcription ready</strong>

                <span>
                  Continue to review the detected transactions.
                </span>
              </div>
            </section>
          )}

          {transcript && (
            <button
              type="button"
              className="continue-button"
              onClick={handleContinue}
            >
              Continue to AI Extraction
            </button>
          )}
        </section>

        <BottomNav activeTab="recap" />
      </main>
    </div>
  );
}

export default RecapScreen;