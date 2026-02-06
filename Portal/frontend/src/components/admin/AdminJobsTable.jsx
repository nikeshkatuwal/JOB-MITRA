import React, { useEffect, useState } from 'react'
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '../ui/table'
import { Avatar, AvatarImage } from '../ui/avatar'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'
import { Edit2, Eye, MoreHorizontal, Trash2 } from 'lucide-react'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { JOB_API_END_POINT } from '@/utils/constant'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog"
import { Button } from '../ui/button'

const AdminJobsTable = () => { 
    const {allAdminJobs, searchJobByText} = useSelector(store=>store.job);
    const { user } = useSelector(state => state.auth);
    const [filterJobs, setFilterJobs] = useState(allAdminJobs);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedJobId, setSelectedJobId] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    
    const navigate = useNavigate();
    const dispatch = useDispatch();

    // Check if user is a recruiter
    const isRecruiter = user?.role === 'admin' || user?.role === 'recruiter';

    const openDeleteDialog = (jobId) => {
        // Only allow recruiters to delete jobs
        if (!isRecruiter) {
            toast.error("You don't have permission to delete job postings");
            return;
        }
        setSelectedJobId(jobId);
        setDeleteDialogOpen(true);
    };

    const deleteJobHandler = async () => {
        if (!selectedJobId) return;
        
        setIsDeleting(true);
        try {
            const res = await axios.delete(`${JOB_API_END_POINT}/delete/${selectedJobId}`, { withCredentials: true });
            if (res.data.success) {
                toast.success("Job deleted successfully");
                // Remove the job from the filtered list
                setFilterJobs(prevJobs => prevJobs.filter(job => job._id !== selectedJobId));
            }
        } catch (error) {
            console.error("Error deleting job:", error);
            toast.error(error.response?.data?.message || "Failed to delete job");
        } finally {
            setIsDeleting(false);
            setDeleteDialogOpen(false);
            setSelectedJobId(null);
        }
    };

    useEffect(()=>{ 
        console.log('called');
        const filteredJobs = allAdminJobs.filter((job)=>{
            if(!searchJobByText){
                return true;
            };
            return job?.title?.toLowerCase().includes(searchJobByText.toLowerCase()) || job?.company?.name.toLowerCase().includes(searchJobByText.toLowerCase());

        });
        setFilterJobs(filteredJobs);
    },[allAdminJobs,searchJobByText])
    
    return (
        <div>
            <Table>
                <TableCaption>A list of your recent posted jobs</TableCaption>
                <TableHeader>
                    <TableRow>
                        <TableHead>Company Name</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {
                        filterJobs?.map((job) => (
                            <tr key={job._id}>
                                <TableCell>{job?.company?.name}</TableCell>
                                <TableCell>{job?.title}</TableCell>
                                <TableCell>{job?.createdAt.split("T")[0]}</TableCell>
                                <TableCell className="text-right cursor-pointer">
                                    <Popover>
                                        <PopoverTrigger><MoreHorizontal /></PopoverTrigger>
                                        <PopoverContent className="w-32">
                                            <div onClick={()=> navigate(`/description/${job._id}`)} className='flex items-center w-fit gap-2 cursor-pointer'>
                                                <Eye className='w-4'/>
                                                <span>View</span>
                                            </div>
                                            
                                            <div onClick={()=> navigate(`/admin/jobs/${job._id}/applicants`)} className='flex items-center w-fit gap-2 cursor-pointer mt-2'>
                                                <Eye className='w-4'/>
                                                <span>Applicants</span>
                                            </div>

                                            {/* Only show delete option to recruiters */}
                                            {isRecruiter && (
                                                <div onClick={() => openDeleteDialog(job._id)} className='flex items-center w-fit gap-2 cursor-pointer mt-2 text-red-600'>
                                                    <Trash2 className='w-4'/>
                                                    <span>Delete</span>
                                                </div>
                                            )}
                                        </PopoverContent>
                                    </Popover>
                                </TableCell>
                            </tr>
                        ))
                    }
                </TableBody>
            </Table>

            {/* Delete confirmation dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Job Posting</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this job posting? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button 
                            variant="outline" 
                            onClick={() => setDeleteDialogOpen(false)}
                            disabled={isDeleting}
                        >
                            Cancel
                        </Button>
                        <Button 
                            variant="destructive" 
                            onClick={deleteJobHandler}
                            disabled={isDeleting}
                            className="flex items-center gap-1"
                        >
                            {isDeleting ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1"></div>
                                    Deleting...
                                </>
                            ) : (
                                <>
                                    <Trash2 className="w-4 h-4" />
                                    Delete Job
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default AdminJobsTable