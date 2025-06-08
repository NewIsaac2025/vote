import React from 'react';
import { UserPlus, Shield, Vote, BarChart3, Wallet, CheckCircle, ArrowRight } from 'lucide-react';
import Card from '../UI/Card';

const HowItWorks: React.FC = () => {
  const steps = [
    {
      icon: UserPlus,
      title: 'Register & Verify',
      description: 'Create your account with university credentials and verify your email address.',
      details: [
        'Enter your personal information',
        'Verify your university email',
        'Complete identity verification'
      ]
    },
    {
      icon: Wallet,
      title: 'Connect Wallet',
      description: 'Link your MetaMask wallet to enable secure blockchain voting.',
      details: [
        'Install MetaMask browser extension',
        'Connect your wallet to the platform',
        'Secure your voting identity'
      ]
    },
    {
      icon: Vote,
      title: 'Cast Your Vote',
      description: 'Browse elections, review candidates, and cast your secure vote.',
      details: [
        'View active elections',
        'Review candidate profiles',
        'Cast your encrypted vote'
      ]
    },
    {
      icon: BarChart3,
      title: 'View Results',
      description: 'Watch real-time results and see transparent election outcomes.',
      details: [
        'Real-time vote counting',
        'Transparent result display',
        'Immutable vote records'
      ]
    }
  ];

  return (
    <section className="py-20 bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            How UniVote Works
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Experience secure, transparent voting in four simple steps. Our blockchain-powered platform ensures your vote is counted and protected.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div key={index} className="relative">
              <Card className="text-center h-full hover:shadow-xl transition-all duration-300 hover:scale-105 backdrop-blur-sm bg-white/90 border-white/20">
                <div className="relative mb-6">
                  <div className="bg-gradient-to-r from-blue-600 to-purple-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <step.icon className="h-8 w-8 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">
                    {index + 1}
                  </div>
                </div>
                
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{step.title}</h3>
                <p className="text-gray-600 mb-4">{step.description}</p>
                
                <ul className="text-left space-y-2">
                  {step.details.map((detail, detailIndex) => (
                    <li key={detailIndex} className="flex items-center text-sm text-gray-600">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                      {detail}
                    </li>
                  ))}
                </ul>
              </Card>
              
              {/* Arrow connector */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                  <ArrowRight className="h-6 w-6 text-blue-600" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Security Features */}
        <div className="mt-20">
          <div className="text-center mb-12">
            <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
              Built with Security in Mind
            </h3>
            <p className="text-lg text-gray-600">
              Every aspect of UniVote is designed to protect your vote and ensure election integrity
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="text-center backdrop-blur-sm bg-white/90 border-white/20">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-green-600" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">End-to-End Encryption</h4>
              <p className="text-gray-600">Your vote is encrypted from the moment you cast it until it's counted, ensuring complete privacy.</p>
            </Card>

            <Card className="text-center backdrop-blur-sm bg-white/90 border-white/20">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="h-8 w-8 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                </svg>
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Blockchain Immutability</h4>
              <p className="text-gray-600">Once cast, votes cannot be altered, deleted, or manipulated thanks to blockchain technology.</p>
            </Card>

            <Card className="text-center backdrop-blur-sm bg-white/90 border-white/20">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-purple-600" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Identity Verification</h4>
              <p className="text-gray-600">Multi-layer verification ensures only eligible students can vote, preventing fraud and duplicate voting.</p>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;