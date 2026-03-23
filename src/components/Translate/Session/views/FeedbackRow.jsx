// Feedback UI for LangSmith trace rating (good / bad / incorrect)

export default function FeedbackRow({
  runId,
  context,
  currentFeedback,
  sentenceIndex = null,
  onFeedback,
}) {
  if (!runId) return null;

  if (currentFeedback) {
    return (
      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-2">
        <svg
          className="w-4 h-4 text-green-500"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
            clipRule="evenodd"
          />
        </svg>
        Feedback received! Thank you :)
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 mt-2">
      <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
        Rate how we did:
      </span>
      <div className="flex gap-1">
        {[
          {
            type: 'good',
            label: 'Good',
            color:
              'hover:bg-green-100 dark:hover:bg-green-900/30 hover:text-green-600 dark:hover:text-green-400',
          },
          {
            type: 'bad',
            label: 'Bad',
            color:
              'hover:bg-yellow-100 dark:hover:bg-yellow-900/30 hover:text-yellow-600 dark:hover:text-yellow-400',
          },
          {
            type: 'incorrect',
            label: 'Incorrect',
            color:
              'hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400',
          },
        ].map(({ type, label, color }) => (
          <button
            key={type}
            onClick={() => onFeedback(runId, type, context, sentenceIndex)}
            className={`px-2 py-1 text-xs rounded border border-gray-200 dark:border-gray-700
                       text-gray-600 dark:text-gray-400 transition-colors ${color}`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
