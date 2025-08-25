// /learn/learning_material/create-learning_material.js
import Head from "next/head";
import Sidebar from "../../../components/Sidebar";
import { withPageAuthRequired } from "@auth0/nextjs-auth0";
import { useState } from "react";
import { useRouter } from "next/router";
import {
    FaBook,
    FaPlus,
    FaTrash,
    FaArrowLeft,
    FaSave,
    FaChevronDown,
    FaChevronUp,
    FaGripVertical,
    FaLanguage,
    FaPencilAlt,
    FaBookOpen,
    FaTimes,
    FaCheck,
    FaUniversity,
    FaCalendarAlt,
    FaClipboardList,
    FaCheckCircle,
    FaArrowRight,
    FaLightbulb
} from "react-icons/fa";
import Learning_materialInfoForm from "../../../components/create-set/Learning_materialInfoForm";
import SectionsBuilder from "../../../components/create-set/SectionsBuilder";

import {
    FaArrowTrendUp,
    FaListCheck,
    FaFileLines
} from "react-icons/fa6";
import { MdTranslate, MdSchool } from "react-icons/md";

export default function CreateLearning_material() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [activeStep, setActiveStep] = useState(1); // 1: Learning_material Info, 2: Add Sections, 3: Review

    // Learning_material basic info
    const [learning_materialInfo, setLearning_materialInfo] = useState({
        title: "",
        // learningMaterials: "", // REMOVED
        institution: "Self-Study",
        description: "",
        startDate: "",
        endDate: "",
        studyGoal: ""
    });

    // Sections state
    const [sections, setSections] = useState([]);
    const [currentSection, setCurrentSection] = useState({
        title: "",
        description: "",
        grammar: [],
        vocabulary: [],
        isExpanded: true
    });

    const [editingSectionId, setEditingSectionId] = useState(null);

    // Current grammar/vocab being added
    const [currentGrammar, setCurrentGrammar] = useState({
        point: "",
        explanation: "",
        examples: [""]
    });

    const [currentVocab, setCurrentVocab] = useState({
        word: "",
        reading: "",
        meaning: "",
        examples: [""],
        tags: []
    });

    const [showGrammarForm, setShowGrammarForm] = useState(false);
    const [showVocabForm, setShowVocabForm] = useState(false);

    // Handle learning_material info changes
    const handleLearning_materialInfoChange = (field, value) => {
        setLearning_materialInfo(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const startEditingSection = (lesson) => {
        // Load the saved lesson into the editor
        setCurrentSection({
            title: lesson.title || "",
            description: lesson.description || "",
            grammar: lesson.grammar || [],
            vocabulary: lesson.vocabulary || [],
            isExpanded: true
        });
        setEditingSectionId(lesson.id);
        setShowGrammarForm(false);
        setShowVocabForm(false);
    };

    const cancelEditing = () => {
        // Clear the editor and exit edit mode
        setCurrentSection({
            title: "",
            description: "",
            grammar: [],
            vocabulary: [],
            isExpanded: true
        });
        setEditingSectionId(null);
        setShowGrammarForm(false);
        setShowVocabForm(false);
    };


    // Add grammar point to current lesson
    const addGrammarPoint = () => {
        if (currentGrammar.point && currentGrammar.explanation) {
            setCurrentSection(prev => ({
                ...prev,
                grammar: [...prev.grammar, { ...currentGrammar, id: Date.now() }]
            }));
            setCurrentGrammar({ point: "", explanation: "", examples: [""] });
            setShowGrammarForm(false);
        }
    };

    // Add vocabulary to current lesson
    const addVocabulary = () => {
        if (currentVocab.word && currentVocab.meaning) {
            setCurrentSection(prev => ({
                ...prev,
                vocabulary: [...prev.vocabulary, { ...currentVocab, id: Date.now() }]
            }));
            setCurrentVocab({ word: "", reading: "", meaning: "", examples: [""], tags: [] });
            setShowVocabForm(false);
        }
    };

    // Add example to grammar or vocab
    const addExample = (type) => {
        if (type === 'grammar') {
            setCurrentGrammar(prev => ({
                ...prev,
                examples: [...prev.examples, ""]
            }));
        } else {
            setCurrentVocab(prev => ({
                ...prev,
                examples: [...prev.examples, ""]
            }));
        }
    };

    // Update example
    const updateExample = (type, index, value) => {
        if (type === 'grammar') {
            setCurrentGrammar(prev => ({
                ...prev,
                examples: prev.examples.map((ex, i) => i === index ? value : ex)
            }));
        } else {
            setCurrentVocab(prev => ({
                ...prev,
                examples: prev.examples.map((ex, i) => i === index ? value : ex)
            }));
        }
    };

    // Remove example
    const removeExample = (type, index) => {
        if (type === 'grammar') {
            setCurrentGrammar(prev => ({
                ...prev,
                examples: prev.examples.filter((_, i) => i !== index)
            }));
        } else {
            setCurrentVocab(prev => ({
                ...prev,
                examples: prev.examples.filter((_, i) => i !== index)
            }));
        }
    };

    // Save current lesson and add to sections array
    const saveSection = () => {
        if (!currentSection.title) return;

        if (editingSectionId) {
            // Update existing saved section
            setSections(prev =>
                prev.map(l =>
                    l.id === editingSectionId ? { ...currentSection, id: editingSectionId } : l
                )
            );
            // Exit edit mode & clear the form
            setEditingSectionId(null);
            setCurrentSection({
                title: "",
                description: "",
                grammar: [],
                vocabulary: [],
                isExpanded: true
            });
            setShowGrammarForm(false);
            setShowVocabForm(false);
            return;
        }

        // Create new section
        setSections(prev => [...prev, { ...currentSection, id: Date.now() }]);
        setCurrentSection({
            title: "",
            description: "",
            grammar: [],
            vocabulary: [],
            isExpanded: true
        });
        setShowGrammarForm(false);
        setShowVocabForm(false);
    };


    // Remove lesson
    const removeSection = (id) => {
        setSections(prev => prev.filter(lesson => lesson.id !== id));
    };

    // Remove grammar point from current lesson
    const removeGrammarFromSection = (id) => {
        setCurrentSection(prev => ({
            ...prev,
            grammar: prev.grammar.filter(g => g.id !== id)
        }));
    };

    // Remove vocabulary from current lesson
    const removeVocabFromSection = (id) => {
        setCurrentSection(prev => ({
            ...prev,
            vocabulary: prev.vocabulary.filter(v => v.id !== id)
        }));
    };

    // Toggle lesson expansion
    const toggleSectionExpansion = (id) => {
        setSections(prev => prev.map(lesson =>
            lesson.id === id ? { ...lesson, isExpanded: !lesson.isExpanded } : lesson
        ));
    };

    // Build the exact payload we want to persist
    const buildLearning_materialPayload = () => {
        // Stage sections to include the in-progress editor state
        let stagedSections = sections;

        if (currentSection.title) {
            stagedSections = editingSectionId
                // If currently editing an existing section, replace it in-place
                ? sections.map((s) =>
                    s.id === editingSectionId ? { ...currentSection, id: editingSectionId } : s
                )
                // Otherwise, append the new in-progress section with a generated id
                : [...sections, { ...currentSection, id: Date.now() }];
        }

        // Shape/clean data for storage (omit UI-only fields, remove blank examples)
        const cleanedSections = stagedSections.map((s) => ({
            id: s.id,
            title: s.title,
            description: s.description,
            grammar: (s.grammar || []).map((g) => ({
                id: g.id,
                point: g.point,
                explanation: g.explanation,
                examples: (g.examples || []).filter(Boolean),
            })),
            vocabulary: (s.vocabulary || []).map((v) => ({
                id: v.id,
                word: v.word,
                reading: v.reading,
                meaning: v.meaning,
                examples: (v.examples || []).filter(Boolean),
                tags: v.tags || [],
            })),
            // intentionally omit s.isExpanded
        }));

        return {
            ...learning_materialInfo,
            sections: cleanedSections,
            createdAt: new Date().toISOString(),
        };
    };


    // Handle final learning_material creation
    const handleCreateLearning_material = async () => {
        setIsLoading(true);
        try {
            const payload = buildLearning_materialPayload();

            // keep your console logs for now
            console.log('payload object', payload);
            console.log('payload JSON', JSON.stringify(payload, null, 2));

            const resp = await fetch('/api/database/v1/learning_materials/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const data = await resp.json();
            if (!resp.ok) throw new Error(data.error || 'Create failed');

            // success UX: route or toast
            // router.push(`/learn/learning_materials/${data.learning_materialId}`); // or your destination
        } catch (err) {
            console.error(err);
            // show error toast/banner in UI
        } finally {
            setIsLoading(false);
            router.push('/learn/home')
        }
    };


    const canProceedToNextStep = () => {
        if (activeStep === 1) {
            return learning_materialInfo.title; // REMOVED: && learning_materialInfo.learningMaterials
        }
        if (activeStep === 2) {
            return sections.length > 0 || currentSection.title;
        }
        return true;
    };

    return (
        <div className="flex min-h-screen bg-gray-50 dark:bg-[#141f25]">
            <Sidebar />

            <main className="ml-auto max-h-screen overflow-scroll flex-1 px-8 py-6">
                <Head>
                    <title>Create Learning Material • ReBabel</title>
                    <link rel="icon" href="/favicon.ico" />
                </Head>

                {/* Header */}
                <div className="mb-6">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4 transition-colors"
                    >
                        <FaArrowLeft />
                        <span>Back to Dashboard</span>
                    </button>

                    <div className="bg-white dark:bg-[#1c2b35] rounded-xl shadow-sm p-6">
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                            Create New Learning Material
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400">
                            Add your learning materials and organize sections with grammar and vocabulary
                        </p>

                        {/* Progress Steps */}
                        <div className="flex items-center gap-4 mt-6">
                            {[
                                { step: 1, label: "Learning Material Info" },
                                { step: 2, label: "Add Sections" },
                                { step: 3, label: "Review & Create" }
                            ].map((item) => (
                                <div
                                    key={item.step}
                                    className={`flex items-center gap-2 ${item.step < 3 ? 'flex-1' : ''
                                        }`}
                                >
                                    <div
                                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${activeStep >= item.step
                                            ? 'bg-gradient-to-r from-[#e30a5f] to-[#f41567] text-white'
                                            : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                                            }`}
                                    >
                                        {activeStep > item.step ? <FaCheck /> : item.step}
                                    </div>
                                    <span className={`text-sm font-medium ${activeStep >= item.step
                                        ? 'text-gray-900 dark:text-white'
                                        : 'text-gray-500 dark:text-gray-400'
                                        }`}>
                                        {item.label}
                                    </span>
                                    {item.step < 3 && (
                                        <div className={`flex-1 h-0.5 ${activeStep > item.step
                                            ? 'bg-gradient-to-r from-[#e30a5f] to-[#f41567]'
                                            : 'bg-gray-200 dark:bg-gray-700'
                                            }`} />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Step 1: Learning_material Information */}
                {activeStep === 1 && (
                    <Learning_materialInfoForm
                        learning_materialInfo={learning_materialInfo}
                        onChange={handleLearning_materialInfoChange}
                        onNext={() => setActiveStep(2)}
                    />
                )}


                {/* Step 2: Add Sections */}
                {activeStep === 2 && (
                    <SectionsBuilder
                        sections={sections}
                        currentSection={currentSection}
                        setCurrentSection={setCurrentSection}
                        editingSectionId={editingSectionId}
                        showGrammarForm={showGrammarForm}
                        setShowGrammarForm={setShowGrammarForm}
                        showVocabForm={showVocabForm}
                        setShowVocabForm={setShowVocabForm}
                        currentGrammar={currentGrammar}
                        setCurrentGrammar={setCurrentGrammar}
                        currentVocab={currentVocab}
                        setCurrentVocab={setCurrentVocab}
                        actions={{
                            startEditingSection,
                            cancelEditing,
                            addGrammarPoint,
                            addVocabulary,
                            addExample,
                            updateExample,
                            removeExample,
                            saveSection,
                            removeSection,
                            removeGrammarFromSection,
                            removeVocabFromSection,
                            toggleSectionExpansion,
                        }}
                        onBack={() => setActiveStep(1)}
                        onReview={() => {
                            if (currentSection.title) {
                                saveSection();
                            }
                            setActiveStep(3);
                        }}
                        canProceed={canProceedToNextStep()}
                    />
                )}


                {/* Step 3: Review and Create */}
                {activeStep === 3 && (
                    <div className="space-y-6">
                        {/* Learning_material Summary */}
                        <div className="bg-white dark:bg-[#1c2b35] rounded-xl shadow-sm p-6">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                                Review Your Learning Material
                            </h2>

                            {/* Learning_material Info Summary */}
                            <div className="mb-8">
                                <h3 className="text-md font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                    <FaBook className="text-[#e30a5f]" />
                                    Learning Material Information
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                                    <div>
                                        <p className="text-xs text-gray-600 dark:text-gray-400">Title</p>
                                        <p className="font-medium text-gray-900 dark:text-white">{learning_materialInfo.title}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-600 dark:text-gray-400">Institution</p>
                                        <p className="font-medium text-gray-900 dark:text-white">{learning_materialInfo.institution}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-600 dark:text-gray-400">Study Goal</p>
                                        <p className="font-medium text-gray-900 dark:text-white">
                                            {learning_materialInfo.studyGoal || 'Not specified'}
                                        </p>
                                    </div>
                                    {learning_materialInfo.startDate && (
                                        <div>
                                            <p className="text-xs text-gray-600 dark:text-gray-400">Start Date</p>
                                            <p className="font-medium text-gray-900 dark:text-white">
                                                {new Date(learning_materialInfo.startDate).toLocaleDateString()}
                                            </p>
                                        </div>
                                    )}
                                    {learning_materialInfo.endDate && (
                                        <div>
                                            <p className="text-xs text-gray-600 dark:text-gray-400">Target End Date</p>
                                            <p className="font-medium text-gray-900 dark:text-white">
                                                {new Date(learning_materialInfo.endDate).toLocaleDateString()}
                                            </p>
                                        </div>
                                    )}
                                </div>
                                {learning_materialInfo.description && (
                                    <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Description</p>
                                        <p className="text-sm text-gray-700 dark:text-gray-300">{learning_materialInfo.description}</p>
                                    </div>
                                )}
                            </div>

                            {/* Sections Summary */}
                            <div>
                                <h3 className="text-md font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                    <FaClipboardList className="text-[#e30a5f]" />
                                    Sections ({sections.length})
                                </h3>

                                {/* Stats Overview */}
                                <div className="grid grid-cols-3 gap-4 mb-4">
                                    <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg">
                                        <p className="text-xs text-gray-600 dark:text-gray-400">Total Sections</p>
                                        <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                            {sections.length}
                                        </p>
                                    </div>
                                    <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg">
                                        <p className="text-xs text-gray-600 dark:text-gray-400">Grammar Points</p>
                                        <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                                            {sections.reduce((acc, l) => acc + l.grammar.length, 0)}
                                        </p>
                                    </div>
                                    <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg">
                                        <p className="text-xs text-gray-600 dark:text-gray-400">Vocabulary Items</p>
                                        <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                                            {sections.reduce((acc, l) => acc + l.vocabulary.length, 0)}
                                        </p>
                                    </div>
                                </div>

                                {/* Sections List */}
                                <div className="space-y-3">
                                    {sections.map((lesson, index) => (
                                        <div
                                            key={lesson.id}
                                            className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <h4 className="font-medium text-gray-900 dark:text-white">
                                                        Section {index + 1}: {lesson.title}
                                                    </h4>
                                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                                        {lesson.grammar.length} grammar • {lesson.vocabulary.length} vocabulary
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <FaCheckCircle className="text-green-500" />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="bg-white dark:bg-[#1c2b35] rounded-xl shadow-sm p-6">
                            <div className="flex items-center gap-3 mb-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                <FaLightbulb className="text-green-600 dark:text-green-400 text-lg" />
                                <div>
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                                        Ready to Create Your Learning Material!
                                    </p>
                                    <p className="text-xs text-gray-600 dark:text-gray-400">
                                        You can always edit sections and add more content later.
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setActiveStep(2)}
                                    className="px-6 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium"
                                >
                                    Back to Edit
                                </button>
                                <button
                                    onClick={handleCreateLearning_material}
                                    disabled={isLoading}
                                    className="flex-1 px-6 py-3 bg-gradient-to-r from-[#e30a5f] to-[#f41567] text-white rounded-lg font-medium hover:shadow-lg transition-all flex items-center justify-center gap-2"
                                >
                                    {isLoading ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            Creating Learning Material...
                                        </>
                                    ) : (
                                        <>
                                            <FaCheck />
                                            Create Learning Material
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

export const getServerSideProps = withPageAuthRequired();