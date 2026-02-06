import React, { useState } from 'react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Separator } from "../ui/separator";
import { Check, Sparkles, Brain, ListChecks, Lightbulb, AlertCircle, Plus, Eye, EyeOff } from "lucide-react";
import { motion } from "framer-motion";

const AISuggestions = ({ suggestions, onClose, onApplySuggestion, onPostJob }) => {
    const [showToApplicants, setShowToApplicants] = useState(false);
    
    if (!suggestions) return null;

    const {
        improvements = [],
        additionalSkills = [],
        screeningQuestions = [],
        structuredRequirements = []
    } = suggestions;

    // Helper to check if we have suggestions of a particular type
    const hasSuggestions = (arr) => Array.isArray(arr) && arr.length > 0;
    
    const handlePostJob = () => {
        // Pass the showToApplicants flag to the parent component
        onPostJob(showToApplicants);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold">🤖 AI Suggestions</h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-gray-200 transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>

                <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Eye className="h-5 w-5 text-blue-500" />
                            <label htmlFor="showToApplicants" className="text-sm font-medium text-blue-700">
                                Show selected AI suggestions to applicants
                            </label>
                        </div>
                        <div className="relative inline-block w-10 mr-2 align-middle select-none">
                            <input 
                                type="checkbox" 
                                id="showToApplicants"
                                checked={showToApplicants}
                                onChange={(e) => setShowToApplicants(e.target.checked)}
                                className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 border-gray-300 appearance-none cursor-pointer transition-transform duration-200 ease-in-out checked:right-0 checked:border-blue-500"
                            />
                            <label 
                                htmlFor="showToApplicants"
                                className="toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer"
                            ></label>
                        </div>
                    </div>
                    <p className="mt-2 text-xs text-blue-700 font-bold">
                        IMPORTANT: This toggle is currently {showToApplicants ? "ON" : "OFF"}. {showToApplicants 
                            ? "Approved suggestions WILL be visible to applicants." 
                            : "Approved suggestions will NOT be visible to applicants unless you turn this ON."}
                    </p>
                </div>

                <div className="space-y-6">
                    {/* Improvements Section */}
                    {hasSuggestions(improvements) && (
                        <div>
                            <h3 className="text-xl font-semibold mb-2">Suggested Improvements</h3>
                            <ul className="list-disc pl-5 space-y-1">
                                {improvements.map((improvement, index) => (
                                    <li key={index} className="text-gray-800 flex items-start justify-between gap-2">
                                        <span>{improvement}</span>
                                        <Button
                                            onClick={() => onApplySuggestion('improvements', improvement)}
                                            variant="outline"
                                            size="sm"
                                            className="flex items-center gap-1 text-xs py-1 h-auto min-h-0"
                                        >
                                            <Check className="h-3 w-3" /> Apply
                                        </Button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Additional Skills Section */}
                    {hasSuggestions(additionalSkills) && (
                        <div>
                            <h3 className="text-xl font-semibold mb-2">Recommended Additional Skills</h3>
                            <div className="flex flex-wrap gap-2">
                                {additionalSkills.map((skill, index) => (
                                    <Badge
                                        key={index}
                                        variant="outline"
                                        className="group flex items-center gap-1 px-3 py-1 hover:bg-blue-50 cursor-pointer"
                                        onClick={() => onApplySuggestion('additionalSkills', skill)}
                                    >
                                        <span>{skill}</span>
                                        <Plus className="h-3 w-3 invisible group-hover:visible" />
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Structured Requirements Section */}
                    {hasSuggestions(structuredRequirements) && (
                        <div>
                            <h3 className="text-xl font-semibold mb-2">Suggested Requirements</h3>
                            <div className="grid gap-3">
                                {structuredRequirements.map((req, index) => (
                                    <div key={index} className="p-3 border border-gray-200 rounded-lg flex justify-between items-start">
                                        <div>
                                            <div className="font-medium">{req.skill}</div>
                                            {req.category && <div className="text-sm text-gray-600">Category: {req.category}</div>}
                                            {req.level && <div className="text-sm text-gray-600">Level: {req.level}</div>}
                                            <div className="text-sm text-gray-600">
                                                Importance: {typeof req.importance === 'number' ? 
                                                    (req.importance === 1 ? 'Must-have' : 'Preferred') : 
                                                    req.importance}
                                            </div>
                                        </div>
                                        {onApplySuggestion && (
                                            <Button 
                                                size="sm" 
                                                variant="outline"
                                                onClick={() => onApplySuggestion('structuredRequirements', req)}
                                            >
                                                <Plus className="h-3 w-3 mr-1" />
                                                Add
                                            </Button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Screening Questions Section */}
                    {hasSuggestions(screeningQuestions) && (
                        <div>
                            <h3 className="text-xl font-semibold mb-2">Suggested Screening Questions</h3>
                            <ol className="list-decimal pl-5 space-y-2">
                                {screeningQuestions.map((question, index) => (
                                    <li key={index} className="text-gray-800 flex items-start justify-between gap-2">
                                        <span>
                                            {typeof question === 'string' 
                                                ? question 
                                                : question.question || 'Missing question text'}
                                        </span>
                                        {onApplySuggestion && (
                                            <Button 
                                                size="sm" 
                                                variant="outline"
                                                onClick={() => onApplySuggestion('screeningQuestions', question)}
                                            >
                                                <Plus className="h-3 w-3 mr-1" />
                                                Add
                                            </Button>
                                        )}
                                    </li>
                                ))}
                            </ol>
                        </div>
                    )}

                    {/* No Suggestions Case */}
                    {!hasSuggestions(improvements) && 
                     !hasSuggestions(additionalSkills) && 
                     !hasSuggestions(screeningQuestions) && 
                     !hasSuggestions(structuredRequirements) && (
                        <div className="text-center py-8">
                            <p className="text-gray-500">No AI suggestions available for this job posting.</p>
                        </div>
                    )}
                </div>

                <div className="mt-6 flex justify-end gap-3">
                    <Button
                        variant="default"
                        onClick={onClose}
                        className="bg-blue-600 hover:bg-blue-700"
                    >
                        Close
                    </Button>
                    <Button 
                        variant="default"
                        onClick={handlePostJob}
                        className="bg-green-600 hover:bg-green-700"
                    >
                        Post Job Now
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default AISuggestions;