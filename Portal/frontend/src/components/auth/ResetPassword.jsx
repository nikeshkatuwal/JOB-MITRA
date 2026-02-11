import React, { useState } from "react";
import Navbar from "../shared/Navbar";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { USER_API_END_POINT } from "@/utils/constant";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import image from "../../assets/rb_21826.png";
import Logo from '../ui/Logo';

const ResetPassword = () => {
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const params = useParams();
    const navigate = useNavigate();

    const submitHandler = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }
        try {
            setLoading(true);
            const res = await axios.put(`${USER_API_END_POINT}/password/reset/${params.token}`, { password, confirmPassword }, {
                headers: {
                    "Content-Type": "application/json",
                },
                withCredentials: true,
            });
            if (res.data.success) {
                toast.success(res.data.message);
                navigate("/login");
            }
        } catch (error) {
            console.log(error);
            toast.error(error.response?.data?.message || "Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <Navbar />
            <div className="flex flex-col md:flex-row w-full md:w-4/5 lg:w-3/4 xl:w-2/3 gap-10 mx-auto mt-10 p-8 sm:p-16 lg:p-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl md:rounded-3xl shadow-lg items-center justify-center">
                <div className="text-center flex flex-col items-center mb-6 text-white">
                    <div className="w-full flex flex-col items-center">
                        <Logo size="large" />
                        <img src={image} alt="Illustration" className="w-full md:w-1/4 lg:w-[450px] hidden md:block mt-4" />
                    </div>
                </div>
                <div className="w-full md:w-1/2 flex flex-col items-center">
                    <form
                        onSubmit={submitHandler}
                        className="w-full bg-white rounded-lg shadow-md p-6 sm:p-10 space-y-4 sm:space-y-6"
                    >
                        <h1 className="font-bold text-2xl sm:text-3xl text-gray-700 text-center">Reset Password</h1>
                        <div>
                            <Label htmlFor="password">New Password</Label>
                            <Input
                                type="password"
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="mt-1 w-full"
                                placeholder="New Password"
                                required
                            />
                        </div>
                        <div>
                            <Label htmlFor="confirmPassword">Confirm Password</Label>
                            <Input
                                type="password"
                                id="confirmPassword"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="mt-1 w-full"
                                placeholder="Confirm Password"
                                required
                            />
                        </div>
                        {loading ? (
                            <Button className="w-full my-4">
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Resetting...
                            </Button>
                        ) : (
                            <Button
                                type="submit"
                                className="w-full my-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold rounded-lg shadow-md transition hover:shadow-lg"
                            >
                                Reset Password
                            </Button>
                        )}
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;
