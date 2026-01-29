// Master Focus Selector Controller
// Handles business logic for combined pool focus selection with limits

import { useState, useEffect } from "react";


export default function MasterFocusSelector({
  isOpen,
  allGrammarItems,  // Combined from all grammar sets
  allVocabItems,    // Combined from all vocab sets
  initialGrammarIds,
  initialVocabIds,
  onConfirm,
  onClose
}) {
  const [selectedGrammarIds, setSelectedGrammarIds] = useState([]);
  const [selectedVocabIds, setSelectedVocabIds] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  const MAX_GRAMMAR = 2;
  const MAX_VOCAB = 10;

  // Initialize when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedGrammarIds(initialGrammarIds || []);
      setSelectedVocabIds(initialVocabIds || []);
      setSearchQuery("");
    }
  }, [isOpen, initialGrammarIds, initialVocabIds]);

  const handleGrammarToggle = (itemId) => {
    setSelectedGrammarIds(prev => {
      if (prev.includes(itemId)) {
        return prev.filter(id => id !== itemId);
      } else if (prev.length < MAX_GRAMMAR) {
        return [...prev, itemId];
      }
      return prev; // Already at max
    });
  };

  const handleVocabToggle = (itemId) => {
    setSelectedVocabIds(prev => {
      if (prev.includes(itemId)) {
        return prev.filter(id => id !== itemId);
      } else if (prev.length < MAX_VOCAB) {
        return [...prev, itemId];
      }
      return prev; // Already at max
    });
  };

  const handleConfirm = () => {
    onConfirm(selectedGrammarIds, selectedVocabIds);
    onClose();
  };

  return (
    <></>
  );
}
