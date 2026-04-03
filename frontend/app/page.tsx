'use client';
import Threads from '@/components/Threads';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FaMailBulk, FaShieldVirus } from "react-icons/fa";
import { TbReportSearch } from "react-icons/tb";
import { IoMdAnalytics } from "react-icons/io";
import { GiEyeTarget } from "react-icons/gi";
import { MdIntegrationInstructions } from "react-icons/md";

export default function HomePage() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const colorStyles = {
    indigo: {
      icon: "text-indigo-500 group-hover:text-indigo-600",
      border: "hover:border-indigo-300",
      gradient: "from-indigo-500/0 to-indigo-500/0 group-hover:from-indigo-500/5 group-hover:to-indigo-500/10",
    },
    purple: {
      icon: "text-purple-500 group-hover:text-purple-600",
      border: "hover:border-purple-300",
      gradient: "from-purple-500/0 to-purple-500/0 group-hover:from-purple-500/5 group-hover:to-purple-500/10",
    },
    blue: {
      icon: "text-blue-500 group-hover:text-blue-600",
      border: "hover:border-blue-300",
      gradient: "from-blue-500/0 to-blue-500/0 group-hover:from-blue-500/5 group-hover:to-blue-500/10",
    },
    pink: {
      icon: "text-pink-500 group-hover:text-pink-600",
      border: "hover:border-pink-300",
      gradient: "from-pink-500/0 to-pink-500/0 group-hover:from-pink-500/5 group-hover:to-pink-500/10",
    },
    green: {
      icon: "text-green-500 group-hover:text-green-600",
      border: "hover:border-green-300",
      gradient: "from-green-500/0 to-green-500/0 group-hover:from-green-500/5 group-hover:to-green-500/10",
    },
    orange: {
      icon: "text-orange-500 group-hover:text-orange-600",
      border: "hover:border-orange-300",
      gradient: "from-orange-500/0 to-orange-500/0 group-hover:from-orange-500/5 group-hover:to-orange-500/10",
    },
  };

  const Logo = ({ className = "w-8 h-auto" }) => (
    <svg
      viewBox="0 0 58 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M24.6625 0C29.5499 0.000157557 33.512 3.87456 33.5121 8.65224C33.5121 8.91866 33.4997 9.18398 33.4824 9.44828H40.9366C48.1871 9.44828 51.0342 18.6407 45.0014 22.5723L37.1131 27.7122C35.415 28.8193 35.8805 31.3743 37.8654 31.84C38.5143 31.9921 39.1997 31.8658 39.7475 31.4934L44.3242 28.1927C44.4979 28.0675 44.7074 28 44.9225 28H57.4922C57.9872 28 58.1886 28.6281 57.7838 28.909L44.4783 38.1397C41.99 39.8319 38.8796 40.4048 35.9321 39.7133C26.9186 37.5986 24.8061 26.0015 32.5185 20.9749L37.7818 17.5457H29.7048H24.5358C23.0515 17.5457 21.6504 17.1926 20.4171 16.5691C21.7314 17.4535 24.9805 18.4377 27.7216 18.6251C27.9658 18.6251 28.3625 18.8385 27.8901 19.3183L11.2952 35.7067C11.105 35.8945 10.847 36 10.578 36H0.507884C0.056246 36 -0.169872 35.4613 0.149574 35.1463L19.5219 16.0472C17.1349 14.4709 15.5652 11.8013 15.5649 8.77349C15.5649 3.92875 19.5825 0 24.5385 0H24.6625ZM24.8419 6.74915C23.6982 6.74915 22.771 7.35337 22.771 8.09871C22.7715 8.71319 23.4024 9.23009 24.2648 9.39292C24.3487 9.42847 24.4413 9.44828 24.5385 9.44828H25.1533C25.1544 9.44225 25.1535 9.43586 25.1546 9.42983C26.1495 9.33152 26.9122 8.77441 26.9127 8.09871C26.9127 7.35337 25.9855 6.74915 24.8419 6.74915Z"
        fill="currentColor"
      />
    </svg>
  );
  

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100">
      <nav
        className={`fixed top-0 w-full z-50 transition-all duration-300 ${
          scrolled
            ? "bg-white/80 backdrop-blur-md shadow-sm border-b border-slate-200"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-linear-to-br from-indigo-600 to-purple-600">
              <Logo className="w-5 h-auto text-white" />
            </div>
            <span className="text-lg font-semibold text-slate-900">
              PhishSim
            </span>
          </div>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#features" className="hover:text-indigo-600 transition">Features</a>
            <a href="#pricing" className="hover:text-indigo-600 transition">Pricing</a>
            <a href="#about" className="hover:text-indigo-600 transition">About</a>
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium text-slate-600 hover:text-indigo-600">
              Login
            </Link>
            <Link
              href="/login"
              className="px-4 py-2 rounded-lg bg-linear-to-r from-indigo-600 to-purple-600 text-white text-sm font-semibold"
            >
              Get Started
            </Link>
          </div>

          {/* Hamburger Button */}
          <button
            className="md:hidden flex flex-col gap-1"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <span className={`w-6 h-0.5 bg-slate-900 transition ${menuOpen ? "rotate-45 translate-y-1.5" : ""}`}></span>
            <span className={`w-6 h-0.5 bg-slate-900 transition ${menuOpen ? "opacity-0" : ""}`}></span>
            <span className={`w-6 h-0.5 bg-slate-900 transition ${menuOpen ? "-rotate-45 -translate-y-1.5" : ""}`}></span>
          </button>
        </div>

        {/* Mobile Menu */}
        <div
          className={`md:hidden transition-all duration-300 overflow-hidden ${
            menuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="px-6 pb-6 flex flex-col gap-4 bg-white/90 backdrop-blur-md border-t border-slate-200">
            
            <a href="#features" className="text-slate-700 hover:text-indigo-600">
              Features
            </a>
            <a href="#pricing" className="text-slate-700 hover:text-indigo-600">
              Pricing
            </a>
            <a href="#about" className="text-slate-700 hover:text-indigo-600">
              About
            </a>

            <Link
              href="/login"
              className="mt-2 text-slate-700 hover:text-indigo-600"
            >
              Login
            </Link>

            <Link
              href="/login"
              className="mt-2 px-4 py-3 rounded-lg bg-linear-to-r from-indigo-600 to-purple-600 text-white text-center font-semibold"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto relative">
          <div className="absolute inset-0 z-0 w-full h-100">
            {!isMobile && (
              <Threads
                amplitude={1}
                distance={0}
                enableMouseInteraction={false}
                color={[161, 0, 255]}
              />
            )
            }
          </div>
          
          <div className="relative z-10 text-center mb-16 pt-20">
            <div className="inline-flex items-center px-4 py-2 bg-indigo-50 rounded-full mb-6">
              <span className="text-sm font-semibold text-indigo-600">
                Protect Your Organization from Phishing Attacks
              </span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold text-slate-900 mb-6 leading-tight">
              Security Awareness
              <br />
              <span className="bg-linear-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Made Simple
              </span>
            </h1>
            
            <p className="text-xl text-slate-600 max-w-3xl mx-auto mb-8 leading-relaxed">
              Test, train, and transform your workforce into a human firewall.
              PhishSim delivers enterprise-grade phishing simulations with actionable insights.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              {/* <Link
                href="/login"
                className="px-8 py-4 bg-linear-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold text-lg hover:from-indigo-700 hover:to-purple-700 transition-all shadow-xl shadow-indigo-500/50 hover:shadow-2xl hover:shadow-indigo-600/50"
              >
                Get Started Free
              </Link>
              <button
                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                className="px-8 py-4 bg-white text-slate-700 rounded-xl font-semibold text-lg hover:bg-slate-50 transition-all border-2 border-slate-200"
              >
                Learn More
              </button> */}
              <Link
                href="/login"
                className="group inline-flex items-center gap-3 mb-6 px-4 py-3 rounded-full
                bg-[#060010cc] border border-white/10 text-gray-300
                shadow-[0_8px_32px_rgba(31,38,135,0.15)]
                backdrop-blur-md
                transition-all duration-300
                hover:scale-105 hover:bg-[#271e37] hover:shadow-[0_12px_40px_rgba(82,39,255,0.3)]"
              >
                {/* LEFT BADGE */}
                <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-purple-600 text-white text-xs font-semibold">
                  Login
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z" />
                    <path d="M20 2v4" />
                    <path d="M22 4h-4" />
                    <circle cx="4" cy="20" r="2" />
                  </svg>
                </span>

                {/* TEXT + ARROW */}
                <span className="flex items-center gap-2 text-sm font-medium">
                  Learn More

                  <svg
                    className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M13.22 19.03a.75.75 0 0 1 0-1.06L18.19 13H3.75a.75.75 0 0 1 0-1.5h14.44l-4.97-4.97a.749.749 0 0 1 .326-1.275.749.749 0 0 1 .734.215l6.25 6.25a.75.75 0 0 1 0 1.06l-6.25 6.25a.75.75 0 0 1-1.06 0Z" />
                  </svg>
                </span>
              </Link>
            </div>
          </div>

          {/* Dashboard Preview */}
          <div className="relative max-w-5xl mx-auto">
            <div className="absolute inset-0 bg-linear-to-r from-indigo-500 to-purple-500 rounded-3xl blur-3xl opacity-20"></div>
            <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
              <div className="bg-slate-800 px-4 py-3 flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
              </div>
              <div className="p-8 bg-linear-to-br from-slate-50 to-white">
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  {[
                    { label: 'Total Campaigns', value: '24', color: 'blue' },
                    { label: 'Emails Sent', value: '1,247', color: 'green' },
                    { label: 'Click Rate', value: '18.5%', color: 'yellow' },
                    { label: 'Improved', value: '+12%', color: 'purple' },
                  ].map((stat, i) => (
                    <div key={i} className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm">
                      <div className="text-xs text-slate-500 mb-1">{stat.label}</div>
                      <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
                    </div>
                  ))}
                </div>
                <div className="h-40 bg-linear-to-r from-indigo-100 to-purple-100 rounded-lg"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">
              Everything You Need to Combat Phishing
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Comprehensive tools to test, track, and train your team against phishing threats
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <FaMailBulk/>,
                title: 'Realistic Simulations',
                description: 'Create authentic phishing campaigns with customizable templates and scenarios',
                color: 'indigo',
              },
              {
                icon: <IoMdAnalytics/>,
                title: 'Advanced Analytics',
                description: 'Track opens, clicks, and submissions with detailed departmental breakdowns',
                color: 'purple',
              },
              {
                icon: <GiEyeTarget/>,
                title: 'Targeted Training',
                description: 'Identify vulnerable users and provide personalized security education',
                color: 'blue',
              },
              {
                icon: <TbReportSearch/>,
                title: 'Executive Reports',
                description: 'Generate board-ready reports with risk assessments and recommendations',
                color: 'pink',
              },
              {
                icon: <FaShieldVirus/>,
                title: 'Enterprise Security',
                description: 'Bank-grade encryption, GDPR compliant, and role-based access control',
                color: 'green',
              },
              {
                icon: <MdIntegrationInstructions/>,
                title: 'Easy Integration',
                description: 'Deploy in minutes with Docker, supports SMTP, and exports to CSV/PDF',
                color: 'orange',
              },
            ].map((feature, i) => {
              const styles = colorStyles[feature.color as keyof typeof colorStyles];
              return (
                  <div
                key={i}
                className={`group relative bg-linear-to-br from-slate-50 to-white p-8 rounded-2xl border border-slate-200 transition-all hover:shadow-xl ${styles.border}`}
              >
                <div className={`text-5xl mb-4 ${styles.icon}`}>
                  {feature.icon}
                </div>

                <h3 className="text-xl font-bold text-slate-900 mb-3">
                  {feature.title}
                </h3>

                <p className="text-slate-600 leading-relaxed">
                  {feature.description}
                </p>

                <div
                  className={`absolute inset-0 bg-linear-to-br ${styles.gradient} rounded-2xl transition-all`}
                ></div>
              </div>
              )
              
      })}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-linear-to-br from-indigo-600 to-purple-600">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-12 text-center">
            {[
              { number: '99.9%', label: 'Uptime Guarantee', sublabel: 'Enterprise reliability' },
              { number: '50K+', label: 'Employees Trained', sublabel: 'Across organizations' },
              { number: '85%', label: 'Avg. Improvement', sublabel: 'In click rates' },
            ].map((stat, i) => (
              <div key={i}>
                <div className="text-5xl font-bold text-white mb-2">{stat.number}</div>
                <div className="text-xl text-indigo-100 font-semibold mb-1">{stat.label}</div>
                <div className="text-indigo-200 text-sm">{stat.sublabel}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">
              Simple, Yet Powerful Workflow
            </h2>
            <p className="text-xl text-slate-600">
              From setup to reporting in 4 easy steps
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: '01', title: 'Create Campaign', description: 'Design your phishing email with our intuitive editor' },
              { step: '02', title: 'Upload Targets', description: 'Import employee data via CSV with department info' },
              { step: '03', title: 'Send & Track', description: 'Monitor real-time opens, clicks, and submissions' },
              { step: '04', title: 'Generate Reports', description: 'Get actionable insights and executive summaries' },
            ].map((item, i) => (
              <div key={i} className="relative">
                <div className="text-6xl font-bold text-indigo-100 mb-4">{item.step}</div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{item.title}</h3>
                <p className="text-slate-600">{item.description}</p>
                {i < 3 && (
                  <div className="hidden md:block absolute top-8 left-full w-full h-0.5 bg-linear-to-r from-indigo-300 to-transparent"></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-linear-to-br from-slate-900 to-slate-800">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Strengthen Your Security?
          </h2>
          <p className="text-xl text-slate-300 mb-8">
            Join organizations worldwide using PhishSim to build a culture of security awareness
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/login"
              className="px-8 py-4 bg-linear-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold text-lg hover:from-indigo-700 hover:to-purple-700 transition-all shadow-xl shadow-indigo-500/50"
            >
              Start Free Trial
            </Link>
          </div>
          <p className="mt-6 text-slate-400 text-sm">
            No credit card required • Setup in 5 minutes • Cancel anytime
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 bg-slate-900 border-t border-slate-800">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-2">
              <Logo className="w-8 h-auto text-indigo-600" />
              <span className="text-lg font-semibold text-slate-900">
                PhishSim
              </span>
            </div>
            <div className="text-slate-400 text-sm">
              © 2024 PhishSim. For authorized security training only.
            </div>
          </div>
          
        </div>
      </footer>
    </div>
  );
}