export default function Loading() {
  return (
    <div
      className="flex items-center justify-center min-h-screen"
      style={{ backgroundColor: "#0A0A0A" }}
    >
      <div className="flex flex-col items-center gap-4">
        <div
          className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: "#8B5CF6", borderTopColor: "transparent" }}
        />
        <p
          className="font-body text-sm animate-pulse"
          style={{ color: "#6B7280" }}
        >
          Loading...
        </p>
      </div>
    </div>
  );
}
