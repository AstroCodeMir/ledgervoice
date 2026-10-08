const bars = [
  18, 28, 40, 58, 48, 35, 27, 43, 66, 82,
  62, 45, 31, 22, 28, 38, 52, 70, 91, 67,
  48, 38, 31, 24, 20, 31, 45, 60, 74, 88,
  66, 52, 42, 35, 26, 20,
];

function Waveform({ isRecording }) {
  const half = Math.floor(bars.length / 2);

  return (
    <div className={`waveform ${isRecording ? "recording" : ""}`}>
      {bars.map((height, index) => (
        <span
          key={index}
          className={`wave-bar ${
            index < half ? "active-bar" : "inactive-bar"
          }`}
          style={{
            height: `${height}%`,
            animationDelay: `${index * 40}ms`,
          }}
        />
      ))}
    </div>
  );
}

export default Waveform;