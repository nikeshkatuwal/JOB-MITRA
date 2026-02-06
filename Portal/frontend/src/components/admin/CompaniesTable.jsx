import React, { useEffect, useState } from 'react'
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '../ui/table'
import { Avatar, AvatarImage } from '../ui/avatar'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'
import { AlertCircle, Edit2, Loader2, MoreHorizontal, Trash2 } from 'lucide-react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { COMPANY_API_END_POINT } from '@/utils/constant'
import { toast } from 'sonner'
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

const CompaniesTable = () => {
    const { companies, searchCompanyByText } = useSelector(store => store.company);
    const [filterCompany, setFilterCompany] = useState(companies);
    const [deletingCompany, setDeletingCompany] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const navigate = useNavigate();

    useEffect(()=>{
        const filteredCompany = companies.length >= 0 && companies.filter((company)=>{
            if(!searchCompanyByText){
                return true
            };
            return company?.name?.toLowerCase().includes(searchCompanyByText.toLowerCase());

        });
        setFilterCompany(filteredCompany);
    },[companies,searchCompanyByText]);

    const handleDeleteCompany = async () => {
        if (!deletingCompany) return;
        
        try {
            setIsDeleting(true);
            const res = await axios.delete(`${COMPANY_API_END_POINT}/delete/${deletingCompany._id}`, {
                withCredentials: true,
            });
            
            if (res.data.success) {
                toast.success(res.data.message);
                // Remove the company from the filtered list
                setFilterCompany(prev => prev.filter(c => c._id !== deletingCompany._id));
                setDeletingCompany(null);
            }
        } catch (error) {
            console.error('Error deleting company:', error);
            toast.error(error.response?.data?.message || 'Failed to delete company');
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div>
            <Table>
                <TableCaption>A list of your recent registered companies</TableCaption>
                <TableHeader>
                    <TableRow>
                        <TableHead>Logo</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {
                        filterCompany?.map((company) => (
                            <tr key={company._id}>
                                <TableCell>
                                    <Avatar>
                                        <AvatarImage src={company.logo} alt={company.name} />
                                    </Avatar>
                                </TableCell>
                                <TableCell>{company.name}</TableCell>
                                <TableCell>{company.createdAt.split("T")[0]}</TableCell>
                                <TableCell className="text-right cursor-pointer">
                                    <Popover>
                                        <PopoverTrigger><MoreHorizontal /></PopoverTrigger>
                                        <PopoverContent className="w-32">
                                            <div className="flex flex-col gap-2">
                                                <div 
                                                    onClick={()=> navigate(`/admin/companies/${company._id}`)} 
                                                    className='flex items-center gap-2 w-full cursor-pointer hover:bg-gray-100 p-1 rounded'
                                                >
                                                    <Edit2 className='w-4' />
                                                    <span>Edit</span>
                                                </div>
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <div
                                                            className='flex items-center gap-2 w-full cursor-pointer hover:bg-red-50 p-1 rounded text-red-500'
                                                            onClick={() => setDeletingCompany(company)}
                                                        >
                                                            <Trash2 className='w-4' />
                                                            <span>Delete</span>
                                                        </div>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle className="flex items-center gap-2">
                                                                <AlertCircle className="h-5 w-5 text-red-500" />
                                                                Delete Company
                                                            </AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                Are you sure you want to delete {deletingCompany?.name}? This action cannot be undone and will remove all related data.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel onClick={() => setDeletingCompany(null)}>
                                                                Cancel
                                                            </AlertDialogCancel>
                                                            <AlertDialogAction 
                                                                onClick={handleDeleteCompany}
                                                                className="bg-red-500 hover:bg-red-600 text-white"
                                                                disabled={isDeleting}
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
                                        </PopoverContent>
                                    </Popover>
                                </TableCell>
                            </tr>
                        ))
                    }
                </TableBody>
            </Table>
        </div>
    )
}

export default CompaniesTable