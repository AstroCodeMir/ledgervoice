import { Mic, Square } from "lucide-react";

function RecordingButton({
  isRecording,
  onStart,
  onStop,
  isRequestingPermission,
}) {
  return (
    <>
      <button
        type="button"
        className={`record-button ${isRecording ? "recording" : ""}`}
        onClick={isRecording ? undefined : onStart}
        disabled={isRecording || isRequestingPermission}
      >
        <Mic size={54} />
      </button>

      {isRecording ? (
        <button
          type="button"
          className="stop-button"
          onClick={onStop}
        >
          <Square size={18} fill="currentColor" />
          Stop Recording
        </button>
      ) : (
        <button
          type="button"
          className="start-button"
          onClick={onStart}
          disabled={isRequestingPermission}
        >
          <Mic size={20} />
          {isRequestingPermission
            ? "Requesting Microphone..."
            : "Start Recording"}
        </button>
      )}
    </>
  );
}

export default RecordingButton;