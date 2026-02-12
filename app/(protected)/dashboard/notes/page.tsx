"use client";

export default function NotesPage() {
  const notes: any[] = []; // ← poi verrà da Supabase

  return (
    <div className="space-y-12">

      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-light tracking-tight">
            Notes
          </h1>
          <p className="text-white/50 mt-1">
            Handwritten knowledge, preserved forever.
          </p>
        </div>

        <a href="/notes/new">
          <button className="px-6 py-3 rounded-full bg-white text-black text-sm font-medium hover:opacity-90 transition">
            Upload notes
          </button>
        </a>
      </div>

      {/* EMPTY STATE */}
      {notes.length === 0 && (
        <div className="mt-20 flex flex-col items-center text-center max-w-md mx-auto">
          <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-6">
            ✍️
          </div>

          <h3 className="text-xl font-light mb-2">
            No notes yet
          </h3>

          <p className="text-white/40 text-sm mb-8">
            Upload handwritten notes from your atelier.
            Our system will read, understand and organize them for you.
          </p>

          <a href="/notes/new">
            <button className="px-8 py-3 rounded-full bg-white text-black text-sm font-medium hover:opacity-90 transition">
              Upload your first note
            </button>
          </a>
        </div>
      )}

      {/* NOTES GRID */}
      {notes.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
          {notes.map((note) => (
            <NoteCard key={note.id} />
          ))}
        </div>
      )}
    </div>
  );
}

/* =====================================================
   NOTE CARD
===================================================== */

function NoteCard() {
  return (
    <div className="rounded-2xl bg-white/[0.02] border border-white/10 overflow-hidden hover:bg-white/[0.04] transition">

      {/* IMAGE */}
      <div className="aspect-[4/3] bg-black/40 flex items-center justify-center text-white/30 text-sm">
        Image preview
      </div>

      {/* META */}
      <div className="p-4 space-y-2">
        <div className="text-xs text-white/40">
          Uploaded · Feb 2024
        </div>

        <div className="text-sm font-light">
          Bangkok fitting notes
        </div>

        <div className="flex items-center gap-2 text-xs text-white/40">
          <span className="px-2 py-1 rounded-full bg-white/10">
            Processing
          </span>
        </div>
      </div>
    </div>
  );
}
