import React, { useState, useEffect, useRef } from 'react';
import { Instagram, Clock, MessageCircle, Brain, Timer, Quote, Sparkles, ChevronRight, Shield, X, Mail, User, Download } from 'lucide-react';

// Mock data for recent signups when in development mode
const initialSignups = process.env.NODE_ENV === 'development' ? [
  { name: "Sarah Johnson", timestamp: new Date(Date.now() - 120000).toISOString() },
  { name: "Michael Chen", timestamp: new Date(Date.now() - 240000).toISOString() },
  { name: "Aisha Patel", timestamp: new Date(Date.now() - 360000).toISOString() }
] : [];

type Signup = {
  name: string;
  timestamp: string;
  email?: string;
};

// SignupNotification component
function SignupNotification({ signup, formatTimeAgo }: { 
  signup: Signup; 
  formatTimeAgo: (timestamp: string) => string;
}) {
  return (
    <div className="bg-white/90 rounded-full shadow-sm py-2 px-4 absolute animate-signup">
      <div className="flex items-center gap-3">
        <div className="bg-primary-100 rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">
          <User className="w-4 h-4 text-primary-600" />
        </div>
        <div className="text-left">
          <span className="font-medium text-dark-800">
            {signup.name} 
          </span>
          <span className="text-sm text-dark-500 ml-1">
            has taken steps to save their valuable time
          </span>
          <span className="text-xs text-dark-400 ml-2">
            {formatTimeAgo(signup.timestamp)}
          </span>
        </div>
      </div>
    </div>
  );
}

