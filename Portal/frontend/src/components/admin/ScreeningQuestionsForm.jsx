import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Plus, Trash2 } from 'lucide-react';

const ScreeningQuestionsForm = ({ questions, setQuestions }) => {
    const [newQuestion, setNewQuestion] = useState({
        question: '',
        expectedAnswer: '',
        type: 'text',
        options: [],
        weight: 1
    });

    const handleAddQuestion = () => {
        if (newQuestion.question && newQuestion.expectedAnswer) {
            setQuestions([...questions, { ...newQuestion }]);
            setNewQuestion({
                question: '',
                expectedAnswer: '',
                type: 'text',
                options: [],
                weight: 1
            });
        }
    };

    const handleRemoveQuestion = (index) => {
        setQuestions(questions.filter((_, i) => i !== index));
    };

    const handleOptionChange = (value, index) => {
        const updatedOptions = [...newQuestion.options];
        updatedOptions[index] = value;
        setNewQuestion({ ...newQuestion, options: updatedOptions });
    };

    const addOption = () => {
        setNewQuestion({
            ...newQuestion,
            options: [...newQuestion.options, '']
        });
    };

    const removeOption = (index) => {
        setNewQuestion({
            ...newQuestion,
            options: newQuestion.options.filter((_, i) => i !== index)
        });
    };

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg border border-gray-200">
                <h3 className="text-lg font-semibold mb-4">Add Screening Questions</h3>
                
                <div className="space-y-4">
                    <div>
                        <Label>Question Type</Label>
                        <Select 
                            value={newQuestion.type}
                            onValueChange={(value) => setNewQuestion({ ...newQuestion, type: value })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select question type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="text">Text Answer</SelectItem>
                                <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                                <SelectItem value="yes_no">Yes/No</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <Label>Question</Label>
                        <Input
                            value={newQuestion.question}
                            onChange={(e) => setNewQuestion({ ...newQuestion, question: e.target.value })}
                            placeholder="Enter your question"
                        />
                    </div>

                    {newQuestion.type === 'multiple_choice' && (
                        <div className="space-y-2">
                            <Label>Options</Label>
                            {newQuestion.options.map((option, index) => (
                                <div key={index} className="flex gap-2">
                                    <Input
                                        value={option}
                                        onChange={(e) => handleOptionChange(e.target.value, index)}
                                        placeholder={`Option ${index + 1}`}
                                    />
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => removeOption(index)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                            <Button
                                type="button"
                                variant="outline"
                                onClick={addOption}
                                className="mt-2"
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Add Option
                            </Button>
                        </div>
                    )}

                    <div>
                        <Label>Expected Answer</Label>
                        {newQuestion.type === 'yes_no' ? (
                            <Select 
                                value={newQuestion.expectedAnswer}
                                onValueChange={(value) => setNewQuestion({ ...newQuestion, expectedAnswer: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select expected answer" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="yes">Yes</SelectItem>
                                    <SelectItem value="no">No</SelectItem>
                                </SelectContent>
                            </Select>
                        ) : (
                            <Input
                                value={newQuestion.expectedAnswer}
                                onChange={(e) => setNewQuestion({ ...newQuestion, expectedAnswer: e.target.value })}
                                placeholder="Enter expected answer"
                            />
                        )}
                    </div>

                    <div>
                        <Label>Question Weight (1-5)</Label>
                        <Select 
                            value={newQuestion.weight.toString()}
                            onValueChange={(value) => setNewQuestion({ ...newQuestion, weight: parseInt(value) })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select weight" />
                            </SelectTrigger>
                            <SelectContent>
                                {[1, 2, 3, 4, 5].map((weight) => (
                                    <SelectItem key={weight} value={weight.toString()}>
                                        {weight}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <Button
                        type="button"
                        onClick={handleAddQuestion}
                        className="w-full"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Question
                    </Button>
                </div>
            </div>

            {questions.length > 0 && (
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                    <h3 className="text-lg font-semibold mb-4">Added Questions</h3>
                    <div className="space-y-4">
                        {questions.map((q, index) => (
                            <div key={index} className="flex justify-between items-start p-4 bg-gray-50 rounded-lg">
                                <div>
                                    <p className="font-medium">{q.question}</p>
                                    <p className="text-sm text-gray-600">
                                        Type: {q.type} | Weight: {q.weight}
                                    </p>
                                    {q.type === 'multiple_choice' && (
                                        <div className="mt-2">
                                            <p className="text-sm text-gray-600">Options:</p>
                                            <ul className="list-disc list-inside">
                                                {q.options.map((option, i) => (
                                                    <li key={i} className="text-sm">{option}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                    <p className="text-sm text-gray-600 mt-2">
                                        Expected Answer: {q.expectedAnswer}
                                    </p>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleRemoveQuestion(index)}
                                >
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ScreeningQuestionsForm; 