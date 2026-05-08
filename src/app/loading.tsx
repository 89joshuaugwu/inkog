export default function Loading() {
  return (
    <div
      className="flex items-center justify-center min-h-screen"
      style={{ backgroundColor: "#0A0A0A" }}
    >
      <div
        className="w-10 h-10 rounded-full border-2 animate-spin"
        style={{ borderColor: "#8B5CF6", borderTopColor: "transparent" }}
      />
    </div>
  );
}
