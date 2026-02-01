'use client'

import { Rocket, Zap, Star, Globe, Coins, ArrowRight, Sparkles } from 'lucide-react'
import { useEffect, useState } from 'react'

export default function HomePage() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div className="relative min-h-screen">
      {/* Animated Stars Background */}
      <div className="stars">
        {mounted && [...Array(100)].map((_, i) => (
          <div
            key={i}
            className="star"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      {/* Nebula Effect */}
      <div className="nebula" />

      {/* Content */}
      <div className="relative z-10">
        {/* Hero Section */}
        <section className="min-h-screen flex items-center justify-center px-4">
          <div className="max-w-7xl mx-auto text-center">
            {/* Logo / Title */}
            <div className="mb-8 animate-float">
              <div className="inline-flex items-center gap-3 mb-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 via-blue-500 to-cyan-500 planet-glow flex items-center justify-center animate-spin-slow">
                  <Globe className="w-8 h-8 text-white" />
                </div>
              </div>
              <h1 className="text-7xl md:text-9xl font-bold mb-4">
                <span className="bg-gradient-to-r from-purple-400 via-cyan-400 to-pink-400 bg-clip-text text-transparent animate-pulse-glow">
                  YIELDVERSE
                </span>
              </h1>
              <p className="text-3xl md:text-5xl font-bold yes-glow text-cyan-400 mb-4">
                The YES Metaverse
              </p>
              <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto">
                Play Cosmic Games • Earn YES Tokens • Cashout Real Crypto
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <button className="group relative px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full font-bold text-lg hover:scale-105 transition-transform overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-purple-400 opacity-0 group-hover:opacity-100 transition-opacity blur-xl" />
                <span className="relative flex items-center gap-2">
                  <Rocket className="w-5 h-5" />
                  Enter the Metaverse
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
              </button>
              
              <button className="px-8 py-4 border-2 border-cyan-400 rounded-full font-bold text-lg hover:bg-cyan-400/10 transition-colors">
                Learn More
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
              <div className="bg-white/5 backdrop-blur-sm border border-purple-500/30 rounded-xl p-6 hover:border-purple-500 transition-colors">
                <div className="text-4xl font-bold text-purple-400 mb-2">2</div>
                <div className="text-gray-400">Active Games</div>
              </div>
              <div className="bg-white/5 backdrop-blur-sm border border-cyan-500/30 rounded-xl p-6 hover:border-cyan-500 transition-colors">
                <div className="text-4xl font-bold text-cyan-400 mb-2">∞</div>
                <div className="text-gray-400">YES Tokens</div>
              </div>
              <div className="bg-white/5 backdrop-blur-sm border border-pink-500/30 rounded-xl p-6 hover:border-pink-500 transition-colors">
                <div className="text-4xl font-bold text-pink-400 mb-2">24/7</div>
                <div className="text-gray-400">Play & Earn</div>
              </div>
              <div className="bg-white/5 backdrop-blur-sm border border-yellow-500/30 rounded-xl p-6 hover:border-yellow-500 transition-colors">
                <div className="text-4xl font-bold text-yellow-400 mb-2">100%</div>
                <div className="text-gray-400">Free to Play</div>
              </div>
            </div>
          </div>
        </section>

        {/* Games Section */}
        <section className="py-20 px-4">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-5xl md:text-6xl font-bold text-center mb-4">
              <span className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                Explore the Universe
              </span>
            </h2>
            <p className="text-xl text-gray-400 text-center mb-16">Choose your adventure across the cosmos</p>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Energy Empire Card */}
              <div className="group relative bg-gradient-to-br from-yellow-900/20 to-orange-900/20 backdrop-blur-sm border-2 border-yellow-500/30 rounded-3xl p-8 hover:border-yellow-500 transition-all hover:scale-105">
                <div className="absolute top-4 right-4">
                  <span className="px-4 py-1 bg-green-500 text-xs font-bold rounded-full animate-pulse">LIVE</span>
                </div>
                
                <div className="mb-6">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 energy-glow flex items-center justify-center mb-4">
                    <Zap className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-4xl font-bold text-yellow-400 mb-2">Energy Empire</h3>
                  <p className="text-gray-300 mb-4">Click to generate energy, craft fuel, activate autoclickers and dominate the energy cosmos!</p>
                </div>

                <div className="space-y-2 mb-6 text-sm">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-yellow-400" />
                    <span className="text-gray-400">Click & earn energy</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    <span className="text-gray-400">Craft rare fuel resources</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Coins className="w-4 h-4 text-cyan-400" />
                    <span className="text-gray-400">Convert 100 Fuel = 1 YES</span>
                  </div>
                </div>

                <button className="w-full py-4 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl font-bold text-lg hover:from-yellow-600 hover:to-orange-600 transition-all flex items-center justify-center gap-2">
                  <Rocket className="w-5 h-5" />
                  Play Now
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>

              {/* StarForge PTC Card */}
              <div className="group relative bg-gradient-to-br from-blue-900/20 to-purple-900/20 backdrop-blur-sm border-2 border-blue-500/30 rounded-3xl p-8 hover:border-blue-500 transition-all hover:scale-105">
                <div className="absolute top-4 right-4">
                  <span className="px-4 py-1 bg-yellow-500 text-xs font-bold rounded-full">COMING SOON</span>
                </div>
                
                <div className="mb-6">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 planet-glow flex items-center justify-center mb-4 animate-spin-slow">
                    <Star className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-4xl font-bold text-blue-400 mb-2">StarForge PTC</h3>
                  <p className="text-gray-300 mb-4">Watch ads, complete tasks, forge your stellar fortune in the cosmic economy!</p>
                </div>

                <div className="space-y-2 mb-6 text-sm">
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-blue-400" />
                    <span className="text-gray-400">Watch rewarded ads</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    <span className="text-gray-400">Complete daily tasks</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Coins className="w-4 h-4 text-cyan-400" />
                    <span className="text-gray-400">Convert 500 Stars = 1 YES</span>
                  </div>
                </div>

                <button className="w-full py-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl font-bold text-lg opacity-50 cursor-not-allowed flex items-center justify-center gap-2">
                  <Star className="w-5 h-5" />
                  Coming Soon
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-20 px-4">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-5xl md:text-6xl font-bold text-center mb-4">
              <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                How It Works
              </span>
            </h2>
            <p className="text-xl text-gray-400 text-center mb-16">Three simple steps to cosmic wealth</p>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 planet-glow flex items-center justify-center">
                  <span className="text-4xl font-bold">1</span>
                </div>
                <h3 className="text-2xl font-bold mb-4 text-purple-400">Play Games</h3>
                <p className="text-gray-400">Choose your game and start earning in-game resources. Click, farm, and dominate!</p>
              </div>

              <div className="text-center">
                <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-cyan-600 to-purple-600 planet-glow flex items-center justify-center">
                  <span className="text-4xl font-bold">2</span>
                </div>
                <h3 className="text-2xl font-bold mb-4 text-cyan-400">Convert to YES</h3>
                <p className="text-gray-400">Exchange your game resources for universal YES tokens across the metaverse.</p>
              </div>

              <div className="text-center">
                <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-pink-600 to-purple-600 planet-glow flex items-center justify-center">
                  <span className="text-4xl font-bold">3</span>
                </div>
                <h3 className="text-2xl font-bold mb-4 text-pink-400">Cashout Crypto</h3>
                <p className="text-gray-400">Convert YES tokens to Litecoin and withdraw to your wallet. Real money, real fast!</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 backdrop-blur-sm border-2 border-cyan-500 rounded-3xl p-12">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                <span className="yes-glow text-cyan-400">Ready to Join the YES Metaverse?</span>
              </h2>
              <p className="text-xl text-gray-300 mb-8">
                Start your cosmic journey today. Play, earn, and prosper!
              </p>
              <button className="px-12 py-5 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full font-bold text-xl hover:scale-105 transition-transform flex items-center gap-3 mx-auto">
                <Rocket className="w-6 h-6" />
                Launch into YieldVerse
                <Sparkles className="w-6 h-6" />
              </button>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-12 px-4 border-t border-gray-800">
          <div className="max-w-7xl mx-auto text-center">
            <p className="text-gray-500 mb-4">© 2026 YieldVerse Metaverse. All rights reserved.</p>
            <p className="text-sm text-gray-600">The future of Play-to-Earn gaming 🚀</p>
          </div>
        </footer>
      </div>
    </div>
  )
}
