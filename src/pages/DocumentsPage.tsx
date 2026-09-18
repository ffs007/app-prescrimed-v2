import DocumentsHistoryPanel from "@/modules/documents/DocumentsHistoryPanel";

export default function DocumentsPage() {
  return (
    <div className="container mx-auto max-w-5xl px-4 py-6">
      <h1 className="text-2xl font-bold mb-4">Documentos</h1>
      <DocumentsHistoryPanel />
    </div>
  );
}
