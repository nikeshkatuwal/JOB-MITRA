import React, { useState } from 'react';
import Navbar from './shared/Navbar';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { Button } from './ui/button';
import { Mail, Phone, Pen } from 'lucide-react';
import { useSelector } from 'react-redux';
import UpdateRecruiterProfileDialog from './UpdateRecruiterProfileDialog';

const RecruiterProfile = () => {
    const [open, setOpen] = useState(false);
    const { user } = useSelector(store => store.auth);

    return (
        <div>
            <Navbar />
            <div className='max-w-4xl mx-auto bg-white border border-gray-200 rounded-2xl my-5 p-8'>
                <div className='flex justify-between'>
                    <div className='flex items-center gap-4'>
                        <Avatar className="h-24 w-24">
                            <AvatarImage
                                src={user?.profile?.profilePhoto?.url || user?.profile?.profilePhoto || "https://www.shutterstock.com/image-vector/circle-line-simple-design-logo-600nw-2174926871.jpg"}
                                alt="profile"
                            />
                            <AvatarFallback>{user?.fullname?.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                            <h1 className='font-medium text-xl'>{user?.fullname}</h1>
                            <p className='text-gray-600'>{user?.role === 'recruiter' ? 'Recruiter' : ''}</p>
                        </div>
                    </div>
                    <Button onClick={() => setOpen(true)}>
                        <Pen className="mr-2 h-4 w-4" /> Edit Profile
                    </Button>
                </div>

                {/* Contact Information */}
                <div className='my-5 p-4 bg-gray-50 rounded-lg'>
                    <h2 className='font-semibold text-lg mb-3'>Contact Information</h2>
                    <div className='flex items-center gap-3 my-2'>
                        <Mail className="text-gray-600" />
                        <span>{user?.email}</span>
                    </div>
                    <div className='flex items-center gap-3 my-2'>
                        <Phone className="text-gray-600" />
                        <span>{user?.phoneNumber || 'Not provided'}</span>
                    </div>
                </div>

                {/* Bio Section */}
                {user?.profile?.bio && (
                    <div className='my-5 p-4 bg-gray-50 rounded-lg'>
                        <h2 className='font-semibold text-lg mb-3'>About</h2>
                        <p className='text-gray-700'>{user.profile.bio}</p>
                    </div>
                )}
            </div>
            <UpdateRecruiterProfileDialog open={open} setOpen={setOpen} />
        </div>
    );
};

export default RecruiterProfile;