function App() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [signups, setSignups] = useState<Signup[]>(initialSignups);
  const [showThankYou, setShowThankYou] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentSignupIndex, setCurrentSignupIndex] = useState(0);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const downloadLinkRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch recent signups from the API
  useEffect(() => {
    const fetchRecentSignups = async () => {
      try {
        const response = await fetch('/api/recent-signups');
        if (response.ok) {
          const data = await response.json();
          setSignups(prevSignups => {
            // Use API data in production, keep initial signups in development if API returns empty
            return data.length > 0 ? data : prevSignups;
          });
        }
      } catch (error) {
        console.error('Failed to fetch recent signups:', error);
      }
    };

    // Try to fetch in all environments
    fetchRecentSignups();
  }, []);

  // Rotate through signups to show one at a time
  useEffect(() => {
    if (signups.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentSignupIndex(prev => (prev + 1) % signups.length);
    }, 4000); // Show each signup for 4 seconds
    
    return () => clearInterval(interval);
  }, [signups.length]);

  // Set document title
  useEffect(() => {
    document.title = showThankYou 
      ? `Thanks for joining, ${name}! | Insta-Detoxify` 
      : "Insta-Detoxify | Break Free from Endless Scrolling";
    
    return () => {
      document.title = "Insta-Detoxify | Break Free from Endless Scrolling";
    };
  }, [showThankYou, name]);

  // Function to format time in "X minutes ago" format
  const formatTimeAgo = (timestamp: string) => {
    const date = new Date(timestamp);
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    
    let interval = seconds / 60;
    if (interval < 60) {
      const minutes = Math.floor(interval);
      return minutes === 1 ? '1 minute ago' : `${minutes} minutes ago`;
    }
    
    interval = seconds / 3600;
    if (interval < 24) {
      const hours = Math.floor(interval);
      return hours === 1 ? '1 hour ago' : `${hours} hours ago`;
    }
    
    const days = Math.floor(interval / 24);
    return days === 1 ? '1 day ago' : `${days} days ago`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Create new signup object
    const newSignup: Signup = { 
      name, 
      email,
      timestamp: new Date().toISOString() 
    };
    
    try {
      // Submit to the API endpoint
      const response = await fetch('/api/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newSignup),
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Add new signup to the list (without email for display)
        const displaySignup = { name, timestamp: newSignup.timestamp };
        setSignups(prev => [displaySignup, ...prev]);
        setCurrentSignupIndex(0); // Show the new signup immediately
        setShowModal(false);
        setShowThankYou(true);
        
        // Set download URL from API response
        if (data.downloadUrl) {
          setDownloadUrl(data.downloadUrl);
          setIsDownloading(true);
          
          // Trigger download after a short delay
          setTimeout(() => {
            if (downloadLinkRef.current) {
              downloadLinkRef.current.click();
              setIsDownloading(false);
            }
          }, 1000);
        }
        
        // Reset form
        setName("");
        setEmail("");
        
        // Hide thank you message after 5 seconds
        setTimeout(() => {
          setShowThankYou(false);
        }, 5000);
      } else {
        console.error('Failed to submit signup');
        alert('Something went wrong. Please try again.');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 via-dark-50 to-primary-50 overflow-hidden">
      {/* Hidden download link */}
      <a 
        ref={downloadLinkRef} 
        href={downloadUrl || '#'} 
        download="insta-detoxify.apk" 
        className="hidden"
        aria-hidden="true"
      >
        Download
      </a>
      
      {/* Floating Shapes Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-float"></div>
        <div className="absolute top-40 right-20 w-96 h-96 bg-secondary-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-float" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-accent-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-float" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Navigation */}
      <nav className={`fixed w-full z-50 transition-all duration-300 ${isScrolled ? 'glass-effect shadow-lg' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Instagram className="w-8 h-8 text-primary-600" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-secondary-500 rounded-full animate-pulse-glow"></div>
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold text-gradient">
                  insta -- detoxify
                </span>
                <span className="text-xs text-dark-500 -mt-1">Break free from endless scrolling</span>
              </div>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-dark-600 hover:text-primary-600 transition">Features</a>
              <a href="#how-it-works" className="text-dark-600 hover:text-primary-600 transition">How it works</a>
              <a href="#privacy" className="text-dark-600 hover:text-primary-600 transition">Privacy</a>
              <button onClick={() => setShowModal(true)} className="btn-primary">
                Get Started
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="relative z-10">
        {/* Hero Section */}
        <section className="pt-32 pb-20 px-4">
          <div className="max-w-7xl mx-auto text-center">
            <div className="inline-block mb-4 px-4 py-1.5 bg-gradient-to-r from-primary-50 to-secondary-50 rounded-full">
              <span className="text-sm font-medium text-primary-600">✨ Your digital wellness companion</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold mb-8 text-gradient leading-tight">
              Transform Your
              <br />Instagram Experience
            </h1>
            <p className="text-xl text-dark-600 mb-12 max-w-2xl mx-auto leading-relaxed">
              Break free from endless scrolling. Our intelligent time management system helps you stay focused and mindful.
            </p>
            <div className="flex justify-center">
              <button onClick={() => setShowModal(true)} className="group btn-primary px-8 py-4 text-lg">
                Download Free
                <ChevronRight className="inline-block ml-2 w-5 h-5 transform group-hover:translate-x-1 transition" />
              </button>
            </div>
            <div className="mt-8 flex flex-col gap-2 items-center">
              <div className="inline-flex items-center px-4 py-2 bg-primary-50 rounded-full">
                <Shield className="w-5 h-5 text-primary-600 mr-2" />
                <span className="text-sm font-medium text-dark-700">100% Safe • Zero Data Collection</span>
              </div>
              <div className="inline-flex items-center px-4 py-2 bg-accent-50 rounded-full">
                <span className="text-sm font-medium text-accent-700">✓ Completely Free • No Hidden Charges</span>
              </div>
            </div>
            
            {/* Compact Recent sign-ups display */}
            {signups.length > 0 && (
              <div className="mt-8 h-16 relative overflow-hidden"> {/* Fixed smaller height container */}
                <div className="flex justify-center">
                  <SignupNotification 
                    key={`signup-${currentSignupIndex}-${signups[currentSignupIndex].name}`}
                    signup={signups[currentSignupIndex]}
                    formatTimeAgo={formatTimeAgo}
                  />
                </div>
              </div>
            )}

            {/* Thank you message */}
            {showThankYou && (
              <div className="mt-8 animate-in fade-in slide-in-from-bottom duration-500">
                <div className="bg-primary-50 text-primary-800 rounded-lg px-6 py-4 inline-block">
                  <p className="font-medium">
                    Thanks for joining, {signups[0]?.name}! You've taken the first step towards digital wellness.
                  </p>
                  {isDownloading ? (
                    <div className="flex items-center justify-center mt-4 text-sm bg-white/50 p-3 rounded-lg">
                      <svg className="animate-spin mr-3 h-5 w-5 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Starting download... Please wait</span>
                    </div>
                  ) : downloadUrl ? (
                    <div className="mt-4 text-sm bg-white/50 p-3 rounded-lg">
                      <div className="flex items-center justify-center mb-2 text-primary-700">
                        <Download className="w-5 h-5 mr-2" />
                        <span className="font-medium">Download Started</span>
                      </div>
                      <p className="text-dark-600 mb-2">
                        Your download should begin automatically. If it doesn't:
                      </p>
                      <a 
                        href={downloadUrl} 
                        download="insta-detoxify.apk"
                        className="bg-primary-600 text-white px-3 py-1.5 rounded-full text-sm inline-flex items-center justify-center hover:bg-primary-700 transition-colors"
                        onClick={() => setDownloadUrl(null)}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download Again
                      </a>
                      <p className="text-xs text-dark-500 mt-2">
                        After download completes, open the APK file on your Android device to install.
                      </p>
                    </div>
                  ) : null}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-20" id="features">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4 text-dark-800">Powerful Features</h2>
              <p className="text-xl text-dark-600 max-w-2xl mx-auto">
                Everything you need to maintain a healthy relationship with social media.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              <FeatureCard
                icon={<Timer className="w-10 h-10" />}
                title="5/5 Time Management"
                description="Smart time tracking with 5-minute focus sessions followed by mindful breaks."
                gradient="from-primary-500 to-primary-600"
              />
              <FeatureCard
                icon={<Quote className="w-10 h-10" />}
                title="Daily Inspiration"
                description="Curated quotes and mindfulness prompts during your cooldown periods."
                gradient="from-secondary-500 to-secondary-600"
              />
              <FeatureCard
                icon={<MessageCircle className="w-10 h-10" />}
                title="Message-Only Mode"
                description="Stay connected with friends without the distractions of the feed."
                gradient="from-accent-500 to-accent-600"
              />
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-20 bg-gradient-to-b from-primary-50 to-white" id="how-it-works">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4 text-dark-800">How It Works</h2>
              <p className="text-xl text-dark-600 max-w-2xl mx-auto">
                Three simple steps to transform your Instagram habits.
              </p>
            </div>
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-12">
                <Step
                  number="01"
                  title="Set Your Intentions"
                  description="Choose your mode and set daily goals for Instagram usage."
                  icon={<Brain className="w-6 h-6 text-primary-600" />}
                />
                <Step
                  number="02"
                  title="Stay Mindful"
                  description="Receive gentle reminders and insights about your usage patterns."
                  icon={<Clock className="w-6 h-6 text-primary-600" />}
                />
                <Step
                  number="03"
                  title="Transform Habits"
                  description="Build healthier social media habits with our guided approach."
                  icon={<Sparkles className="w-6 h-6 text-primary-600" />}
                />
              </div>
              <div className="relative">
                <img
                  src="https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&q=80&w=1740"
                  alt="Person using phone mindfully"
                  className="rounded-2xl shadow-2xl"
                />
                <div className="absolute -bottom-6 -right-6 glass-effect p-6 rounded-xl shadow-xl">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary-100 rounded-full">
                      <Clock className="w-6 h-6 text-primary-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-dark-900">Time Saved</div>
                      <div className="text-primary-600 font-bold">2+ hours daily</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Privacy & Security Section */}
        <section className="py-20 bg-white" id="privacy">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4 text-dark-800">Your Privacy Matters</h2>
              <p className="text-xl text-dark-600 max-w-2xl mx-auto">
                We're committed to protecting your privacy and ensuring your data stays yours.
              </p>
            </div>
            <div className="bg-primary-50 rounded-2xl p-8 md:p-12 shadow-lg">
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div>
                  <h3 className="text-2xl font-bold mb-4 text-dark-800">100% Safe & Free to Use</h3>
                  <ul className="space-y-4">
                    <li className="flex items-start">
                      <Shield className="w-6 h-6 text-primary-600 mt-1 mr-3 flex-shrink-0" />
                      <p className="text-dark-600">We collect zero data from the app, ensuring complete privacy.</p>
                    </li>
                    <li className="flex items-start">
                      <Shield className="w-6 h-6 text-primary-600 mt-1 mr-3 flex-shrink-0" />
                      <p className="text-dark-600">All processing happens locally on your device, nothing is sent to our servers.</p>
                    </li>
                    <li className="flex items-start">
                      <Shield className="w-6 h-6 text-primary-600 mt-1 mr-3 flex-shrink-0" />
                      <p className="text-dark-600">We only connect you safely to Instagram without capturing or storing credentials.</p>
                    </li>
                    <li className="flex items-start">
                      <Shield className="w-6 h-6 text-primary-600 mt-1 mr-3 flex-shrink-0" />
                      <p className="text-dark-600">Completely free to use – no subscriptions, no in-app purchases, no ads, no hidden charges.</p>
                    </li>
                  </ul>
                </div>
                <div className="relative">
                  <div className="bg-white rounded-2xl p-8 shadow-lg relative z-10">
                    <div className="flex justify-center mb-6">
                      <div className="p-4 bg-primary-100 rounded-full">
                        <Shield className="w-12 h-12 text-primary-600" />
                      </div>
                    </div>
                    <h4 className="text-xl font-semibold text-center mb-4">Our Promise</h4>
                    <p className="text-dark-600 text-center">We believe your social media experience should be private and controlled by you alone. That's why our app is completely free, with no hidden charges, and runs entirely on your device.</p>
                  </div>
                  <div className="absolute -bottom-3 -right-3 -left-3 top-3 bg-gradient-to-r from-primary-200 to-secondary-200 rounded-2xl -z-10"></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid md:grid-cols-3 gap-8 text-center">
              <StatCard number="10M+" label="Minutes Saved" />
              <StatCard number="50K+" label="Active Users" />
              <StatCard number="100%" label="Privacy Focused" />
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-r from-primary-50 via-white to-secondary-50">
          <div className="max-w-4xl mx-auto text-center px-4">
            <h2 className="text-4xl font-bold mb-6 text-dark-800">Ready to Take Back Control?</h2>
            <p className="text-xl text-dark-600 mb-12 max-w-2xl mx-auto">
              Transform your relationship with social media while keeping your data completely private.
            </p>
            <div className="flex justify-center">
              <button onClick={() => setShowModal(true)} className="btn-primary px-8 py-4 text-lg">
                Download Free
              </button>
            </div>
            <div className="mt-8 text-dark-500 text-sm">
              Safe, secure, and completely free forever.
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-white border-t border-gray-100 py-10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-center items-center mb-6">
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Instagram className="w-6 h-6 text-primary-600" />
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-secondary-500 rounded-full animate-pulse-glow"></div>
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-dark-800 text-gradient">insta -- detoxify</span>
                <span className="text-xs text-dark-500 -mt-1">Break free from endless scrolling</span>
              </div>
            </div>
          </div>
          <div className="text-center text-dark-600">
            <p>Transform your Instagram experience with mindful usage.</p>
            <p className="mt-6">© 2025 insta -- detoxify. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-dark-900/50 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 relative animate-in fade-in zoom-in-95 duration-300">
            <button 
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-dark-400 hover:text-dark-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            <h3 className="text-2xl font-bold text-dark-800 mb-6">Get Started</h3>
            
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label htmlFor="name" className="block text-dark-600 mb-2 text-sm font-medium">
                  Your Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-400 w-5 h-5" />
                  <input
                    type="text"
                    id="name"
                    className="w-full pl-10 pr-4 py-3 border border-dark-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition"
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
              </div>
              
              <div className="mb-6">
                <label htmlFor="email" className="block text-dark-600 mb-2 text-sm font-medium">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-400 w-5 h-5" />
                  <input
                    type="email"
                    id="email"
                    className="w-full pl-10 pr-4 py-3 border border-dark-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
              
              <div className="mb-6 text-dark-500 text-sm">
                <p>We only use your email to send you the download link. We never share your information with third parties.</p>
              </div>
              
              <button 
                type="submit"
                className="w-full btn-primary py-3 text-center relative"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </span>
                ) : "Download Now"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function FeatureCard({ 
  icon, 
  title, 
  description, 
  gradient 
}: { 
  icon: React.ReactNode; 
  title: string; 
  description: string; 
  gradient: string; 
}) {
  return (
    <div className="group p-8 bg-white rounded-2xl shadow-lg card-hover">
      <div className={`mb-6 inline-block p-3 rounded-lg bg-gradient-to-r ${gradient} text-white`}>
        {icon}
      </div>
      <h3 className="text-xl font-semibold mb-3 text-dark-800">{title}</h3>
      <p className="text-dark-600 leading-relaxed">{description}</p>
    </div>
  );
}

function Step({ 
  number, 
  title, 
  description, 
  icon 
}: { 
  number: string; 
  title: string; 
  description: string; 
  icon: React.ReactNode; 
}) {
  return (
    <div className="flex gap-6">
      <div className="flex-shrink-0 w-14 h-14 bg-primary-100 rounded-full flex items-center justify-center">
        {icon}
      </div>
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm font-semibold text-primary-600">Step {number}</span>
          <h3 className="text-xl font-semibold text-dark-800">{title}</h3>
        </div>
        <p className="text-dark-600">{description}</p>
      </div>
    </div>
  );
}

function StatCard({ 
  number, 
  label 
}: { 
  number: string; 
  label: string; 
}) {
  return (
    <div className="p-8 bg-gradient-to-br from-primary-50 to-white rounded-2xl shadow-lg hover:shadow-glow transition-shadow duration-300">
      <div className="text-4xl font-bold text-dark-800 mb-2">{number}</div>
      <div className="text-dark-600">{label}</div>
    </div>
  );
}

export default App;