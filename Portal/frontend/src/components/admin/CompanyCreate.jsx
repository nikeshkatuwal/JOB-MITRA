import React, { useState } from 'react';
import Navbar from '../shared/Navbar';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Button } from '../ui/button';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { COMPANY_API_END_POINT } from '@/utils/constant';
import { toast } from 'sonner';
import { useDispatch } from 'react-redux';
import { setSingleCompany } from '@/redux/companySlice';
import { Loader2 } from 'lucide-react';

const CompanyCreate = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        location: '',
        website: '',
        file: null
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [previewUrl, setPreviewUrl] = useState(null);

    const handleChange = (e) => {
        const { name, value, files } = e.target;
        if (name === 'file' && files?.length > 0) {
            const file = files[0];
            setFormData(prev => ({
                ...prev,
                file
            }));
            // Create preview URL for the image
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewUrl(reader.result);
            };
            reader.readAsDataURL(file);
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    const registerNewCompany = async () => {
        // Validate all required fields
        if (!formData.name || !formData.description || !formData.location || !formData.website) {
            toast.error("Please fill in all required fields");
            return;
        }

        setIsSubmitting(true);
        try {
            const submitData = new FormData();
            submitData.append('name', formData.name);
            submitData.append('description', formData.description);
            submitData.append('location', formData.location);
            submitData.append('website', formData.website);
            if (formData.file) {
                submitData.append('file', formData.file);
            }

            // Debug - log the form data
            console.log("Sending form data:", {
                name: formData.name,
                description: formData.description.substring(0, 30) + "...",
                location: formData.location,
                website: formData.website,
                hasFile: !!formData.file,
                fileType: formData.file?.type,
                fileSize: formData.file?.size
            });

            // Important: Do NOT set the Content-Type header when using FormData
            // Let the browser set it automatically with the correct boundary
            const res = await axios.post(`${COMPANY_API_END_POINT}/register`, submitData, {
                withCredentials: true,
            });
            if (res?.data?.success) {
                dispatch(setSingleCompany(res.data.company));
                toast.success(res.data.message);
                const companyId = res?.data?.company?._id;
                navigate(`/admin/companies/${companyId}`);
            }
        } catch (error) {
            console.error("Error creating company:", error);
            console.error("Error response:", error.response?.data);
            toast.error(error.response?.data?.message || "Failed to register company");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
            <Navbar />
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Create Your Company</h1>
                        <p className="text-blue-500 mt-2">
                            Enter your company details below. You can update these later.
                        </p>
                    </div>
                    
                    <div className="space-y-6">
                        <div>
                            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Company Name *</Label>
                            <Input
                                type="text"
                                name="name"
                                className="mt-2"
                                placeholder="e.g., JobHunt, Microsoft"
                                value={formData.name}
                                onChange={handleChange}
                            />
                        </div>

                        <div>
                            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Description *</Label>
                            <Textarea
                                name="description"
                                className="mt-2"
                                placeholder="Brief description of your company"
                                value={formData.description}
                                onChange={handleChange}
                            />
                        </div>

                        <div>
                            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Location *</Label>
                            <Input
                                type="text"
                                name="location"
                                className="mt-2"
                                placeholder="e.g., Mountain View, California, United States"
                                value={formData.location}
                                onChange={handleChange}
                            />
                        </div>

                        <div>
                            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Website *</Label>
                            <Input
                                type="url"
                                name="website"
                                className="mt-2"
                                placeholder="https://example.com"
                                value={formData.website}
                                onChange={handleChange}
                            />
                        </div>

                        <div>
                            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Company Logo</Label>
                            <div className="mt-2 space-y-4">
                                <Input
                                    type="file"
                                    name="file"
                                    accept="image/*"
                                    onChange={handleChange}
                                    className="mt-2"
                                />
                                {previewUrl && (
                                    <div className="mt-4">
                                        <p className="text-sm text-gray-500 mb-2">Preview:</p>
                                        <img
                                            src={previewUrl}
                                            alt="Logo preview"
                                            className="w-32 h-32 object-cover rounded-lg border border-gray-200"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    
                    <div className="mt-8">
                        <Button
                            onClick={registerNewCompany}
                            className="w-full"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                'Create Company'
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CompanyCreate;
