import Head from "next/head";
import Link from "next/link";
import { useState } from "react";
import { FiMail, FiCheck, FiCopy } from "react-icons/fi";
import { FaInstagram, FaDiscord, FaGithub } from "react-icons/fa";

export default function Contact() {
  const [copiedEmail, setCopiedEmail] = useState(false);

  const copyEmail = async () => {
    await navigator.clipboard.writeText("rebabel.development@gmail.com");
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const contactMethods = [
    {
      icon: FiMail,
      title: "Email",
      description: "rebabel.development@gmail.com",
      action: copyEmail,
      actionLabel: copiedEmail ? "Copied!" : "Copy Email",
      actionIcon: copiedEmail ? FiCheck : FiCopy,
    },
    {
      icon: FaDiscord,
      title: "Discord",
      description: "Join our community for help and discussions",
      href: "https://discord.gg/wYsuQrcY4a",
      actionLabel: "Join Server",
    },
    {
      icon: FaInstagram,
      title: "Instagram",
      description: "Follow us for updates and tips",
      href: "https://www.instagram.com/rebabelofficial/",
      actionLabel: "Follow",
    },
    {
      icon: FaGithub,
      title: "GitHub",
      description: "Check out our open source projects",
      href: "https://github.com/AidenH-dev",
      actionLabel: "Visit",
    },
  ];

  return (
    <>
      <Head>
        <title>Contact Us - ReBabel</title>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <meta
          name="description"
          content="Get in touch with the ReBabel team. Contact us via email, Discord, or social media for support, feedback, or questions about our Japanese learning platform."
        />
        <meta name="keywords" content="contact, support, rebabel, japanese learning, help" />
        <meta name="author" content="ReBabel" />
        <meta name="theme-color" content="#e30a5f" />

        <link rel="canonical" href="https://www.rebabel.org/contact" />

        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://rebabel.org/contact" />
        <meta property="og:title" content="Contact Us - ReBabel" />
        <meta
          property="og:description"
          content="Get in touch with the ReBabel team for support, feedback, or questions."
        />
        <meta property="og:site_name" content="ReBabel" />
        <meta property="og:locale" content="en_US" />

        <meta property="twitter:card" content="summary" />
        <meta property="twitter:url" content="https://rebabel.org/contact" />
        <meta property="twitter:title" content="Contact Us - ReBabel" />
        <meta
          property="twitter:description"
          content="Get in touch with the ReBabel team for support, feedback, or questions."
        />
      </Head>

      {/* Navbar */}
      <nav className="fixed top-0 w-full bg-white/95 backdrop-blur-sm border-b border-gray-200 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/">
              <span className="text-2xl font-bold text-[#e30a5f] cursor-pointer">
                ReBabel
              </span>
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/api/auth/login">
                <button className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900 font-medium">
                  Sign In
                </button>
              </Link>
              <Link href="/api/auth/login">
                <button className="px-4 py-2 text-sm bg-[#e30a5f] hover:bg-[#f41567] text-white font-medium rounded-lg transition-colors">
                  Join
                </button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex flex-col items-center justify-between overflow-hidden bg-gradient-to-b from-white to-gray-50 pt-5">
        {/* Header Section */}
        <section className="w-full px-4 sm:px-6 lg:px-8 pt-24 pb-12">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
              Contact Us
            </h1>
            <p className="text-lg text-gray-600">
              Have questions or feedback? We&apos;d love to hear from you.
            </p>
          </div>
        </section>

        {/* Contact Methods Section */}
        <section className="w-full px-4 sm:px-6 lg:px-8 pb-16">
          <div className="max-w-3xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {contactMethods.map((method, index) => {
                const Icon = method.icon;
                const ActionIcon = method.actionIcon;

                const content = (
                  <div className="flex flex-col h-full p-6 bg-white border border-gray-200 rounded-lg hover:border-[#e30a5f]/30 hover:shadow-md transition-all">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-lg bg-[#e30a5f]/10 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-6 h-6 text-[#e30a5f]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {method.title}
                        </h3>
                        <p className="text-sm text-gray-600 break-all">
                          {method.description}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      {method.action ? (
                        <button
                          onClick={method.action}
                          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          {ActionIcon && <ActionIcon className="w-4 h-4" />}
                          {method.actionLabel}
                        </button>
                      ) : (
                        <span className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-[#e30a5f] text-white hover:bg-[#f41567] transition-colors">
                          {method.actionLabel} &rarr;
                        </span>
                      )}
                    </div>
                  </div>
                );

                if (method.href) {
                  return (
                    <a
                      key={index}
                      href={method.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block"
                    >
                      {content}
                    </a>
                  );
                }

                return <div key={index}>{content}</div>;
              })}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="w-full py-12 bg-gradient-to-r from-[#e30a5f] to-[#f41567]">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
              Ready to start learning?
            </h2>
            <p className="text-white/90 mb-6 max-w-xl mx-auto">
              Join thousands of learners using ReBabel to master Japanese.
            </p>
            <Link href="/api/auth/login">
              <button className="px-8 py-3 bg-white text-[#e30a5f] font-semibold rounded-lg hover:bg-gray-100 transition-colors">
                Get Started Free
              </button>
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="text-xl font-bold text-[#e30a5f] mb-4">ReBabel</h3>
              <p className="text-sm text-gray-400">
                Building the future of Japanese learning.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <Link href="/" className="hover:text-white">
                    Home
                  </Link>
                </li>
                <li>
                  <Link href="/blog" className="hover:text-white">
                    Blog
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <Link href="/help" className="hover:text-white">
                    Help & FAQ
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-white">
                    Contact
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Community</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <a
                    href="https://discord.gg/wYsuQrcY4a"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white"
                  >
                    Discord
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-sm text-gray-400">
            <p>&copy; 2025 ReBabel. All rights reserved. Currently in beta development.</p>
          </div>
        </div>
      </footer>
    </>
  );
}
