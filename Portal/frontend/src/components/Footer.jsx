import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Twitter, Linkedin, Instagram, Mail, Phone, MapPin } from 'lucide-react';

const Footer = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-white border-t border-gray-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {/* Company Info */}
                    <div className="space-y-4">
                        <Link to="/" className="block">
                            <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent">
                                Job Mitra
                            </span>
                        </Link>
                        <p className="text-sm text-gray-600 leading-relaxed">
                            Connecting talented professionals with their dream careers. Find the perfect job opportunity or hire the best talent.
                        </p>
                        <div className="flex space-x-4">
                            <a href="#" className="text-gray-400 hover:text-purple-600 transition-colors">
                                <Facebook className="w-5 h-5" />
                            </a>
                            <a href="#" className="text-gray-400 hover:text-purple-600 transition-colors">
                                <Twitter className="w-5 h-5" />
                            </a>
                            <a href="#" className="text-gray-400 hover:text-purple-600 transition-colors">
                                <Linkedin className="w-5 h-5" />
                            </a>
                            <a href="#" className="text-gray-400 hover:text-purple-600 transition-colors">
                                <Instagram className="w-5 h-5" />
                            </a>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
                            Quick Links
                        </h3>
                        <ul className="space-y-3">
                            <li>
                                <Link to="/jobs" className="text-gray-600 hover:text-purple-600 text-sm transition-colors">
                                    Browse Jobs
                                </Link>
                            </li>
                            <li>
                                <Link to="/post-job" className="text-gray-600 hover:text-purple-600 text-sm transition-colors">
                                    Post a Job
                                </Link>
                            </li>
                            <li>
                                <Link to="/companies" className="text-gray-600 hover:text-purple-600 text-sm transition-colors">
                                    Companies
                                </Link>
                            </li>
                            <li>
                                <Link to="/about" className="text-gray-600 hover:text-purple-600 text-sm transition-colors">
                                    About Us
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Resources */}
                    <div>
                        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
                            Resources
                        </h3>
                        <ul className="space-y-3">
                            <li>
                                <Link to="/privacy" className="text-gray-600 hover:text-purple-600 text-sm transition-colors">
                                    Privacy Policy
                                </Link>
                            </li>
                            <li>
                                <Link to="/terms" className="text-gray-600 hover:text-purple-600 text-sm transition-colors">
                                    Terms of Service
                                </Link>
                            </li>
                            <li>
                                <Link to="/faq" className="text-gray-600 hover:text-purple-600 text-sm transition-colors">
                                    FAQ
                                </Link>
                            </li>
                            <li>
                                <Link to="/blog" className="text-gray-600 hover:text-purple-600 text-sm transition-colors">
                                    Blog
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Contact Info */}
                    <div>
                        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
                            Contact Us
                        </h3>
                        <ul className="space-y-3">
                            <li className="flex items-center space-x-3 text-gray-600 text-sm">
                                <Mail className="w-5 h-5" />
                                <span>support@jobmitra.com</span>
                            </li>
                            <li className="flex items-center space-x-3 text-gray-600 text-sm">
                                <Phone className="w-5 h-5" />
                                <span>+977 123 456 7890</span>
                            </li>
                            <li className="flex items-start space-x-3 text-gray-600 text-sm">
                                <MapPin className="w-5 h-5 mt-1" />
                                <span>123 Gorkha department ,<br />Itahari, Nepal </span>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="mt-12 pt-8 border-t border-gray-100">
                    <div className="flex flex-col md:flex-row justify-between items-center">
                        <p className="text-sm text-gray-600">
                            © {currentYear} Job Mitra. All rights reserved.
                        </p>
                        <div className="mt-4 md:mt-0">
                            <ul className="flex space-x-6">
                                <li>
                                    <Link to="/privacy" className="text-sm text-gray-600 hover:text-purple-600 transition-colors">
                                        Privacy
                                    </Link>
                                </li>
                                <li>
                                    <Link to="/terms" className="text-sm text-gray-600 hover:text-purple-600 transition-colors">
                                        Terms
                                    </Link>
                                </li>
                                <li>
                                    <Link to="/sitemap" className="text-sm text-gray-600 hover:text-purple-600 transition-colors">
                                        Sitemap
                                    </Link>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;