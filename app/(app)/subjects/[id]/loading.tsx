// Scoped to the subject page body: the subject header and tabs (rendered by
// the layout) stay painted while only this content area streams in, so
// switching tabs feels instant instead of blanking the whole view.
export default function SubjectBodyLoading() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="skeleton h-[88px] rounded-xl" />
        ))}
      </div>
      <div className="skeleton h-32 rounded-xl" />
      <div className="skeleton h-48 rounded-xl" />
    </div>
  );
}
