import React from 'react';
import { Shield, Zap, Lock, Globe, Database, Cpu, Eye, Users } from 'lucide-react';
import Card from '../UI/Card';

const TechnologySection: React.FC = () => {
  const technologies = [
    {
      icon: Shield,
      title: 'Blockchain Security',
      description: 'Built on Ethereum blockchain for maximum security and transparency',
      features: [
        'Immutable vote records',
        'Cryptographic verification',
        'Decentralized validation',
        'Smart contract automation'
      ]
    },
    {
      icon: Database,
      title: 'Supabase Backend',
      description: 'Real-time database with row-level security and instant updates',
      features: [
        'Real-time synchronization',
        'Row-level security policies',
        'Automatic backups',
        'Edge functions for serverless logic'
      ]
    },
    {
      icon: Lock,
      title: 'MetaMask Integration',
      description: 'Secure wallet connection for blockchain-based voting',
      features: [
        'Hardware wallet support',
        'Private key management',
        'Transaction signing',
        'Multi-network compatibility'
      ]
    },
    {
      icon: Zap,
      title: 'React Frontend',
      description: 'Modern, responsive interface built with React and TypeScript',
      features: [
        'Real-time updates',
        'Mobile-responsive design',
        'Progressive Web App',
        'Offline capability'
      ]
    }
  ];

  const securityMeasures = [
    {
      icon: Eye,
      title: 'Complete Transparency',
      description: 'All votes are publicly verifiable on the blockchain while maintaining voter anonymity'
    },
    {
      icon: Users,
      title: 'One Student, One Vote',
      description: 'Advanced verification prevents duplicate voting and ensures election integrity'
    },
    {
      icon: Globe,
      title: 'Decentralized Network',
      description: 'No single point of failure with distributed blockchain infrastructure'
    },
    {
      icon: Cpu,
      title: 'Smart Contracts',
      description: 'Automated vote counting and result calculation with zero human intervention'
    }
  ];

  return (
    <section className="py-20 bg-gradient-to-br from-slate-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Technology Stack */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Powered by Cutting-Edge Technology
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            UniVote leverages the latest in blockchain, web, and security technologies to deliver a voting experience that's both secure and user-friendly.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-20">
          {technologies.map((tech, index) => (
            <Card key={index} className="backdrop-blur-sm bg-white/90 border-white/20 hover:shadow-xl transition-all duration-300">
              <div className="flex items-start space-x-4">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0">
                  <tech.icon className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{tech.title}</h3>
                  <p className="text-gray-600 mb-4">{tech.description}</p>
                  <ul className="space-y-2">
                    {tech.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center text-sm text-gray-600">
                        <div className="w-2 h-2 bg-blue-600 rounded-full mr-3"></div>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Security Measures */}
        <div className="text-center mb-16">
          <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
            Uncompromising Security
          </h3>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Every vote is protected by multiple layers of security, ensuring the integrity of the democratic process.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {securityMeasures.map((measure, index) => (
            <Card key={index} className="text-center backdrop-blur-sm bg-white/90 border-white/20 hover:shadow-lg transition-all duration-300">
              <div className="bg-gradient-to-r from-green-500 to-emerald-500 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                <measure.icon className="h-6 w-6 text-white" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">{measure.title}</h4>
              <p className="text-gray-600 text-sm">{measure.description}</p>
            </Card>
          ))}
        </div>

        {/* Immutability Explanation */}
        <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white backdrop-blur-sm border-white/20">
          <div className="text-center">
            <h3 className="text-2xl font-bold mb-4">Why Blockchain Makes Votes Immutable</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
              <div>
                <div className="bg-white/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Lock className="h-8 w-8" />
                </div>
                <h4 className="text-lg font-semibold mb-2">Cryptographic Hashing</h4>
                <p className="text-blue-100">Each vote is converted into a unique cryptographic hash that cannot be reversed or altered.</p>
              </div>
              <div>
                <div className="bg-white/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Database className="h-8 w-8" />
                </div>
                <h4 className="text-lg font-semibold mb-2">Distributed Ledger</h4>
                <p className="text-blue-100">Votes are stored across thousands of nodes, making it impossible to alter without consensus.</p>
              </div>
              <div>
                <div className="bg-white/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-8 w-8" />
                </div>
                <h4 className="text-lg font-semibold mb-2">Consensus Mechanism</h4>
                <p className="text-blue-100">Any attempt to change a vote would require controlling 51% of the network, which is practically impossible.</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Technical Specifications */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card className="backdrop-blur-sm bg-white/90 border-white/20">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Frontend Technologies</h4>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Framework:</span>
                <span className="font-medium">React 18 with TypeScript</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Styling:</span>
                <span className="font-medium">Tailwind CSS</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Build Tool:</span>
                <span className="font-medium">Vite</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Icons:</span>
                <span className="font-medium">Lucide React</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Routing:</span>
                <span className="font-medium">React Router v6</span>
              </div>
            </div>
          </Card>

          <Card className="backdrop-blur-sm bg-white/90 border-white/20">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Backend & Blockchain</h4>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Database:</span>
                <span className="font-medium">Supabase PostgreSQL</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Authentication:</span>
                <span className="font-medium">Supabase Auth</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Blockchain:</span>
                <span className="font-medium">Ethereum Compatible</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Wallet:</span>
                <span className="font-medium">MetaMask Integration</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Email Service:</span>
                <span className="font-medium">Resend API</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default TechnologySection;