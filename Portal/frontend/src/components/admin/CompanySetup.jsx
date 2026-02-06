import React, { useEffect, useState } from 'react';
import Navbar from '../shared/Navbar';
import { Button } from '../ui/button';
import { AlertCircle, ArrowLeft, Loader2, Trash2 } from 'lucide-react';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import axios from 'axios';
import { COMPANY_API_END_POINT } from '@/utils/constant';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useSelector, useDispatch } from 'react-redux';
import useGetCompanyById from '@/hooks/useGetCompanyById';
import { 
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger, 
} from "../ui/alert-dialog";

const CompanySetup = () => {
    const params = useParams();
    useGetCompanyById(params.id);
    const [input, setInput] = useState({
        name: '',
        description: '',
        website: '',
        location: '',
        file: null,
    });
    const { singleCompany } = useSelector((store) => store.company);
    const [loading, setLoading] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const changeEventHandler = (e) => {
        setInput({ ...input, [e.target.name]: e.target.value });
    };

    const changeFileHandler = (e) => {
        const file = e.target.files?.[0];
        setInput({ ...input, file });
    };

    const submitHandler = async (e) => {
        e.preventDefault();
        
        // Validate required fields
        if (!input.name || !input.description || !input.website || !input.location) {
            toast.error("Please fill in all required fields");
            return;
        }

        const formData = new FormData();
        formData.append('name', input.name);
        formData.append('description', input.description);
        formData.append('website', input.website);
        formData.append('location', input.location);
        
        // Only append file if it exists
        if (input.file instanceof File) {
            formData.append('file', input.file);
        }

        try {
            setLoading(true);
            const res = await axios.put(`${COMPANY_API_END_POINT}/update/${params.id}`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                withCredentials: true,
            });
            
            if (res.data.success) {
                toast.success(res.data.message);
                navigate('/admin/companies');
            }
        } catch (error) {
            console.error('Error updating company:', error);
            toast.error(error.response?.data?.message || 'Failed to update company');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteCompany = async () => {
        try {
            setIsDeleting(true);
            const res = await axios.delete(`${COMPANY_API_END_POINT}/delete/${params.id}`, {
                withCredentials: true,
            });
            
            if (res.data.success) {
                toast.success(res.data.message);
                navigate('/admin/companies');
            }
        } catch (error) {
            console.error('Error deleting company:', error);
            toast.error(error.response?.data?.message || 'Failed to delete company');
        } finally {
            setIsDeleting(false);
        }
    };

    useEffect(() => {
        setInput({
            name: singleCompany?.name || '',
            description: singleCompany?.description || '',
            website: singleCompany?.website || '',
            location: singleCompany?.location || '',
            file: singleCompany?.file || null,
        });
    }, [singleCompany]);

    return (
        <div className="bg-gray-50 dark:bg-gray-900 min-h-screen text-gray-900 dark:text-gray-100">
            <Navbar />
            <div className="max-w-3xl mx-auto my-10 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
                <form onSubmit={submitHandler}>
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-4">
                            <Button
                                onClick={() => navigate('/admin/companies')}
                                variant="outline"
                                className="flex items-center gap-2 text-blue-500 font-semibold"
                                type="button"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                <span>Back</span>
                            </Button>
                            <h1 className="font-bold text-2xl">Company Setup</h1>
                        </div>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button 
                                    variant="destructive" 
                                    className="flex items-center gap-2"
                                    type="button"
                                    disabled={isDeleting}
                                >
                                    {isDeleting ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Trash2 className="h-4 w-4" />
                                    )}
                                    Delete
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle className="flex items-center gap-2">
                                        <AlertCircle className="h-5 w-5 text-red-500" />
                                        Delete Company
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Are you sure you want to delete this company? This action cannot be undone and will remove all related data.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction 
                                        onClick={handleDeleteCompany}
                                        className="bg-red-500 hover:bg-red-600 text-white"
                                    >
                                        {isDeleting ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Deleting...
                                            </>
                                        ) : (
                                            'Delete'
                                        )}
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label>Company Name</Label>
                            <Input
                                type="text"
                                name="name"
                                value={input.name}
                                onChange={changeEventHandler}
                                className="mt-1"
                                required
                            />
                        </div>
                        <div>
                            <Label>Description</Label>
                            <Input
                                type="text"
                                name="description"
                                value={input.description}
                                onChange={changeEventHandler}
                                className="mt-1"
                                required
                            />
                        </div>
                        <div>
                            <Label>Website</Label>
                            <Input
                                type="text"
                                name="website"
                                value={input.website}
                                onChange={changeEventHandler}
                                className="mt-1"
                                required
                            />
                        </div>
                        <div>
                            <Label>Location</Label>
                            <Input
                                type="text"
                                name="location"
                                value={input.location}
                                onChange={changeEventHandler}
                                className="mt-1"
                                required
                            />
                        </div>
                        <div>
                            <Label>Logo</Label>
                            <Input
                                type="file"
                                accept="image/*"
                                onChange={changeFileHandler}
                                className="mt-1"
                            />
                        </div>
                        {singleCompany?.logo && (
                            <div className="flex flex-col">
                                <Label>Current Logo</Label>
                                <img
                                    src={singleCompany.logo}
                                    alt="Company Logo"
                                    className="w-24 h-24 mt-1 object-cover rounded-md border border-gray-200"
                                />
                            </div>
                        )}
                    </div>
                    <div className="mt-6">
                        {loading ? (
                            <Button className="w-full flex items-center justify-center" disabled>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Please wait
                            </Button>
                        ) : (
                            <Button type="submit" className="w-full">
                                Update
                            </Button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CompanySetup;
