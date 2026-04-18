import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  SignedIn,
  SignedOut,
  UserButton,
  SignIn,
  useUser,
} from "@clerk/clerk-react";
import { Button } from "./ui/button";
import { BriefcaseBusiness, Heart, PenBox, Home, Menu, X } from "lucide-react";

const Header = () => {
  const [showSignIn, setShowSignIn] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [search, setSearch] = useSearchParams();
  const { user } = useUser();

  useEffect(() => {
    if (search.get("sign-in")) {
      setShowSignIn(true);
    }
  }, [search]);

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      setShowSignIn(false);
      setSearch({});
    }
  };

  return (
    <>
      <nav className="py-3 px-4 flex justify-between items-center relative">
        
        {/* Logo */}
        <Link to="/">
          <img src="/logo.png" className="h-14 sm:h-20" alt="Hirrd Logo" />
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex gap-3 items-center">
          <SignedOut>
            <Link to="/">
              <Button variant="outline" className="rounded-full flex items-center gap-2">
                <Home size={16} /> Home
              </Button>
            </Link>
            <Button variant="outline" onClick={() => setShowSignIn(true)}>
              Login
            </Button>
          </SignedOut>

          <SignedIn>
            <Link to="/">
              <Button variant="outline" className="rounded-full flex items-center gap-2">
                <Home size={16} /> Home
              </Button>
            </Link>

            {user?.unsafeMetadata?.role === "recruiter" && (
              <Link to="/post-job">
                <Button variant="destructive" className="rounded-full flex items-center gap-2">
                  <PenBox size={18} /> Post a Job
                </Button>
              </Link>
            )}

            <Link to="/my-jobs">
              <Button variant="outline" className="rounded-full flex items-center gap-2">
                <BriefcaseBusiness size={18} /> My Jobs
              </Button>
            </Link>

            <Link to="/saved-jobs">
              <Button variant="outline" className="rounded-full flex items-center gap-2">
                <Heart size={18} /> Saved Jobs
              </Button>
            </Link>

            <UserButton appearance={{ elements: { avatarBox: "w-10 h-10" } }} />
          </SignedIn>
        </div>

        {/* Mobile Right Side */}
        <div className="flex md:hidden items-center gap-3">
          <SignedIn>
            <UserButton appearance={{ elements: { avatarBox: "w-9 h-9" } }} />
          </SignedIn>
          <SignedOut>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSignIn(true)}
            >
              Login
            </Button>
          </SignedOut>

          {/* Hamburger */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="text-white p-1 rounded-md focus:outline-none"
          >
            {menuOpen ? <X size={26} /> : <Menu size={26} />}
          </button>
        </div>

        {/* Mobile Dropdown */}
        {menuOpen && (
          <div className="absolute top-full left-0 w-full bg-gray-950 border-t border-gray-800 z-50 flex flex-col gap-2 px-5 py-4 md:hidden shadow-xl">
            
            <Link
              to="/"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-3 text-white hover:text-gray-300 py-2 border-b border-gray-800"
            >
              <Home size={18} /> Home
            </Link>

            <SignedIn>
              {user?.unsafeMetadata?.role === "recruiter" && (
                <Link
                  to="/post-job"
                  onClick={() => setMenuOpen(false)}
                  className="w-full"
                >
                  <Button variant="destructive" className="rounded-full w-full flex items-center gap-2">
                    <PenBox size={18} /> Post a Job
                  </Button>
                </Link>
              )}

              <Link
                to="/my-jobs"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 text-white hover:text-gray-300 py-2 border-b border-gray-800"
              >
                <BriefcaseBusiness size={18} /> My Jobs
              </Link>

              <Link
                to="/saved-jobs"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 text-white hover:text-gray-300 py-2"
              >
                <Heart size={18} /> Saved Jobs
              </Link>
            </SignedIn>

            <SignedOut>
              <button
                onClick={() => {
                  setShowSignIn(true);
                  setMenuOpen(false);
                }}
                className="flex items-center gap-3 text-white hover:text-gray-300 py-2"
              >
                Login
              </button>
            </SignedOut>
          </div>
        )}
      </nav>

      {showSignIn && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
          onClick={handleOverlayClick}
        >
          <SignIn
            signUpForceRedirectUrl="/onboarding"
            fallbackRedirectUrl="/onboarding"
          />
        </div>
      )}
    </>
  );
};

export default Header;

