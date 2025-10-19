type Suggestion = {
  [variable: string]: string | number; // variable name → suggested change
};

interface SuggestionPanelProps {
  suggestions: Suggestion;
}

export default function SuggestionPanel({ suggestions }: SuggestionPanelProps) {
  return (
    <section className="h-64 flex flex-col gap-2 bg-slate-800 p-4 rounded border border-slate-700">
      <h3 className="text-lg font-semibold text-slate-100 mb-2">Suggestions</h3>
      {Object.keys(suggestions).length === 0 ? (
        <div className="text-slate-400 text-sm">No suggestions available</div>
      ) : (
        Object.entries(suggestions).map(([variable, change]) => (
          <div
            key={variable}
            className="flex justify-between items-center p-2 bg-slate-700 rounded hover:bg-slate-600 transition-colors"
          >
            <span className="text-slate-100 font-medium">{variable}</span>
            <span className="text-slate-300">{change}</span>
          </div>
        ))
      )}
    </section>
  );
}
