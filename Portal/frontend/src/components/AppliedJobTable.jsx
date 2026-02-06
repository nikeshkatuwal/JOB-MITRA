import React from 'react'
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { Badge } from './ui/badge'
import { useSelector } from 'react-redux'
import { Briefcase, Building } from 'lucide-react'

const AppliedJobTable = () => {
    const { allAppliedJobs } = useSelector(store => store.job);
    
    if (allAppliedJobs.length === 0) {
        return (
            <div className="text-center p-8 bg-gray-50 rounded-lg">
                <Briefcase className="h-12 w-12 mx-auto text-gray-400" />
                <h3 className="mt-4 text-lg font-medium text-gray-900">No applications yet</h3>
                <p className="mt-2 text-sm text-gray-500">
                    You haven't applied to any jobs yet. Browse available positions and start your application journey!
                </p>
            </div>
        );
    }
    
    return (
        <div className="overflow-x-auto">
            <Table>
                <TableCaption>A list of your applied jobs</TableCaption>
                <TableHeader>
                    <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Job Role</TableHead>
                        <TableHead>Company</TableHead>
                        <TableHead className="text-right">Status</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {allAppliedJobs.map((appliedJob) => (
                        <TableRow key={appliedJob._id}>
                            <TableCell>{new Date(appliedJob.createdAt).toLocaleDateString()}</TableCell>
                            <TableCell>
                                {appliedJob.job?.title || "Job no longer available"}
                            </TableCell>
                            <TableCell>
                                {appliedJob.job?.company?.name || "Unknown company"}
                            </TableCell>
                            <TableCell className="text-right">
                                <Badge className={`${
                                    appliedJob?.status === "rejected" ? 'bg-red-400 hover:bg-red-500' : 
                                    appliedJob.status === 'pending' ? 'bg-gray-400 hover:bg-gray-500' : 
                                    'bg-green-400 hover:bg-green-500'
                                }`}>
                                    {appliedJob.status.toUpperCase()}
                                </Badge>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}

export default AppliedJobTable